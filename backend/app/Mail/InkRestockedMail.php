<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InkRestockedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array{
     *   orgName: string,
     *   operationLabel: string,
     *   model: string,
     *   brand: string,
     *   colorName: string,
     *   printerTypeName: ?string,
     *   addedQty: int,
     *   beforeQty: int,
     *   afterQty: int,
     *   performedBy: string,
     *   date: string,
     * }  $details
     */
    public function __construct(public array $details)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "إشعار إضافة مخزون حبر: {$this->details['model']} (+{$this->details['addedQty']})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ink-restocked',
            with: ['details' => $this->details],
        );
    }
}
