<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceCustodyRecord extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'device_id',
        'action',
        'from_employee',
        'from_department',
        'to_employee',
        'to_department',
        'date',
        'condition',
        'notes',
        'performed_by_id',
        'performed_by_name',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    protected static function idPrefix(): string
    {
        return 'CUS';
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
