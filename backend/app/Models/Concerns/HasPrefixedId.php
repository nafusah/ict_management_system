<?php

namespace App\Models\Concerns;

trait HasPrefixedId
{
    protected static function bootHasPrefixedId(): void
    {
        static::creating(function ($model) {
            if (! empty($model->id)) {
                return;
            }
            $prefix = static::idPrefix();
            $max = static::query()
                ->where('id', 'like', $prefix.'-%')
                ->pluck('id')
                ->map(fn (string $id) => (int) preg_replace('/^'.preg_quote($prefix, '/').'-/', '', $id))
                ->max() ?? 0;

            $model->id = sprintf('%s-%03d', $prefix, $max + 1);
        });
    }
}
