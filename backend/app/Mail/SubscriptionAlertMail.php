<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionAlertMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array{
     *   orgName: string,
     *   title: string,
     *   subtitle: string,
     *   tone: 'red'|'amber'|'slate',
     *   items: list<array{
     *     serviceName: string,
     *     provider: string,
     *     location: ?string,
     *     poNumber: ?string,
     *     endDate: string,
     *     daysRemaining: int,
     *     statusLabel: string,
     *     isExpired: bool,
     *   }>
     * }  $details
     */
    public function __construct(public array $details)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->details['title'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-alert',
            with: ['details' => $this->details],
        );
    }
}
