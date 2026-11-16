<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private const DEFAULTS = [
        'org_name' => 'إدارة الاتصالات وتقنية المعلومات',
        'admin_name' => 'مدير النظام',
        'admin_email' => 'it-admin@company.local',
        'default_ink_threshold' => '3',
    ];

    public function index(): JsonResponse
    {
        $stored = AppSetting::query()->pluck('value', 'key')->toArray();

        return response()->json([
            'orgName' => $stored['org_name'] ?? self::DEFAULTS['org_name'],
            'adminName' => $stored['admin_name'] ?? self::DEFAULTS['admin_name'],
            'adminEmail' => $stored['admin_email'] ?? self::DEFAULTS['admin_email'],
            'defaultInkThreshold' => (int) ($stored['default_ink_threshold'] ?? self::DEFAULTS['default_ink_threshold']),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'orgName' => ['required', 'string', 'max:255'],
            'adminName' => ['required', 'string', 'max:255'],
            'adminEmail' => ['required', 'email', 'max:255'],
            'defaultInkThreshold' => ['required', 'integer', 'min:0'],
        ]);

        $pairs = [
            'org_name' => $validated['orgName'],
            'admin_name' => $validated['adminName'],
            'admin_email' => $validated['adminEmail'],
            'default_ink_threshold' => (string) $validated['defaultInkThreshold'],
        ];

        foreach ($pairs as $key => $value) {
            AppSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');
        AuditLog::record(
            $user,
            'updated',
            'settings',
            'general',
            'تحديث الإعدادات العامة للنظام',
            null,
            $pairs,
            $request,
        );

        return $this->index();
    }
}
