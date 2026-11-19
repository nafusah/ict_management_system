<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InkDispensedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array{
     *   orgName: string,
     *   operationLabel: string,
     *   voucherId: ?string,
     *   requesterName: ?string,
     *   department: string,
     *   scopeLabel: string,
     *   recipientName: ?string,
     *   date: string,
     *   performedBy: string,
     *   notes: ?string,
     *   items: list<array{
     *     model: string,
     *     brand: string,
     *     colorName: string,
     *     printerTypeName: ?string,
     *     dispensedQty: int,
     *     remainingQty: int,
     *     alertThreshold: int,
     *     isLowStock: bool,
     *   }>
     * }  $details
     */
    public function __construct(public array $details)
    {
    }

    public function envelope(): Envelope
    {
        $firstModel = $this->details['items'][0]['model'] ?? 'حبر';
        $count = count($this->details['items']);
        $itemSummary = $count > 1 ? "{$firstModel} (+".($count - 1).' أصناف)' : $firstModel;

        return new Envelope(
            subject: "إشعار صرف حبر: {$itemSummary} — {$this->details['department']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ink-dispensed',
            with: ['details' => $this->details],
        );
    }

    /**
     * @return list<Attachment>
     */
    public function attachments(): array
    {
        $ref = $this->details['voucherId'] ?: str_replace('-', '', $this->details['date']);

        return [
            Attachment::fromData(
                fn () => view('emails.ink-receipt-attachment', ['details' => $this->details])->render(),
                "ink-receipt-{$ref}.html",
            )->withMime('text/html'),
        ];
    }
}
