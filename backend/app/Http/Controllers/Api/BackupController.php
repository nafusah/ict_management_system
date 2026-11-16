<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuditLog;
use App\Services\DatabaseBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function download(Request $request, DatabaseBackupService $backupService): BinaryFileResponse|JsonResponse
    {
        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');
        $result = $backupService->createBackup();

        if (! $result) {
            return response()->json([
                'message' => 'حدث خطأ، يرجى المحاولة لاحقاً.',
            ], 500);
        }

        AuditLog::record(
            $user,
            'created',
            'backup',
            $result['connection'],
            'تحميل نسخة احتياطية من قاعدة البيانات',
            null,
            null,
            $request,
        );

        return response()->download($result['path'], $result['filename'])->deleteFileAfterSend(true);
    }
}
