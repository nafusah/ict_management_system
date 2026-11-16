<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->bearerToken();
        if (! $plain) {
            return response()->json(['message' => 'يرجى تسجيل الدخول أولاً.'], 401);
        }

        $hashed = hash('sha256', $plain);
        $token = ApiToken::query()->with('user')->where('token', $hashed)->first();

        if (! $token || ($token->expires_at && $token->expires_at->isPast())) {
            return response()->json(['message' => 'انتهت صلاحية الجلسة أو الرمز غير صالح.'], 401);
        }

        $user = $token->user;
        if (! $user || ! $user->active) {
            return response()->json(['message' => 'هذا الحساب غير نشط أو غير موجود.'], 401);
        }

        $token->forceFill(['last_used_at' => now()])->saveQuietly();
        $request->attributes->set('app_user', $user);
        $request->attributes->set('api_token', $token);

        return $next($request);
    }
}
