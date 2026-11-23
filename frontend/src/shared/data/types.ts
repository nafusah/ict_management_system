export type Classification = 'personal' | 'shared'
export type DeviceLocation = 'town' | 'field'

export type BuiltinDeviceKind = 'monitor' | 'pcCase' | 'phone' | 'printer' | 'other'
export type DeviceKind = string

export interface DeviceTypeItem {
  id: string
  label: string
  icon: BuiltinDeviceKind
}

export type BrandCategory = 'device' | 'ink'

export interface BrandItem {
  id: string
  name: string
  category: BrandCategory
}

export interface Device {
  id: string
  name: string
  serialNumber: string
  kind: DeviceKind
  brand: string
  department: string
  employee: string
  classification: Classification
  location?: DeviceLocation
  floor?: string
  officeNumber?: string
}

export type InkColor = string

export interface InkColorItem {
  id: string
  name: string
  code: string
  primary: string
  light: string
  border: string
}

export interface PrinterTypeItem {
  id: string
  name: string
  brand?: string
  image?: string | null
}

export interface Ink {
  id: string
  brand: string
  model: string
  color: InkColor
  printerTypeId?: string | null
  quantity: number
  alertThreshold: number
}

export interface InkDispense {
  id: string
  inkId: string
  department: string
  scope?: Classification
  recipientName?: string | null
  quantity: number
  date: string
}

export type InkVoucherStatus = 'pending' | 'dispensed' | 'rejected'

export interface InkVoucherLineItem {
  inkId: string
  model: string
  brand?: string
  color: string
  quantity: number
}

export interface InkVoucher {
  id: string
  department: string
  scope?: Classification
  recipientName?: string | null
  requesterId?: string | null
  requesterName: string
  status: InkVoucherStatus
  items: InkVoucherLineItem[]
  notes?: string | null
  approvedById?: string | null
  approvedByName?: string | null
  dispensedAt?: string | null
  date: string
}

export const INK_DISPENSE_SCOPES: Record<Classification, { label: string; hint: string }> = {
  shared: { label: 'جماعي للإدارة', hint: 'مشترك لطابعة الإدارة أو القسم' },
  personal: { label: 'موظف محدد', hint: 'صرف باسم موظف معين داخل الإدارة' },
}

export const INK_VOUCHER_STATUSES: Record<InkVoucherStatus, { label: string; tone: 'amber' | 'green' | 'red' }> = {
  pending: { label: 'قيد الانتظار', tone: 'amber' },
  dispensed: { label: 'تم الصرف', tone: 'green' },
  rejected: { label: 'مرفوض', tone: 'red' },
}

export type Permission =
  | 'dashboard.devices'
  | 'dashboard.inks'
  | 'dashboard.subscriptions'
  | 'devices.view'
  | 'devices.manage'
  | 'inks.view'
  | 'inks.manage'
  | 'inks.vouchers.view'
  | 'inks.vouchers.create'
  | 'inks.vouchers.approve'
  | 'subscriptions.view'
  | 'subscriptions.manage'
  | 'dictionary.deviceTypes'
  | 'dictionary.printerTypes'
  | 'dictionary.inkColors'
  | 'dictionary.brands'
  | 'dictionary.services'
  | 'settings.manage'
  | 'employees.manage'

export interface AppUser {
  id: string
  name: string
  email: string
  password?: string
  department: string
  active: boolean
  permissions: Permission[]
}

export type AuditAction = 'created' | 'updated' | 'deleted' | 'dispensed' | 'restocked' | 'login' | 'logout'

export interface AuditLogItem {
  id: string
  userId?: string
  userName: string
  action: AuditAction
  entityType: string
  entityId?: string
  summary: string
  createdAt: string
}

export interface DepartmentItem {
  id: string
  name: string
}

export interface EmployeeItem {
  id: string
  name: string
  department: string
}

export const PERMISSIONS: Record<Permission, { label: string; group: string }> = {
  'dashboard.devices': { label: 'لوحة التحكم: إحصائيات الأجهزة', group: 'لوحة التحكم' },
  'dashboard.inks': { label: 'لوحة التحكم: إحصائيات الأحبار', group: 'لوحة التحكم' },
  'dashboard.subscriptions': { label: 'لوحة التحكم: إحصائيات الاشتراكات', group: 'لوحة التحكم' },
  'devices.view': { label: 'عرض الأجهزة', group: 'الأجهزة' },
  'devices.manage': { label: 'إدارة الأجهزة (إضافة/تعديل/حذف)', group: 'الأجهزة' },
  'inks.view': { label: 'عرض مخزون الأحبار', group: 'الأحبار' },
  'inks.manage': { label: 'إدارة الأحبار (صرف/توريد/تعديل)', group: 'الأحبار' },
  'inks.vouchers.view': { label: 'أذونات صرف الأحبار: عرض السجل', group: 'الأحبار' },
  'inks.vouchers.create': { label: 'أذونات صرف الأحبار: إصدار إذن (قيد الانتظار)', group: 'الأحبار' },
  'inks.vouchers.approve': { label: 'أذونات صرف الأحبار: اعتماد وتنفيذ الصرف (تم الصرف / رفض)', group: 'الأحبار' },
  'subscriptions.view': { label: 'عرض الاشتراكات والتراخيص', group: 'الاشتراكات' },
  'subscriptions.manage': { label: 'إدارة الاشتراكات (إضافة/تجديد/حذف)', group: 'الاشتراكات' },
  'dictionary.deviceTypes': { label: 'القاموس: إدارة أنواع الأجهزة', group: 'القاموس' },
  'dictionary.printerTypes': { label: 'القاموس: إدارة أنواع الطابعات', group: 'القاموس' },
  'dictionary.inkColors': { label: 'القاموس: إدارة ألوان الأحبار', group: 'القاموس' },
  'dictionary.brands': { label: 'القاموس: إدارة الماركات', group: 'القاموس' },
  'dictionary.services': { label: 'القاموس: إدارة الخدمات والمزودين', group: 'القاموس' },
  'settings.manage': { label: 'إدارة الإعدادات والمستخدمين', group: 'النظام' },
  'employees.manage': { label: 'إدارة الموظفين والإدارات', group: 'النظام' },
}

export type SubscriptionCategoryIcon = 'monitor' | 'cloud' | 'security' | 'network' | 'wifi' | 'layers'
export type SubscriptionCategory = string
export type SubscriptionStatus = 'active' | 'expiring' | 'expired' | 'cancelled'

export interface SubscriptionCategoryItem {
  id: string
  name: string
  icon: SubscriptionCategoryIcon
}

export interface ServiceItem {
  id: string
  name: string
}

export interface ServiceProviderItem {
  id: string
  name: string
  email?: string
  phone?: string
}

export interface Subscription {
  id: string
  serviceName: string
  provider: string
  category: SubscriptionCategory
  poNumber: string
  department?: string
  serviceLocation?: string
  startDate?: string
  endDate: string
  alertDaysBefore: number
  cancelled: boolean
  notes: string
}

export const SUBSCRIPTION_CATEGORIES: Record<string, { label: string }> = {
  software: { label: 'برمجيات وتطبيقات' },
  cloud: { label: 'خدمات سحابية' },
  security: { label: 'أمن سيبراني وحماية' },
  network: { label: 'شبكات واتصالات' },
  other: { label: 'أخرى' },
}

export const SUBSCRIPTION_STATUSES: Record<SubscriptionStatus, { label: string }> = {
  active: { label: 'نشط' },
  expiring: { label: 'قارب الانتهاء' },
  expired: { label: 'منتهي' },
  cancelled: { label: 'ملغي' },
}

export function daysUntilExpiry(endDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getSubscriptionStatus(sub: Subscription): SubscriptionStatus {
  if (sub.cancelled) return 'cancelled'
  const days = daysUntilExpiry(sub.endDate)
  if (days < 0) return 'expired'
  if (days <= sub.alertDaysBefore) return 'expiring'
  return 'active'
}

export const DEVICE_KINDS: Record<BuiltinDeviceKind, { label: string }> = {
  monitor: { label: 'شاشة' },
  pcCase: { label: 'كيس' },
  phone: { label: 'هاتف' },
  printer: { label: 'طابعة' },
  other: { label: 'أخرى' },
}

export const CLASSIFICATIONS: Record<Classification, { label: string; hint: string }> = {
  personal: { label: 'شخصي', hint: 'عهدة لموظف واحد' },
  shared: { label: 'جماعي', hint: 'مشترك لقسم أو فريق' },
}

export const DEVICE_LOCATIONS: Record<DeviceLocation, { label: string; hint: string }> = {
  town: { label: 'Town', hint: 'المقر الرئيسي (Town)' },
  field: { label: 'Field', hint: 'موقع العمل في الحقل (Field)' },
}

export const INK_COLORS: Record<
  InkColor,
  { name: string; code: string; primary: string; light: string; border: string }
> = {
  black: { name: 'أسود', code: 'K', primary: '#182230', light: '#f2f4f7', border: '#d0d5dd' },
  cyan: { name: 'سماوي', code: 'C', primary: '#0284c7', light: '#e0f2fe', border: '#bae6fd' },
  magenta: { name: 'أرجواني', code: 'M', primary: '#db2777', light: '#fce7f3', border: '#fbcfe8' },
  yellow: { name: 'أصفر', code: 'Y', primary: '#ca8a04', light: '#fef9c3', border: '#fef08a' },
}

export const isLowStock = (ink: Ink) => ink.quantity <= ink.alertThreshold

// ---------------------------------------------------------------
// سجل عهدة الأجهزة
// ---------------------------------------------------------------

export type CustodyAction = 'assigned' | 'transferred' | 'returned'
export type DeviceCondition = 'new' | 'good' | 'fair' | 'damaged'

export interface CustodyRecord {
  id: string
  deviceId: string
  action: CustodyAction
  fromEmployee?: string | null
  fromDepartment?: string | null
  toEmployee?: string | null
  toDepartment?: string | null
  date: string
  condition?: DeviceCondition | null
  notes?: string | null
  performedById?: string | null
  performedByName?: string | null
  createdAt?: string
}

export const CUSTODY_ACTIONS: Record<CustodyAction, { label: string; tone: 'green' | 'blue' | 'amber' }> = {
  assigned: { label: 'تسليم', tone: 'green' },
  transferred: { label: 'نقل عهدة', tone: 'blue' },
  returned: { label: 'إرجاع للمخزن', tone: 'amber' },
}

export const DEVICE_CONDITIONS: Record<DeviceCondition, string> = {
  new: 'جديد',
  good: 'جيد',
  fair: 'مقبول (آثار استخدام)',
  damaged: 'تالف / يحتاج صيانة',
}

/** نفس القيم المعرّفة في DeviceController::STORAGE_* على الخادم */
export const STORAGE_EMPLOYEE = 'مخزن تقنية المعلومات'
export const SHARED_EMPLOYEE = 'مشترك للإدارة'
