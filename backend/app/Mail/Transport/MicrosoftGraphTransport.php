<?php

namespace App\Mail\Transport;

use Closure;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

class MicrosoftGraphTransport extends AbstractTransport
{
    public function __construct(
        protected string $tenantId,
        protected string $clientId,
        protected string $clientSecret,
        protected string $userId,
        protected ?string $proxy = null,
        protected int $timeout = 15,
        protected int $connectTimeout = 5,
        protected int $retries = 2,
        protected int $retryDelay = 500,
        protected bool $verifySsl = true,
        protected ?string $caBundle = null,
    ) {
        parent::__construct();
        $this->proxy = $proxy ?: null;
        $this->caBundle = $caBundle ?: null;
        $this->retries = max(1, $retries);
    }

    protected function httpOptions(): array
    {
        $options = [
            'timeout' => $this->timeout,
            'connect_timeout' => $this->connectTimeout,
            'force_ip_resolve' => 'v4',
            'verify' => $this->caBundle ?: $this->verifySsl,
        ];

        if ($this->proxy) {
            $options['proxy'] = $this->proxy;
        }

        return $options;
    }

    protected function doSend(SentMessage $message): void
    {
        $this->ensureConfigured();

        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $token = $this->getAccessToken();
        $payload = $this->buildGraphPayload($email);

        $response = $this->request(fn () => Http::withToken($token)
            ->withOptions($this->httpOptions())
            ->post("https://graph.microsoft.com/v1.0/users/{$this->userId}/sendMail", [
                'message' => $payload,
                'saveToSentItems' => 'true',
            ]));

        if ($response->failed()) {
            throw new Exception('Failed to send email via Microsoft Graph: '.$response->body());
        }
    }

    protected function ensureConfigured(): void
    {
        $missing = array_filter([
            'MSGRAPH_TENANT_ID' => $this->tenantId === '',
            'MSGRAPH_CLIENT_ID' => $this->clientId === '',
            'MSGRAPH_CLIENT_SECRET' => $this->clientSecret === '',
            'MSGRAPH_USER_ID' => $this->userId === '',
        ]);

        if (! empty($missing)) {
            throw new Exception('Missing Microsoft Graph configuration: '.implode(', ', array_keys($missing)));
        }
    }

    protected function getAccessToken(): string
    {
        $response = $this->request(fn () => Http::asForm()
            ->withOptions($this->httpOptions())
            ->post("https://login.microsoftonline.com/{$this->tenantId}/oauth2/v2.0/token", [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'scope' => 'https://graph.microsoft.com/.default',
                'grant_type' => 'client_credentials',
            ]));

        if ($response->failed()) {
            throw new Exception('Failed to retrieve Microsoft Graph access token: '.$response->body());
        }

        $token = $response->json('access_token');
        if (! is_string($token) || $token === '') {
            throw new Exception('Microsoft Graph token response did not include an access_token.');
        }

        return $token;
    }

    protected function request(Closure $callback): Response
    {
        $attempt = 0;

        beginning:
        $attempt++;

        try {
            return $callback();
        } catch (ConnectionException $e) {
            if ($attempt < $this->retries) {
                usleep($this->retryDelay * 1000);

                goto beginning;
            }

            throw new Exception($this->describeConnectionFailure($e), 0, $e);
        }
    }

    protected function describeConnectionFailure(ConnectionException $e): string
    {
        $message = $e->getMessage();

        $hint = match (true) {
            str_contains($message, 'Could not resolve host'),
            str_contains($message, 'Resolving timed out') => 'تعذر الوصول إلى خدمات مايكروسوفت: الخادم لا يستطيع حل أسماء النطاقات (DNS). تأكد من إعدادات DNS أو اضبط MSGRAPH_PROXY.',

            str_contains($message, 'Connection timed out'),
            str_contains($message, 'Operation timed out') => 'انتهت مهلة الاتصال بخدمات مايكروسوفت بعد '.$this->connectTimeout.' ثانية. تحقق من جدار الحماية أو اضبط MSGRAPH_PROXY.',

            str_contains($message, 'Connection refused') => 'تم رفض الاتصال بخدمات مايكروسوفت. تحقق من جدار الحماية أو اضبط MSGRAPH_PROXY.',

            default => 'فشل الاتصال بخدمات مايكروسوفت:',
        };

        return $hint.' — '.$message;
    }

    protected function buildGraphPayload(Email $email): array
    {
        $payload = [
            'subject' => $email->getSubject() ?? '',
            'body' => [
                'contentType' => $email->getHtmlBody() ? 'HTML' : 'Text',
                'content' => $email->getHtmlBody() ?: ($email->getTextBody() ?? ''),
            ],
            'toRecipients' => $this->mapAddresses($email->getTo()),
        ];

        if ($email->getCc()) {
            $payload['ccRecipients'] = $this->mapAddresses($email->getCc());
        }

        if ($email->getBcc()) {
            $payload['bccRecipients'] = $this->mapAddresses($email->getBcc());
        }

        if ($email->getReplyTo()) {
            $payload['replyTo'] = $this->mapAddresses($email->getReplyTo());
        }

        $attachments = [];
        foreach ($email->getAttachments() as $attachment) {
            $attachments[] = [
                '@odata.type' => '#microsoft.graph.fileAttachment',
                'name' => $attachment->getFilename() ?: 'attachment',
                'contentType' => $attachment->getMediaType().'/'.$attachment->getMediaSubtype(),
                'contentBytes' => base64_encode($attachment->getBody()),
            ];
        }

        if (! empty($attachments)) {
            $payload['attachments'] = $attachments;
            $payload['hasAttachments'] = true;
        }

        return $payload;
    }

    protected function mapAddresses(array $addresses): array
    {
        return array_map(fn ($address) => [
            'emailAddress' => [
                'address' => $address->getAddress(),
                'name' => $address->getName() ?: null,
            ],
        ], $addresses);
    }

    public function __toString(): string
    {
        return 'msgraph';
    }
}
