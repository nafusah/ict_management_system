<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StrategicObjective extends Model
{
    use HasPrefixedId;
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'description',
        'pillar',
        'start_year',
        'end_year',
        'owner',
        'status',
        'kpis',
    ];

    protected $casts = [
        'start_year' => 'integer',
        'end_year' => 'integer',
        'kpis' => 'array',
    ];

    protected static function idPrefix(): string
    {
        return 'OBJ';
    }
}
