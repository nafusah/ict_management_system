import type {
  AppUser,
  BrandItem,
  Device,
  DeviceTypeItem,
  Ink,
  InkColorItem,
  ServiceItem,
  ServiceProviderItem,
  Subscription,
} from './types'

/** بيانات أولية تظهر عند أول تشغيل فقط، قبل أي تعديل. */
export const SEED_DEVICES: Device[] = [
  { id: 'DEV-001', name: 'Dell P2422H 24"', brand: 'Dell', kind: 'monitor', serialNumber: 'CN-0P2422-7731', department: 'إدارة تقنية المعلومات', employee: 'محمد الحملي', classification: 'personal', location: 'town', floor: '2', officeNumber: '204' },
  { id: 'DEV-002', name: 'OptiPlex 7090 Tower', brand: 'Dell', kind: 'pcCase', serialNumber: 'OPT-7090-4412', department: 'إدارة تقنية المعلومات', employee: 'محمد الحملي', classification: 'personal', location: 'town', floor: '2', officeNumber: '204' },
  { id: 'DEV-003', name: 'Cisco IP Phone 8841', brand: 'Cisco', kind: 'phone', serialNumber: 'FCH2231A9KQ', department: 'إدارة تقنية المعلومات', employee: 'محمد الحملي', classification: 'personal', location: 'town', floor: '2', officeNumber: '204' },
  { id: 'DEV-004', name: 'Samsung S24C450', brand: 'Samsung', kind: 'monitor', serialNumber: 'SM-S24-55810', department: 'إدارة التحول الرقمي', employee: 'أحمد السعيد', classification: 'personal', location: 'field', floor: '1', officeNumber: '102' },
  { id: 'DEV-005', name: 'HP ProDesk 400 G7', brand: 'HP', kind: 'pcCase', serialNumber: 'HP-PD400-20931', department: 'إدارة التحول الرقمي', employee: 'أحمد السعيد', classification: 'personal', location: 'field', floor: '1', officeNumber: '102' },
  { id: 'DEV-006', name: 'Dell P2722H 27"', brand: 'Dell', kind: 'monitor', serialNumber: 'CN-0P2722-1180', department: 'خدمة العملاء', employee: 'سارة خالد', classification: 'personal', location: 'town', floor: '1', officeNumber: '108' },
  { id: 'DEV-007', name: 'Lenovo ThinkCentre M70t', brand: 'Lenovo', kind: 'pcCase', serialNumber: 'LN-M70T-66204', department: 'خدمة العملاء', employee: 'سارة خالد', classification: 'personal', location: 'town', floor: '1', officeNumber: '108' },
  { id: 'DEV-008', name: 'Cisco IP Phone 7821', brand: 'Cisco', kind: 'phone', serialNumber: 'FCH2307B1RT', department: 'إدارة الشؤون المالية', employee: 'مشترك للموظفين', classification: 'shared', location: 'field', floor: '1', officeNumber: '115' },
  { id: 'DEV-009', name: 'HP LaserJet Pro M404dn', brand: 'HP', kind: 'printer', serialNumber: 'PHBCH12094', department: 'إدارة تقنية المعلومات', employee: 'مشترك للشبكة الرئيسية', classification: 'shared', location: 'town', floor: '2', officeNumber: '201' },
]

export const SEED_DEVICE_TYPES: DeviceTypeItem[] = [
  { id: 'monitor', label: 'شاشة', icon: 'monitor' },
  { id: 'pcCase', label: 'كيس', icon: 'pcCase' },
  { id: 'phone', label: 'هاتف', icon: 'phone' },
  { id: 'printer', label: 'طابعة', icon: 'printer' },
  { id: 'other', label: 'أخرى', icon: 'other' },
]

export const SEED_INKS: Ink[] = [
  { id: 'INK-001', brand: 'HP', model: 'HP LaserJet 205A (CF530A)', color: 'black', quantity: 3, alertThreshold: 5 },
  { id: 'INK-002', brand: 'HP', model: 'HP LaserJet 205A (CF531A)', color: 'cyan', quantity: 8, alertThreshold: 4 },
  { id: 'INK-003', brand: 'HP', model: 'HP LaserJet 205A (CF533A)', color: 'magenta', quantity: 2, alertThreshold: 4 },
  { id: 'INK-004', brand: 'HP', model: 'HP LaserJet 205A (CF532A)', color: 'yellow', quantity: 6, alertThreshold: 4 },
  { id: 'INK-005', brand: 'Canon', model: 'Canon 054 H High Yield', color: 'black', quantity: 12, alertThreshold: 5 },
  { id: 'INK-006', brand: 'Canon', model: 'Canon 054 Cyan', color: 'cyan', quantity: 1, alertThreshold: 3 },
  { id: 'INK-007', brand: 'Epson', model: 'EcoTank 103 Magenta', color: 'magenta', quantity: 15, alertThreshold: 6 },
  { id: 'INK-008', brand: 'Xerox', model: 'VersaLink C400 Yellow', color: 'yellow', quantity: 7, alertThreshold: 3 },
]

export const SEED_INK_COLORS: InkColorItem[] = [
  { id: 'black', name: 'أسود', code: 'K', primary: '#182230', light: '#f2f4f7', border: '#d0d5dd' },
  { id: 'cyan', name: 'سماوي', code: 'C', primary: '#0284c7', light: '#e0f2fe', border: '#bae6fd' },
  { id: 'magenta', name: 'أرجواني', code: 'M', primary: '#db2777', light: '#fce7f3', border: '#fbcfe8' },
  { id: 'yellow', name: 'أصفر', code: 'Y', primary: '#ca8a04', light: '#fef9c3', border: '#fef08a' },
]

export const SEED_BRANDS: BrandItem[] = [
  { id: 'BRD-D01', name: 'Dell', category: 'device' },
  { id: 'BRD-D02', name: 'HP', category: 'device' },
  { id: 'BRD-D03', name: 'Lenovo', category: 'device' },
  { id: 'BRD-D04', name: 'Apple', category: 'device' },
  { id: 'BRD-D05', name: 'Cisco', category: 'device' },
  { id: 'BRD-D06', name: 'Samsung', category: 'device' },
  { id: 'BRD-D07', name: 'Yealink', category: 'device' },
  { id: 'BRD-I01', name: 'HP', category: 'ink' },
  { id: 'BRD-I02', name: 'Canon', category: 'ink' },
  { id: 'BRD-I03', name: 'Epson', category: 'ink' },
  { id: 'BRD-I04', name: 'Xerox', category: 'ink' },
  { id: 'BRD-I05', name: 'Brother', category: 'ink' },
  { id: 'BRD-I06', name: 'Ricoh', category: 'ink' },
]

export const SEED_USERS: AppUser[] = [
  {
    id: 'USR-001',
    name: 'محمد الحملي',
    email: 'm.alhamali@company.local',
    department: 'إدارة الاتصالات وتقنية المعلومات',
    active: true,
    permissions: [
      'dashboard.view',
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
    ],
  },
  {
    id: 'USR-002',
    name: 'أحمد السعيد',
    email: 'a.alsaeed@company.local',
    department: 'إدارة الاتصالات وتقنية المعلومات',
    active: true,
    permissions: ['dashboard.view', 'devices.view', 'devices.manage', 'inks.view', 'inks.manage', 'subscriptions.view'],
  },
  {
    id: 'USR-003',
    name: 'سارة خالد',
    email: 's.khaled@company.local',
    department: 'إدارة الاتصالات وتقنية المعلومات',
    active: false,
    permissions: ['dashboard.view', 'devices.view', 'inks.view'],
  },
]

export const SEED_SERVICES: ServiceItem[] = [
  { id: 'SRV-001', name: 'Microsoft 365 Business Standard' },
  { id: 'SRV-002', name: 'Fortinet FortiGate UTM Bundle' },
  { id: 'SRV-003', name: 'Adobe Creative Cloud Teams' },
  { id: 'SRV-004', name: 'Cloudflare Business Plan' },
  { id: 'SRV-005', name: 'Zoom Workplace Pro' },
]

export const SEED_PROVIDERS: ServiceProviderItem[] = [
  { id: 'PRV-001', name: 'Microsoft', email: 'support@microsoft.com', phone: '+1-800-642-7676' },
  { id: 'PRV-002', name: 'Fortinet', email: 'cs@fortinet.com', phone: '+1-866-648-4638' },
  { id: 'PRV-003', name: 'Adobe', email: 'enterprise@adobe.com', phone: '+1-800-833-6687' },
  { id: 'PRV-004', name: 'Cloudflare', email: 'support@cloudflare.com', phone: '+1-888-993-5273' },
  { id: 'PRV-005', name: 'Zoom', email: 'support@zoom.us', phone: '+1-888-799-9666' },
]

export const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'SUB-001',
    serviceName: 'Microsoft 365 Business Standard',
    provider: 'Microsoft',
    category: 'software',
    poNumber: 'PO-2026-104',
    department: 'الإدارة العامة',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    alertDaysBefore: 30,
    cancelled: false,
    notes: '40 رخصة بريد إلكتروني وحزمة أوفيس للموظفين.',
  },
  {
    id: 'SUB-002',
    serviceName: 'Fortinet FortiGate UTM Bundle',
    provider: 'Fortinet',
    category: 'security',
    poNumber: 'PO-2025-882',
    department: 'مركز البيانات والشبكات',
    startDate: '2025-11-30',
    endDate: '2026-11-30',
    alertDaysBefore: 30,
    cancelled: false,
    notes: 'ترخيص جدار الحماية الرئيسي للمقر.',
  },
  {
    id: 'SUB-003',
    serviceName: 'Adobe Creative Cloud Teams',
    provider: 'Adobe',
    category: 'software',
    poNumber: 'PO-2026-219',
    department: 'إدارة التحول الرقمي',
    startDate: '2026-04-15',
    endDate: '2027-04-15',
    alertDaysBefore: 30,
    cancelled: false,
    notes: '3 رخص تصميم لفريق المحتوى الرقمي.',
  },
  {
    id: 'SUB-004',
    serviceName: 'Cloudflare Business Plan',
    provider: 'Cloudflare',
    category: 'cloud',
    poNumber: 'PO-2025-710',
    department: 'إدارة تقنية المعلومات',
    startDate: '2025-11-01',
    endDate: '2026-11-01',
    alertDaysBefore: 15,
    cancelled: false,
    notes: 'حماية DNS وتسريع المواقع والتطبيقات.',
  },
  {
    id: 'SUB-005',
    serviceName: 'Zoom Workplace Pro',
    provider: 'Zoom',
    category: 'network',
    poNumber: 'PO-2026-045',
    department: 'خدمة العملاء',
    startDate: '2026-02-01',
    endDate: '2027-02-01',
    alertDaysBefore: 30,
    cancelled: false,
    notes: 'حسابات الاجتماعات المرئية.',
  },
]
