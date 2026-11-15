import type { Device, Ink } from './types'

/** بيانات أولية تظهر عند أول تشغيل فقط، قبل أي تعديل. */
export const SEED_DEVICES: Device[] = [
  { id: 'DEV-001', name: 'Dell P2422H 24"', brand: 'Dell', kind: 'monitor', serialNumber: 'CN-0P2422-7731', department: 'إدارة تقنية المعلومات', employee: 'محمد الحملي', classification: 'personal' },
  { id: 'DEV-002', name: 'OptiPlex 7090 Tower', brand: 'Dell', kind: 'pcCase', serialNumber: 'OPT-7090-4412', department: 'إدارة تقنية المعلومات', employee: 'محمد الحملي', classification: 'personal' },
  { id: 'DEV-003', name: 'Cisco IP Phone 8841', brand: 'Cisco', kind: 'phone', serialNumber: 'FCH2231A9KQ', department: 'إدارة تقنية المعلومات', employee: 'محمد الحملي', classification: 'personal' },
  { id: 'DEV-004', name: 'Samsung S24C450', brand: 'Samsung', kind: 'monitor', serialNumber: 'SM-S24-55810', department: 'إدارة التحول الرقمي', employee: 'أحمد السعيد', classification: 'personal' },
  { id: 'DEV-005', name: 'HP ProDesk 400 G7', brand: 'HP', kind: 'pcCase', serialNumber: 'HP-PD400-20931', department: 'إدارة التحول الرقمي', employee: 'أحمد السعيد', classification: 'personal' },
  { id: 'DEV-006', name: 'Dell P2722H 27"', brand: 'Dell', kind: 'monitor', serialNumber: 'CN-0P2722-1180', department: 'خدمة العملاء', employee: 'سارة خالد', classification: 'personal' },
  { id: 'DEV-007', name: 'Lenovo ThinkCentre M70t', brand: 'Lenovo', kind: 'pcCase', serialNumber: 'LN-M70T-66204', department: 'خدمة العملاء', employee: 'سارة خالد', classification: 'personal' },
  { id: 'DEV-008', name: 'Cisco IP Phone 7821', brand: 'Cisco', kind: 'phone', serialNumber: 'FCH2307B1RT', department: 'إدارة الشؤون المالية', employee: 'مشترك للموظفين', classification: 'shared' },
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
