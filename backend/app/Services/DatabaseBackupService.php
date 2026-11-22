<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;

class DatabaseBackupService
{
    /**
     * Create a database backup file at the given target path (or a temporary path if null).
     * Returns ['path' => string, 'filename' => string, 'connection' => string] or null on failure.
     *
     * @return array{path: string, filename: string, connection: string}|null
     */
    public function createBackup(?string $targetDir = null): ?array
    {
        $connection = (string) config('database.default');
        $timestamp = now()->format('Y-m-d_H-i-s');
        $dir = $targetDir ?? storage_path('app/private');

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if ($connection === 'sqlite') {
            $dbPath = (string) config('database.connections.sqlite.database');
            if (! $dbPath || ! file_exists($dbPath)) {
                return null;
            }
            $filename = "ict-backup-{$timestamp}.sqlite";
            $dest = rtrim($dir, '\\/').DIRECTORY_SEPARATOR.$filename;
            if (! copy($dbPath, $dest)) {
                return null;
            }

            return ['path' => $dest, 'filename' => $filename, 'connection' => $connection];
        }

        if (! in_array($connection, ['mysql', 'mariadb'], true)) {
            return null;
        }

        $filename = "ict-backup-{$timestamp}.sql";
        $dest = rtrim($dir, '\\/').DIRECTORY_SEPARATOR.$filename;

        $dumped = $this->tryMysqldump($connection, $dest) || $this->dumpViaPdo($dest);
        if (! $dumped || ! file_exists($dest) || filesize($dest) === 0) {
            @unlink($dest);
            return null;
        }

        return ['path' => $dest, 'filename' => $filename, 'connection' => $connection];
    }

    private function tryMysqldump(string $connection, string $dest): bool
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
        $args[] = '--result-file='.$dest;
        $args[] = (string) ($cfg['database'] ?? 'it_management_system');

        try {
            $result = Process::run($args);
            return $result->successful() && file_exists($dest) && filesize($dest) > 0;
        } catch (\Throwable) {
            return false;
        }
    }

    private function dumpViaPdo(string $dest): bool
    {
        try {
            $pdo = DB::connection()->getPdo();
            $dbName = DB::connection()->getDatabaseName();

            $handle = fopen($dest, 'wb');
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
                    $vals = array_map(
                        fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v),
                        array_values($row),
                    );

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
