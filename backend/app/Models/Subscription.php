<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_name',
        'provider',
        'category',
        'start_date',
        'end_date',
        'seats',
        'annual_cost',
        'department',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'seats' => 'integer',
        'annual_cost' => 'float',
    ];

    protected static function idPrefix(): string
    {
        return 'SUB';
    }
}
