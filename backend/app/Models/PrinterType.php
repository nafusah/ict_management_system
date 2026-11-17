<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrinterType extends Model
{
    use HasPrefixedId;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'brand', 'image'];

    protected static function idPrefix(): string
    {
        return 'PRT';
    }

    public function inks(): HasMany
    {
        return $this->hasMany(Ink::class, 'printer_type_id');
    }
}
