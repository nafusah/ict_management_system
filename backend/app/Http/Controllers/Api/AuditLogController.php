<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->orderByDesc('id');

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }
        if ($entityType = $request->query('entity_type')) {
            $query->where('entity_type', $entityType);
        }
        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('summary', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%")
                    ->orWhere('entity_id', 'like', "%{$search}%");
            });
        }

        $items = $query->limit(200)->get()->map(fn (AuditLog $log) => [
            'id' => (string) $log->id,
            'userId' => $log->user_id,
            'userName' => $log->user_name,
            'action' => $log->action,
            'entityType' => $log->entity_type,
            'entityId' => $log->entity_id,
            'summary' => $log->summary,
            'oldValues' => $log->old_values,
            'newValues' => $log->new_values,
            'ipAddress' => $log->ip_address,
            'createdAt' => $log->created_at?->toIso8601String(),
        ]);

        return response()->json($items);
    }
}
