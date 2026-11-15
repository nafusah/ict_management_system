import { useSyncExternalStore } from 'react'
import { SEED_DEVICES, SEED_INKS } from './seed'
import type { Device, Ink } from './types'

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
export const inksStore = createCollection<Ink>('inks', 'INK', SEED_INKS)

export const useDevices = () => useSyncExternalStore(devicesStore.subscribe, devicesStore.getAll)
export const useInks = () => useSyncExternalStore(inksStore.subscribe, inksStore.getAll)
