<?php

namespace App\Http\Middleware;

use App\Models\AppUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');
        if (! $user) {
            return response()->json(['message' => 'غير مصرح بالدخول.'], 401);
        }

        if (! $user->hasAnyPermission($permissions)) {
            return response()->json(['message' => 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'], 403);
        }

        return $next($request);
    }
}
