<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:4'],
        ]);

        $email = strtolower(trim($validated['email']));
        $user = AppUser::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'], 401);
        }

        if (! $user->active) {
            return response()->json(['message' => 'هذا الحساب غير نشط حالياً. تواصل مع مدير النظام.'], 403);
        }

        $plainToken = Str::random(64);
        ApiToken::create([
            'app_user_id' => $user->id,
            'token' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays(7),
        ]);

        AuditLog::record(
            $user,
            'login',
            'auth',
            $user->id,
            "تسجيل دخول المستخدم: {$user->name}",
            null,
            null,
            $request,
        );

        return response()->json([
            'token' => $plainToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'active' => $user->active,
                'permissions' => $user->permissions,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var AppUser $user */
        $user = $request->attributes->get('app_user');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'department' => $user->department,
            'active' => $user->active,
            'permissions' => $user->permissions,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');
        /** @var ApiToken|null $token */
        $token = $request->attributes->get('api_token');

        if ($token) {
            $token->delete();
        }

        if ($user) {
            AuditLog::record(
                $user,
                'logout',
                'auth',
                $user->id,
                "تسجيل خروج المستخدم: {$user->name}",
                null,
                null,
                $request,
            );
        }

        return response()->json(['loggedOut' => true]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var AppUser $user */
        $user = $request->attributes->get('app_user');

        $validated = $request->validate([
            'currentPassword' => ['required', 'string', 'min:4'],
            'newPassword' => ['required', 'string', 'min:4', 'max:255'],
        ]);

        if (! $user->password || ! Hash::check($validated['currentPassword'], $user->password)) {
            return response()->json(['message' => 'كلمة المرور الحالية غير صحيحة.'], 422);
        }

        $user->update(['password' => $validated['newPassword']]);

        AuditLog::record(
            $user,
            'updated',
            'auth',
            $user->id,
            "تغيير كلمة المرور للمستخدم: {$user->name}",
            null,
            null,
            $request,
        );

        return response()->json(['changed' => true]);
    }
}
