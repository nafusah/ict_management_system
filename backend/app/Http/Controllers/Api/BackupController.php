<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function download(Request $request): BinaryFileResponse|JsonResponse
    {
        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');
        $connection = config('database.default');
        $timestamp = now()->format('Y-m-d_H-i');

        if ($connection === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');
            if (! $dbPath || ! file_exists($dbPath)) {
                return response()->json(['message' => 'حدث خطأ، يرجى المحاولة لاحقاً.'], 404);
            }
            AuditLog::record($user, 'created', 'backup', 'sqlite', 'تحميل نسخة احتياطية من قاعدة البيانات (SQLite)', null, null, $request);
            return response()->download($dbPath, "ict-backup-{$timestamp}.sqlite");
        }

        if (! in_array($connection, ['mysql', 'mariadb'], true)) {
            return response()->json(['message' => 'حدث خطأ، يرجى المحاولة لاحقاً.'], 422);
        }

        $tmpFile = storage_path("app/private/backup-{$timestamp}.sql");
        if (! is_dir(dirname($tmpFile))) {
            mkdir(dirname($tmpFile), 0755, true);
        }

        $dumped = $this->tryMysqldump($connection, $tmpFile) || $this->dumpViaPdo($tmpFile);

        if (! $dumped || ! file_exists($tmpFile) || filesize($tmpFile) === 0) {
            @unlink($tmpFile);
            return response()->json([
                'message' => 'حدث خطأ، يرجى المحاولة لاحقاً.',
            ], 500);
        }

        AuditLog::record($user, 'created', 'backup', $connection, 'تحميل نسخة احتياطية من قاعدة البيانات', null, null, $request);

        return response()->download($tmpFile, "ict-backup-{$timestamp}.sql")->deleteFileAfterSend(true);
    }

    private function tryMysqldump(string $connection, string $tmpFile): bool
    {
        $cfg = config("database.connections.{$connection}");
        $candidates = array_filter([
            rtrim((string) env('DB_DUMP_PATH', ''), '\\/'),
            rtrim((string) env('DUMP_BINARY_PATH', ''), '\\/'),
            'C:\xampp\mysql\bin',
            'D:\xampp\mysql\bin',
        ]);

        $binary = 'mysqldump';
        foreach ($candidates as $dir) {
            $exe = DIRECTORY_SEPARATOR === '\\' ? "{$dir}\\mysqldump.exe" : "{$dir}/mysqldump";
            if (file_exists($exe)) {
                $binary = $exe;
                break;
            }
        }

        $args = [
            $binary,
            '--host='.(string) ($cfg['host'] ?? '127.0.0.1'),
            '--port='.(string) ($cfg['port'] ?? '3306'),
            '--user='.(string) ($cfg['username'] ?? 'root'),
        ];

        $password = (string) ($cfg['password'] ?? '');
        if ($password !== '') {
            $args[] = '--password='.$password;
        }

        $args[] = '--single-transaction';
        $args[] = '--result-file='.$tmpFile;
        $args[] = (string) ($cfg['database'] ?? 'it_management_system');

        try {
            $result = Process::run($args);
            return $result->successful() && file_exists($tmpFile) && filesize($tmpFile) > 0;
        } catch (\Throwable) {
            return false;
        }
    }

    private function dumpViaPdo(string $tmpFile): bool
    {
        try {
            $pdo = DB::connection()->getPdo();
            $dbName = DB::connection()->getDatabaseName();

            $handle = fopen($tmpFile, 'wb');
            if (! $handle) {
                return false;
            }

            fwrite($handle, "-- ICT Management System Backup\n");
            fwrite($handle, "-- Database: `{$dbName}`\n");
            fwrite($handle, '-- Generated at: '.now()->toDateTimeString()."\n\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

            $tables = $pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);
            foreach ($tables as $table) {
                $createRow = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_ASSOC);
                $createSql = $createRow['Create Table'] ?? array_values($createRow)[1] ?? null;
                if (! $createSql) {
                    continue;
                }

                fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");
                fwrite($handle, $createSql.";\n\n");

                $stmt = $pdo->query("SELECT * FROM `{$table}`");
                while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                    $cols = array_map(fn ($c) => "`{$c}`", array_keys($row));
                    $vals = array_map(function ($v) use ($pdo) {
                        if ($v === null) {
                            return 'NULL';
                        }
                        return $pdo->quote((string) $v);
                    }, array_values($row));

                    fwrite(
                        $handle,
                        "INSERT INTO `{$table}` (".implode(', ', $cols).') VALUES ('.implode(', ', $vals).");\n",
                    );
                }
                fwrite($handle, "\n");
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
            fclose($handle);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
