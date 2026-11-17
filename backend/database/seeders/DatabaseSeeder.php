<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Models\AppUser;
use App\Models\Brand;
use App\Models\Department;
use App\Models\DeviceType;
use App\Models\Employee;
use App\Models\InkColor;
use App\Models\PrinterType;
use App\Models\Service;
use App\Models\ServiceProvider;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['id' => 'monitor', 'label' => 'شاشة', 'icon' => 'monitor'],
            ['id' => 'pcCase', 'label' => 'كيس كمبيوتر', 'icon' => 'pcCase'],
            ['id' => 'phone', 'label' => 'هاتف', 'icon' => 'phone'],
            ['id' => 'printer', 'label' => 'طابعة', 'icon' => 'printer'],
            ['id' => 'other', 'label' => 'أخرى', 'icon' => 'other'],
        ] as $row) {
            DeviceType::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'BRD-001', 'name' => 'Dell', 'category' => 'device'],
            ['id' => 'BRD-002', 'name' => 'HP', 'category' => 'device'],
            ['id' => 'BRD-003', 'name' => 'Lenovo', 'category' => 'device'],
            ['id' => 'BRD-004', 'name' => 'Cisco', 'category' => 'device'],
            ['id' => 'BRD-005', 'name' => 'Canon', 'category' => 'device'],
            ['id' => 'BRD-006', 'name' => 'Samsung', 'category' => 'device'],
            ['id' => 'BRD-007', 'name' => 'Apple', 'category' => 'device'],
            ['id' => 'BRD-008', 'name' => 'HP', 'category' => 'ink'],
            ['id' => 'BRD-009', 'name' => 'Canon', 'category' => 'ink'],
            ['id' => 'BRD-010', 'name' => 'Epson', 'category' => 'ink'],
            ['id' => 'BRD-011', 'name' => 'Brother', 'category' => 'ink'],
        ] as $row) {
            Brand::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'black', 'name' => 'أسود', 'code' => 'K', 'primary' => '#0f172a', 'light' => '#e2e8f0', 'border' => '#0f172a'],
            ['id' => 'cyan', 'name' => 'أزرق سماوي', 'code' => 'C', 'primary' => '#0891b2', 'light' => '#cffafe', 'border' => '#0e7490'],
            ['id' => 'magenta', 'name' => 'أرجواني', 'code' => 'M', 'primary' => '#c026d3', 'light' => '#fae8ff', 'border' => '#a21caf'],
            ['id' => 'yellow', 'name' => 'أصفر', 'code' => 'Y', 'primary' => '#eab308', 'light' => '#fef9c3', 'border' => '#ca8a04'],
        ] as $row) {
            InkColor::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'PRT-001', 'name' => 'HP Color LaserJet Pro M254', 'brand' => 'HP'],
            ['id' => 'PRT-002', 'name' => 'Canon i-SENSYS MF643Cdw', 'brand' => 'Canon'],
            ['id' => 'PRT-003', 'name' => 'Epson EcoTank L3250', 'brand' => 'Epson'],
            ['id' => 'PRT-004', 'name' => 'Xerox VersaLink C400', 'brand' => 'Xerox'],
        ] as $row) {
            PrinterType::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'SRV-001', 'name' => 'Microsoft 365 Business Standard'],
            ['id' => 'SRV-002', 'name' => 'Fortinet FortiGate UTM Bundle'],
            ['id' => 'SRV-003', 'name' => 'Adobe Creative Cloud Teams'],
            ['id' => 'SRV-004', 'name' => 'Cloudflare Business Plan'],
            ['id' => 'SRV-005', 'name' => 'Zoom Workplace Pro'],
        ] as $row) {
            Service::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'PRV-001', 'name' => 'شركة التقنية الحديثة', 'email' => 'sales@modern-tech.local', 'phone' => '0912345678'],
            ['id' => 'PRV-002', 'name' => 'مؤسسة الحلول السحابية', 'email' => 'billing@cloud-solutions.local', 'phone' => '0923456789'],
            ['id' => 'PRV-003', 'name' => 'مركز الأنظمة المتكاملة', 'email' => 'support@integrated-sys.local', 'phone' => '0945678901'],
        ] as $row) {
            ServiceProvider::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            [
                'id' => 'USR-001',
                'name' => 'محمد الحملي',
                'email' => 'm.alhamali@nafusah.com',
                'department' => 'إدارة الاتصالات وتقنية المعلومات',
                'active' => true,
                'permissions' => [
                    'dashboard.devices',
                    'dashboard.inks',
                    'dashboard.subscriptions',
                    'devices.view',
                    'devices.manage',
                    'inks.view',
                    'inks.manage',
                    'subscriptions.view',
                    'subscriptions.manage',
                    'dictionary.deviceTypes',
                    'dictionary.printerTypes',
                    'dictionary.inkColors',
                    'dictionary.brands',
                    'dictionary.services',
                    'settings.manage',
                    'employees.manage',
                ],
            ],
        ] as $row) {
            $user = AppUser::withTrashed()->find($row['id']);
            if ($user) {
                $user->update(array_merge($row, $user->password ? [] : ['password' => '123456']));
            } else {
                AppUser::create(array_merge($row, ['password' => '123456']));
            }
        }

        $empFile = database_path('seeders/data/employees.json');
        if (file_exists($empFile)) {
            $payload = json_decode((string) file_get_contents($empFile), true);
            foreach ($payload['departments'] ?? [] as $dept) {
                Department::updateOrCreate(['id' => $dept['id']], $dept);
            }
            foreach ($payload['employees'] ?? [] as $emp) {
                Employee::withTrashed()->updateOrCreate(['id' => $emp['id']], $emp);
            }
        }

        foreach ([
            'org_name' => 'إدارة الاتصالات وتقنية المعلومات',
            'admin_name' => 'مدير النظام',
            'admin_email' => 'it-admin@company.local',
            'default_ink_threshold' => '3',
        ] as $key => $value) {
            AppSetting::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
