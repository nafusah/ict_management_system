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

function notifySyncError(err: unknown, fallback: string) {
  const message = err instanceof Error && err.message ? err.message : fallback
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:sync-error', { detail: message }))
  }
}

export interface CollectionState<T extends { id: string }> {
  items: T[]
  setAll: (next: T[]) => void
  hydrate: () => Promise<void>
  add: (data: Omit<T, 'id'>) => void
  addAsync: (data: Omit<T, 'id'>) => Promise<T>
  update: (item: T) => void
  updateAsync: (item: T) => Promise<T>
  remove: (id: string) => void
  removeAsync: (id: string) => Promise<void>
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
        if (apiPath && getStoredToken()) {
          void request
            .post<T>(apiPath, data)
            .then((created) => {
              commit([created, ...get().items])
            })
            .catch((err) => {
              notifySyncError(err, 'تعذر حفظ البيانات على الخادم.')
              void get().hydrate()
            })
          return
        }
        const tempId = newId(idPrefix)
        const optimistic = { ...data, id: tempId } as T
        commit([optimistic, ...get().items])
      },
      addAsync: async (data) => {
        if (apiPath && getStoredToken()) {
          const created = await request.post<T>(apiPath, data)
          commit([created, ...get().items])
          return created
        }
        const tempId = newId(idPrefix)
        const optimistic = { ...data, id: tempId } as T
        commit([optimistic, ...get().items])
        return optimistic
      },
      update: (item) => {
        commit(get().items.map((i) => (i.id === item.id ? item : i)))
        if (apiPath && getStoredToken()) {
          void request
            .put<T>(`${apiPath}/${encodeURIComponent(item.id)}`, item)
            .then((updated) => {
              commit(get().items.map((i) => (i.id === item.id ? updated : i)))
            })
            .catch((err) => {
              notifySyncError(err, 'تعذر حفظ التعديلات على الخادم.')
              void get().hydrate()
            })
        }
      },
      updateAsync: async (item) => {
        if (apiPath && getStoredToken()) {
          const updated = await request.put<T>(`${apiPath}/${encodeURIComponent(item.id)}`, item)
          commit(get().items.map((i) => (i.id === item.id ? updated : i)))
          return updated
        }
        commit(get().items.map((i) => (i.id === item.id ? item : i)))
        return item
      },
      remove: (id) => {
        commit(get().items.filter((i) => i.id !== id))
        if (apiPath && getStoredToken()) {
          void request.delete(`${apiPath}/${encodeURIComponent(id)}`).catch((err) => {
            notifySyncError(err, 'تعذر حذف السجل من الخادم.')
            void get().hydrate()
          })
        }
      },
      removeAsync: async (id) => {
        if (apiPath && getStoredToken()) {
          await request.delete(`${apiPath}/${encodeURIComponent(id)}`)
        }
        commit(get().items.filter((i) => i.id !== id))
      },
    }
  })

  return {
    useStore,
    getAll: () => useStore.getState().items,
    setAll: (next: T[]) => useStore.getState().setAll(next),
    hydrate: () => useStore.getState().hydrate(),
    add: (data: Omit<T, 'id'>) => useStore.getState().add(data),
    addAsync: (data: Omit<T, 'id'>) => useStore.getState().addAsync(data),
    update: (item: T) => useStore.getState().update(item),
    updateAsync: (item: T) => useStore.getState().updateAsync(item),
    remove: (id: string) => useStore.getState().remove(id),
    removeAsync: (id: string) => useStore.getState().removeAsync(id),
  }
}
