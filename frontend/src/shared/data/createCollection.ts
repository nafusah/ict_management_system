import { create } from 'zustand'
import { getStoredToken, request } from './api'

const PREFIX = 'it-management:'

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    // التخزين غير متاح
  }
  return fallback
}

function save<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(items))
  } catch {
    // نتجاهل الخطأ
  }
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`

export interface CollectionState<T extends { id: string }> {
  items: T[]
  setAll: (next: T[]) => void
  hydrate: () => Promise<void>
  add: (data: Omit<T, 'id'>) => void
  update: (item: T) => void
  remove: (id: string) => void
}

export function createCollection<T extends { id: string }>(
  key: string,
  idPrefix: string,
  seed: T[],
  apiPath?: string,
) {
  const useStore = create<CollectionState<T>>((set, get) => {
    const commit = (next: T[]) => {
      save(key, next)
      set({ items: next })
    }

    return {
      items: load(key, seed),
      setAll: commit,
      hydrate: async () => {
        if (!apiPath || !getStoredToken()) return
        try {
          const remote = await request.get<T[]>(apiPath)
          if (Array.isArray(remote)) commit(remote)
        } catch {
          // 403 أو خادم غير متصل — نحتفظ بالبيانات الحالية
        }
      },
      add: (data) => {
        const tempId = newId(idPrefix)
        const optimistic = { ...data, id: tempId } as T
        commit([optimistic, ...get().items])

        if (apiPath && getStoredToken()) {
          void request
            .post<T>(apiPath, data)
            .then((created) => {
              commit(get().items.map((i) => (i.id === tempId ? created : i)))
            })
            .catch(() => {})
        }
      },
      update: (item) => {
        commit(get().items.map((i) => (i.id === item.id ? item : i)))
        if (apiPath && getStoredToken()) {
          void request
            .put<T>(`${apiPath}/${encodeURIComponent(item.id)}`, item)
            .then((updated) => {
              commit(get().items.map((i) => (i.id === item.id ? updated : i)))
            })
            .catch(() => {})
        }
      },
      remove: (id) => {
        commit(get().items.filter((i) => i.id !== id))
        if (apiPath && getStoredToken()) {
          void request.delete(`${apiPath}/${encodeURIComponent(id)}`).catch(() => {})
        }
      },
    }
  })

  return {
    useStore,
    getAll: () => useStore.getState().items,
    setAll: (next: T[]) => useStore.getState().setAll(next),
    hydrate: () => useStore.getState().hydrate(),
    add: (data: Omit<T, 'id'>) => useStore.getState().add(data),
    update: (item: T) => useStore.getState().update(item),
    remove: (id: string) => useStore.getState().remove(id),
  }
}
