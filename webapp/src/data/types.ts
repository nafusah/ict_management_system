export type Classification = 'personal' | 'shared'

export type DeviceKind = 'monitor' | 'pcCase' | 'phone' | 'other'

export interface Device {
  id: string
  name: string
  serialNumber: string
  kind: DeviceKind
  brand: string
  department: string
  employee: string
  classification: Classification
}

export type InkColor = 'black' | 'cyan' | 'magenta' | 'yellow'

export interface Ink {
  id: string
  brand: string
  model: string
  color: InkColor
  quantity: number
  alertThreshold: number
}

export const DEVICE_KINDS: Record<DeviceKind, { label: string }> = {
  monitor: { label: 'شاشة' },
  pcCase: { label: 'كيس' },
  phone: { label: 'هاتف' },
  other: { label: 'أخرى' },
}

export const CLASSIFICATIONS: Record<Classification, { label: string; hint: string }> = {
  personal: { label: 'شخصي', hint: 'عهدة لموظف واحد' },
  shared: { label: 'جماعي', hint: 'مشترك لقسم أو فريق' },
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
