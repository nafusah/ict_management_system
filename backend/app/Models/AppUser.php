<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class AppUser extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'email', 'department', 'active', 'permissions'];

    protected $casts = [
        'active' => 'boolean',
        'permissions' => 'array',
    ];

    protected static function idPrefix(): string
    {
        return 'USR';
    }
}
