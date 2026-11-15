<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;

class Ink extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'brand', 'model', 'color', 'quantity', 'alert_threshold'];

    protected $casts = [
        'quantity' => 'integer',
        'alert_threshold' => 'integer',
    ];

    protected static function idPrefix(): string
    {
        return 'INK';
    }
}
