<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class InkColor extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'code', 'primary', 'light', 'border'];

    protected static function idPrefix(): string
    {
        return 'CLR';
    }
}
