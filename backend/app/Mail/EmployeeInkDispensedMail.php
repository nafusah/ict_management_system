<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeInkDispensedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array{
     *   orgName: string,
     *   recipientName: ?string,
     *   department: string,
     *   date: string,
     *   items: list<array{
     *     model: string,
     *     brand: string,
     *     colorName: string,
     *     printerTypeName: ?string,
     *     dispensedQty: int,
     *   }>
     * }  $details
     */
    public function __construct(public array $details)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'إشعار صرف وتركيب حبر للطابعة',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.employee-ink-dispensed',
            with: ['details' => $this->details],
        );
    }
}
