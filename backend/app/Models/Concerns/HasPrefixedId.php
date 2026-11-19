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
            $model->id = static::nextPrefixedId();
        });
    }

    /**
     * يحسب الرقم التالي مع احتساب السجلات المحذوفة (Soft Deleted) أيضاً،
     * حتى لا يتكرر رقم صنف محذوف ويفشل الحفظ بخطأ تكرار المفتاح الأساسي.
     */
    public static function nextPrefixedId(): string
    {
        $prefix = static::idPrefix();
        $max = static::query()
            ->withoutGlobalScopes()
            ->where('id', 'like', $prefix.'-%')
            ->lockForUpdate()
            ->pluck('id')
            ->map(fn (string $id) => (int) preg_replace('/^'.preg_quote($prefix, '/').'-/', '', $id))
            ->max() ?? 0;

        return sprintf('%s-%03d', $prefix, $max + 1);
    }
}
