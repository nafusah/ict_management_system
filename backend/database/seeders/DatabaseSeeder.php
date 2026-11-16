<?php

namespace Database\Seeders;

use App\Models\AppUser;
use App\Models\Brand;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\Ink;
use App\Models\InkColor;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\Subscription;
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
                'email' => 'm.alhamali@company.local',
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
                    'dictionary.inkColors',
                    'dictionary.brands',
                    'dictionary.services',
                    'settings.manage',
                    'employees.manage',
                ],
            ],
            [
                'id' => 'USR-002',
                'name' => 'أحمد السعيد',
                'email' => 'a.alsaeed@company.local',
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
                ],
            ],
            [
                'id' => 'USR-003',
                'name' => 'سارة خالد',
                'email' => 's.khaled@company.local',
                'department' => 'إدارة الاتصالات وتقنية المعلومات',
                'active' => false,
                'permissions' => ['dashboard.devices', 'dashboard.inks', 'devices.view', 'inks.view'],
            ],
        ] as $row) {
            AppUser::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'DEV-001', 'name' => 'Dell P2422H 24" IPS', 'serial_number' => 'DL-MON-88412', 'kind' => 'monitor', 'brand' => 'Dell', 'department' => 'الإدارة المالية', 'employee' => 'فاطمة المنصور', 'classification' => 'personal', 'location' => 'town', 'floor' => '2', 'office_number' => '204'],
            ['id' => 'DEV-002', 'name' => 'HP EliteDesk 800 G9', 'serial_number' => 'HP-PC-30194', 'kind' => 'pcCase', 'brand' => 'HP', 'department' => 'إدارة الاتصالات وتقنية المعلومات', 'employee' => 'خالد الزهراني', 'classification' => 'personal', 'location' => 'town', 'floor' => '3', 'office_number' => '301'],
            ['id' => 'DEV-003', 'name' => 'HP LaserJet Pro M404dn', 'serial_number' => 'HP-PRT-55019', 'kind' => 'printer', 'brand' => 'HP', 'department' => 'الموارد البشرية', 'employee' => 'مشترك للإدارة', 'classification' => 'shared', 'location' => 'town', 'floor' => '1', 'office_number' => '108'],
            ['id' => 'DEV-004', 'name' => 'Cisco IP Phone 8841', 'serial_number' => 'CS-PHN-90211', 'kind' => 'phone', 'brand' => 'Cisco', 'department' => 'الشؤون القانونية', 'employee' => 'سارة الغامدي', 'classification' => 'personal', 'location' => 'field', 'floor' => null, 'office_number' => null],
        ] as $row) {
            Device::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'INK-001', 'brand' => 'HP', 'model' => 'HP 59A (CF259A)', 'color' => 'black', 'quantity' => 14, 'alert_threshold' => 5],
            ['id' => 'INK-002', 'brand' => 'HP', 'model' => 'HP 207A (W2211A)', 'color' => 'cyan', 'quantity' => 3, 'alert_threshold' => 4],
            ['id' => 'INK-003', 'brand' => 'HP', 'model' => 'HP 207A (W2213A)', 'color' => 'magenta', 'quantity' => 7, 'alert_threshold' => 4],
            ['id' => 'INK-004', 'brand' => 'HP', 'model' => 'HP 207A (W2212A)', 'color' => 'yellow', 'quantity' => 0, 'alert_threshold' => 4],
        ] as $row) {
            Ink::updateOrCreate(['id' => $row['id']], $row);
        }

        foreach ([
            ['id' => 'SUB-001', 'service_name' => 'Microsoft 365 Business Standard', 'provider' => 'شركة التقنية الحديثة', 'category' => 'software', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'seats' => 45, 'annual_cost' => 21600, 'department' => 'كافة الإدارات', 'status' => 'active', 'notes' => 'تجديد سنوي شامل لبريد الموظفين وحزمة أوفيس'],
            ['id' => 'SUB-002', 'service_name' => 'Fortinet FortiGate UTM Bundle', 'provider' => 'مركز الأنظمة المتكاملة', 'category' => 'security', 'start_date' => '2025-11-25', 'end_date' => '2026-11-25', 'seats' => 2, 'annual_cost' => 14500, 'department' => 'إدارة الاتصالات وتقنية المعلومات', 'status' => 'expiring', 'notes' => 'ترخيص جدار الحماية للمقر الرئيسي والفرع'],
            ['id' => 'SUB-003', 'service_name' => 'Adobe Creative Cloud Teams', 'provider' => 'مؤسسة الحلول السحابية', 'category' => 'software', 'start_date' => '2025-10-01', 'end_date' => '2026-10-01', 'seats' => 6, 'annual_cost' => 8400, 'department' => 'العلاقات العامة', 'status' => 'expired', 'notes' => 'بانتظار اعتماد عرض السعر للتجديد'],
        ] as $row) {
            Subscription::updateOrCreate(['id' => $row['id']], $row);
        }
    }
}
