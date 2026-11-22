<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class SubscriptionCategory extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'icon'];

    protected static function idPrefix(): string
    {
        return 'CAT';
    }
}
