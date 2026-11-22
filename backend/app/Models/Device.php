<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use HasPrefixedId;
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'serial_number',
        'kind',
        'brand',
        'department',
        'employee',
        'classification',
        'location',
        'floor',
        'office_number',
    ];

    protected static function idPrefix(): string
    {
        return 'DEV';
    }
}
