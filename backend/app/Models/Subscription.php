<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subscription extends Model
{
    use HasPrefixedId;
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_name',
        'provider',
        'category',
        'po_number',
        'start_date',
        'end_date',
        'alert_days_before',
        'seats',
        'annual_cost',
        'department',
        'service_location',
        'status',
        'cancelled',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'alert_days_before' => 'integer',
        'seats' => 'integer',
        'annual_cost' => 'float',
        'cancelled' => 'boolean',
    ];

    protected static function idPrefix(): string
    {
        return 'SUB';
    }
}
