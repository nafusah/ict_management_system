import { useSyncExternalStore } from 'react'
import {
  SEED_BRANDS,
  SEED_DEVICES,
  SEED_DEVICE_TYPES,
  SEED_INKS,
  SEED_INK_COLORS,
  SEED_PROVIDERS,
  SEED_SERVICES,
  SEED_SUBSCRIPTIONS,
  SEED_USERS,
} from './seed'
import { SEED_DEPARTMENTS, SEED_EMPLOYEES } from './employeesSeed'
import type {
  AppUser,
  BrandItem,
  DepartmentItem,
  Device,
  DeviceTypeItem,
  EmployeeItem,
  Ink,
  InkColorItem,
  InkDispense,
  ServiceItem,
  ServiceProviderItem,
  Subscription,
} from './types'

/**
 * طبقة التخزين. تحفظ البيانات الآن في متصفح المستخدم (localStorage).
 * عند ربط خادم حقيقي يُستبدل هذا الملف وحده بنداءات API بنفس الدوال،
 * ولا تحتاج الشاشات إلى أي تعديل.
 */

const PREFIX = 'it-management:'

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    // التخزين غير متاح (وضع التصفح الخاص مثلًا): نعمل بالبيانات الأولية.
  }
  return fallback
}

function save<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(items))
  } catch {
    // نتجاهل الخطأ؛ تبقى البيانات في الذاكرة حتى إغلاق الصفحة.
  }
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`

function createCollection<T extends { id: string }>(key: string, idPrefix: string, seed: T[]) {
  let items = load(key, seed)
  const listeners = new Set<() => void>()

  const commit = (next: T[]) => {
    items = next
    save(key, items)
    listeners.forEach((l) => l())
  }

  return {
    getAll: () => items,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    add: (data: Omit<T, 'id'>) => commit([{ ...data, id: newId(idPrefix) } as T, ...items]),
    update: (item: T) => commit(items.map((i) => (i.id === item.id ? item : i))),
    remove: (id: string) => commit(items.filter((i) => i.id !== id)),
  }
}

export const devicesStore = createCollection<Device>('devices', 'DEV', SEED_DEVICES)
export const deviceTypesStore = createCollection<DeviceTypeItem>('device-types', 'TYPE', SEED_DEVICE_TYPES)
export const inksStore = createCollection<Ink>('inks', 'INK', SEED_INKS)
export const inkDispensesStore = createCollection<InkDispense>('ink-dispenses', 'DSP', [])
export const inkColorsStore = createCollection<InkColorItem>('ink-colors', 'CLR', SEED_INK_COLORS)
export const brandsStore = createCollection<BrandItem>('brands', 'BRD', SEED_BRANDS)
export const servicesStore = createCollection<ServiceItem>('services', 'SRV', SEED_SERVICES)
export const providersStore = createCollection<ServiceProviderItem>('providers', 'PRV', SEED_PROVIDERS)
export const subscriptionsStore = createCollection<Subscription>('subscriptions', 'SUB', SEED_SUBSCRIPTIONS)
export const usersStore = createCollection<AppUser>('users', 'USR', SEED_USERS)
export const departmentsStore = createCollection<DepartmentItem>('departments', 'DPT', SEED_DEPARTMENTS)
export const employeesStore = createCollection<EmployeeItem>('employees', 'EMP', SEED_EMPLOYEES)

export const useDevices = () => useSyncExternalStore(devicesStore.subscribe, devicesStore.getAll)
export const useDeviceTypes = () => useSyncExternalStore(deviceTypesStore.subscribe, deviceTypesStore.getAll)
export const useInks = () => useSyncExternalStore(inksStore.subscribe, inksStore.getAll)
export const useInkDispenses = () => useSyncExternalStore(inkDispensesStore.subscribe, inkDispensesStore.getAll)
export const useInkColors = () => useSyncExternalStore(inkColorsStore.subscribe, inkColorsStore.getAll)
export const useBrands = () => useSyncExternalStore(brandsStore.subscribe, brandsStore.getAll)
export const useServices = () => useSyncExternalStore(servicesStore.subscribe, servicesStore.getAll)
export const useProviders = () => useSyncExternalStore(providersStore.subscribe, providersStore.getAll)
export const useSubscriptions = () => useSyncExternalStore(subscriptionsStore.subscribe, subscriptionsStore.getAll)
export const useUsers = () => useSyncExternalStore(usersStore.subscribe, usersStore.getAll)
export const useDepartments = () => useSyncExternalStore(departmentsStore.subscribe, departmentsStore.getAll)
export const useEmployees = () => useSyncExternalStore(employeesStore.subscribe, employeesStore.getAll)
