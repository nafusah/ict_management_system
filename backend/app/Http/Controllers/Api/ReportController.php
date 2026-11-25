<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * التقارير تُبنى في الواجهة من البيانات المتاحة للمستخدم،
 * لكن كل عملية طباعة تمر من هنا أولاً: يتحقق الخادم من صلاحية reports.print
 * ويسجل العملية في سجل التدقيق.
 */
class ReportController extends Controller
{
    public const SECTIONS = [
        'devices' => 'الأجهزة',
        'inks' => 'الأحبار',
        'subscriptions' => 'الاشتراكات',
        'governance' => 'التخطيط والحوكمة التقنية',
    ];

    public function logPrint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section' => ['required', Rule::in(array_keys(self::SECTIONS))],
            'filters' => ['nullable', 'string', 'max:500'],
            'rows' => ['nullable', 'integer', 'min:0'],
        ]);

        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');

        $summary = 'طباعة تقرير '.self::SECTIONS[$validated['section']];
        if (! empty($validated['filters'])) {
            $summary .= ' ('.$validated['filters'].')';
        }

        $log = AuditLog::record(
            $user,
            'printed',
            'report',
            $validated['section'],
            $summary,
            null,
            ['filters' => $validated['filters'] ?? null, 'rows' => $validated['rows'] ?? null],
            $request,
        );

        return response()->json([
            'ok' => true,
            'reference' => sprintf('RPT-%06d', $log->id),
            'printedAt' => $log->created_at?->toIso8601String(),
        ]);
    }
}
