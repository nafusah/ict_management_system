<?php

namespace App\Console\Commands;

use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\Subscription;
use App\Models\SubscriptionCategory;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use ZipArchive;

class ImportSubscriptionsExcel extends Command
{
    protected $signature = 'ict:import-subscriptions
        {file? : المسار إلى ملف Excel (.xlsx)}
        {--dry-run : معاينة البيانات المستخرجة دون الحفظ في قاعدة البيانات}';

    protected $description = 'استيراد بيانات الاشتراكات والتصنيفات والمزودين من ملف Excel';

    public function handle(): int
    {
        $path = $this->resolveFilePath($this->argument('file'));
        if (! $path || ! is_file($path)) {
            $this->error('تعذر العثور على ملف Excel. حدد المسار الصحيح كوسيط للأمر.');
            return self::FAILURE;
        }

        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            $this->error("فشل فتح الملف: {$path}");
            return self::FAILURE;
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        if ($workbookXml === false) {
            $zip->close();
            $this->error('ملف Excel غير صالح (xl/workbook.xml مفقود).');
            return self::FAILURE;
        }

        $wb = simplexml_load_string($workbookXml);
        $dryRun = (bool) $this->option('dry-run');

        $stats = [
            'categories' => 0,
            'providers' => 0,
            'services' => 0,
            'subscriptions' => 0,
            'skipped' => 0,
        ];

        $sheetIndex = 0;
        foreach ($wb->sheets->sheet as $sheetMeta) {
            $sheetIndex++;
            $sheetName = trim((string) $sheetMeta['name']);
            $sheetXml = $zip->getFromName("xl/worksheets/sheet{$sheetIndex}.xml");
            if ($sheetXml === false) {
                continue;
            }

            $rows = $this->parseSheetRows($sheetXml, $sharedStrings);
            [$headerRowIdx, $colMap] = $this->detectHeaderRow($rows);
            if ($headerRowIdx === null) {
                $this->warn("تخطي الورقة [{$sheetName}]: لم يتم العثور على صف العناوين.");
                continue;
            }

            $categoryId = $this->categoryIdForSheet($sheetName);
            $categoryIcon = $this->categoryIconForSheet($sheetName);

            if (! $dryRun) {
                $cat = SubscriptionCategory::query()->firstOrCreate(
                    ['id' => $categoryId],
                    ['name' => $sheetName, 'icon' => $categoryIcon],
                );
                if ($cat->wasRecentlyCreated) {
                    $stats['categories']++;
                }
            } else {
                $stats['categories']++;
            }

            $lastProvider = '';
            $lastPhone = '';
            $lastEmail = '';

            foreach ($rows as $rowIdx => $cells) {
                if ($rowIdx <= $headerRowIdx) {
                    continue;
                }

                $rawProvider = $this->cell($cells, $colMap, 'provider');
                $rawPhone = $this->cleanContact($this->cell($cells, $colMap, 'phone'));
                $rawEmail = $this->cleanContact($this->cell($cells, $colMap, 'email'));
                $location = $this->cell($cells, $colMap, 'location');
                $serviceType = $this->cell($cells, $colMap, 'service_type');
                $poNumber = $this->cell($cells, $colMap, 'po');
                $startDate = $this->parseExcelDate($this->cell($cells, $colMap, 'start_date'));
                $endDate = $this->parseExcelDate($this->cell($cells, $colMap, 'end_date'));
                $comments = $this->cell($cells, $colMap, 'comments');

                $hasAnyData = $rawProvider !== '' || $serviceType !== '' || $location !== '' || $poNumber !== '' || $endDate !== null;
                if (! $hasAnyData) {
                    continue;
                }

                if ($rawProvider !== '') {
                    $lastProvider = $rawProvider;
                    if ($rawPhone !== '') {
                        $lastPhone = $rawPhone;
                    }
                    if ($rawEmail !== '') {
                        $lastEmail = $rawEmail;
                    }
                }

                $providerName = $rawProvider !== '' ? $rawProvider : $lastProvider;
                $phone = $rawPhone !== '' ? $rawPhone : ($rawProvider === '' ? $lastPhone : '');
                $email = $rawEmail !== '' ? $rawEmail : ($rawProvider === '' ? $lastEmail : '');
                $serviceName = $serviceType !== '' ? $serviceType : ($providerName !== '' ? "{$sheetName} - {$providerName}" : '');

                if ($providerName === '' || $serviceName === '' || $endDate === null) {
                    $stats['skipped']++;
                    $label = $serviceName ?: ($providerName ?: "صف {$rowIdx}");
                    $this->line("<comment>[تخطي]</comment> {$sheetName} / {$label} (ينقص تاريخ الانتهاء أو المزود)");
                    continue;
                }

                if ($dryRun) {
                    $stats['subscriptions']++;
                    $this->line(
                        "• [{$sheetName}] {$serviceName} | المزود: {$providerName}"
                        .($location !== '' ? " | الموقع: {$location}" : '')
                        ." | البدء: ".($startDate ?? '—')." | الانتهاء: {$endDate}",
                    );
                    continue;
                }

                $prov = ServiceProvider::query()->where('name', $providerName)->first();
                if (! $prov) {
                    ServiceProvider::create([
                        'name' => $providerName,
                        'email' => $email !== '' ? $email : null,
                        'phone' => $phone !== '' ? $phone : null,
                    ]);
                    $stats['providers']++;
                } elseif (($email !== '' && ! $prov->email) || ($phone !== '' && ! $prov->phone)) {
                    $prov->update([
                        'email' => $prov->email ?: ($email !== '' ? $email : null),
                        'phone' => $prov->phone ?: ($phone !== '' ? $phone : null),
                    ]);
                }

                $srv = Service::query()->firstOrCreate(['name' => $serviceName]);
                if ($srv->wasRecentlyCreated) {
                    $stats['services']++;
                }

                $existing = Subscription::query()
                    ->where('service_name', $serviceName)
                    ->where('provider', $providerName)
                    ->where('category', $categoryId)
                    ->whereDate('end_date', $endDate)
                    ->where(function ($q) use ($location) {
                        if ($location === '') {
                            $q->whereNull('service_location')->orWhere('service_location', '');
                        } else {
                            $q->where('service_location', $location);
                        }
                    })
                    ->first();

                $payload = [
                    'service_name' => $serviceName,
                    'provider' => $providerName,
                    'category' => $categoryId,
                    'po_number' => $poNumber,
                    'service_location' => $location !== '' ? $location : null,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'alert_days_before' => 30,
                    'cancelled' => false,
                    'notes' => $comments !== '' ? $comments : null,
                ];

                if ($existing) {
                    $existing->update($payload);
                } else {
                    Subscription::create($payload);
                    $stats['subscriptions']++;
                }
            }
        }

        $zip->close();

        $prefix = $dryRun ? '[معاينة فقط]' : '[تم الاستيراد]';
        $this->info(
            "{$prefix} التصنيفات: {$stats['categories']} | المزودون الجدد: {$stats['providers']} | الخدمات الجديدة: {$stats['services']} | الاشتراكات: {$stats['subscriptions']} | المتخطّاة: {$stats['skipped']}",
        );

        return self::SUCCESS;
    }

    protected function resolveFilePath(?string $arg): ?string
    {
        if ($arg) {
            return is_file($arg) ? $arg : base_path($arg);
        }

        $candidates = [
            database_path('seeders/data/ict_services.xlsx'),
            base_path('../Table of ICT Services (1).xlsx'),
            base_path('Table of ICT Services (1).xlsx'),
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    /** @return array<int, string> */
    protected function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $sx = simplexml_load_string($xml);
        $list = [];
        foreach ($sx->si as $si) {
            $txt = '';
            if (isset($si->t)) {
                $txt = (string) $si->t;
            } elseif (isset($si->r)) {
                foreach ($si->r as $run) {
                    $txt .= (string) $run->t;
                }
            }
            $list[] = trim($txt);
        }

        return $list;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     * @return array<int, array<string, string>>
     */
    protected function parseSheetRows(string $sheetXml, array $sharedStrings): array
    {
        $sh = simplexml_load_string($sheetXml);
        $rows = [];
        foreach ($sh->sheetData->row as $row) {
            $rIdx = (int) $row['r'];
            $cells = [];
            foreach ($row->c as $c) {
                $ref = (string) $c['r'];
                $col = preg_replace('/\d+/', '', $ref) ?: '';
                $type = (string) $c['t'];
                $val = isset($c->v) ? (string) $c->v : '';
                if ($type === 's' && $val !== '') {
                    $val = $sharedStrings[(int) $val] ?? $val;
                } elseif ($type === 'inlineStr') {
                    $val = (string) $c->is->t;
                }
                $val = trim($val);
                if ($col !== '' && $val !== '') {
                    $cells[$col] = $val;
                }
            }
            if (! empty($cells)) {
                $rows[$rIdx] = $cells;
            }
        }

        return $rows;
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array{0: int|null, 1: array<string, string>}
     */
    protected function detectHeaderRow(array $rows): array
    {
        foreach ($rows as $rowIdx => $cells) {
            $map = [];
            foreach ($cells as $col => $raw) {
                $norm = strtolower(preg_replace('/\s+/', ' ', trim($raw)) ?? '');
                if (str_contains($norm, 'provider')) {
                    $map['provider'] = $col;
                } elseif (str_contains($norm, 'phone')) {
                    $map['phone'] = $col;
                } elseif (str_contains($norm, 'email')) {
                    $map['email'] = $col;
                } elseif (str_contains($norm, 'location')) {
                    $map['location'] = $col;
                } elseif (str_contains($norm, 'services type')) {
                    $map['service_type'] = $col;
                } elseif (str_contains($norm, 'p,o') || str_contains($norm, 'po ')) {
                    $map['po'] = $col;
                } elseif (str_contains($norm, 'start date')) {
                    $map['start_date'] = $col;
                } elseif (str_contains($norm, 'end date')) {
                    $map['end_date'] = $col;
                } elseif (str_contains($norm, 'comment')) {
                    $map['comments'] = $col;
                }
            }

            if (isset($map['provider']) && isset($map['end_date'])) {
                return [$rowIdx, $map];
            }
        }

        return [null, []];
    }

    /** @param  array<string, string>  $cells
     *  @param  array<string, string>  $colMap */
    protected function cell(array $cells, array $colMap, string $key): string
    {
        if (! isset($colMap[$key])) {
            return '';
        }

        return trim($cells[$colMap[$key]] ?? '');
    }

    protected function cleanContact(string $val): string
    {
        $v = trim($val);
        return ($v === '' || $v === '*' || $v === '-') ? '' : $v;
    }

    protected function parseExcelDate(string $val): ?string
    {
        $val = trim($val);
        if ($val === '' || $val === '*' || $val === '-') {
            return null;
        }

        if (is_numeric($val)) {
            $serial = (int) round((float) $val);
            if ($serial > 20000 && $serial < 80000) {
                return CarbonImmutable::create(1899, 12, 30, 0, 0, 0, 'UTC')
                    ->addDays($serial)
                    ->toDateString();
            }
        }

        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $val, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
            return $val;
        }

        return null;
    }

    protected function categoryIdForSheet(string $sheetName): string
    {
        $slug = Str::slug($sheetName, '_');
        return 'sheet_'.($slug !== '' ? substr($slug, 0, 24) : substr(md5($sheetName), 0, 12));
    }

    protected function categoryIconForSheet(string $sheetName): string
    {
        $lower = strtolower($sheetName);
        if (str_contains($lower, 'internet') || str_contains($lower, 'starlink')) {
            return 'wifi';
        }
        if (str_contains($lower, 'website')) {
            return 'network';
        }
        if (str_contains($lower, 'cloud')) {
            return 'cloud';
        }
        return 'monitor';
    }
}
