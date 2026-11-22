<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class InkVoucher extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'department',
        'scope',
        'recipient_name',
        'requester_id',
        'requester_name',
        'status',
        'items',
        'notes',
        'approved_by_id',
        'approved_by_name',
        'dispensed_at',
        'date',
    ];

    protected $casts = [
        'items' => 'array',
        'date' => 'date:Y-m-d',
        'dispensed_at' => 'datetime',
    ];

    protected static function idPrefix(): string
    {
        return 'VCH';
    }
}
