<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'entity_type',
        'entity_id',
        'summary',
        'old_values',
        'new_values',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * @param array<string, mixed>|null $oldValues
     * @param array<string, mixed>|null $newValues
     */
    public static function record(
        ?AppUser $user,
        string $action,
        string $entityType,
        ?string $entityId,
        string $summary,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null,
    ): self {
        return static::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'النظام',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'summary' => $summary,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'created_at' => now(),
        ]);
    }
}
