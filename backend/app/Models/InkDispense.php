<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class InkDispense extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'ink_id', 'department', 'scope', 'recipient_name', 'quantity', 'date'];

    protected $casts = [
        'quantity' => 'integer',
        'date' => 'date:Y-m-d',
    ];

    protected static function idPrefix(): string
    {
        return 'DSP';
    }
}
