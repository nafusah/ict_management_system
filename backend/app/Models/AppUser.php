<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AppUser extends Model
{
    use HasPrefixedId;
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'email', 'password', 'department', 'active', 'permissions'];

    protected $hidden = ['password'];

    protected $casts = [
        'active' => 'boolean',
        'permissions' => 'array',
        'password' => 'hashed',
    ];

    protected static function idPrefix(): string
    {
        return 'USR';
    }

    public function hasPermission(string $permission): bool
    {
        $perms = $this->permissions ?? [];
        return in_array($permission, $perms, true);
    }

    /** @param array<int, string> $permissions */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $perm) {
            if ($this->hasPermission($perm)) {
                return true;
            }
        }
        return false;
    }
}
