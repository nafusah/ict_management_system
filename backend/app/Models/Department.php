<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name'];

    protected static function idPrefix(): string
    {
        return 'DPT';
    }
}
