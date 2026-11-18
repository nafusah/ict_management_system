<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InkLowStockMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array{
     *   orgName: string,
     *   items: list<array{
     *     id: string,
     *     model: string,
     *     brand: string,
     *     colorName: string,
     *     printerTypeName: ?string,
     *     quantity: int,
     *     alertThreshold: int,
     *   }>
     * }  $details
     */
    public function __construct(public array $details)
    {
    }

    public function envelope(): Envelope
    {
        $count = count($this->details['items']);
        $first = $this->details['items'][0]['model'] ?? 'أحبار';
        $subject = $count === 1
            ? "تنبيه نقص مخزون الحبر: {$first} (المتبقي {$this->details['items'][0]['quantity']})"
            : "تنبيه نقص مخزون الأحبار ({$count} أصناف تحتاج للتزويد)";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ink-low-stock',
            with: ['details' => $this->details],
        );
    }
}
