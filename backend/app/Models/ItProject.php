<?php

namespace App\Models;

use App\Models\Concerns\HasPrefixedId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItProject extends Model
{
    use HasPrefixedId;
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'it_projects';

    protected $fillable = [
        'id',
        'name',
        'description',
        'objective_id',
        'manager',
        'department',
        'start_date',
        'end_date',
        'budget',
        'priority',
        'status',
        'progress',
        'milestones',
        'risks',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'budget' => 'float',
        'progress' => 'integer',
        'milestones' => 'array',
        'risks' => 'array',
    ];

    protected static function idPrefix(): string
    {
        return 'PRJ';
    }
}
