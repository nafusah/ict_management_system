import { getStoredToken, request } from '../../shared/data/api'
import { createCollection } from '../../shared/data/createCollection'
import { SEED_INKS } from '../../shared/data/seed'
import type { Ink, InkDispense } from '../../shared/data/types'

export const inksStore = createCollection<Ink>('inks', 'INK', SEED_INKS, '/inks')
export const inkDispensesStore = createCollection<InkDispense>('ink-dispenses', 'DSP', [], '/inks/dispenses')

export const useInksStore = inksStore.useStore
export const useInks = () => inksStore.useStore((s) => s.items)
export const useInkDispenses = () => inkDispensesStore.useStore((s) => s.items)

export function syncInkDispenseWithServer(
  inkId: string,
  department: string,
  quantity: number,
  date: string,
  onDone?: () => void,
) {
  if (!getStoredToken()) return
  void request
    .post<{ ink: Ink; dispense: InkDispense }>(`/inks/${encodeURIComponent(inkId)}/dispense`, {
      department,
      quantity,
      date,
    })
    .then(({ ink }) => {
      inksStore.setAll(inksStore.getAll().map((i) => (i.id === ink.id ? ink : i)))
      void inkDispensesStore.hydrate()
      onDone?.()
    })
    .catch(() => {})
}

export function syncBatchInkDispenseWithServer(
  department: string,
  items: { inkId: string; quantity: number }[],
  date: string,
  onDone?: () => void,
) {
  if (!getStoredToken()) return
  void request
    .post<{ inks: Ink[]; dispenses: InkDispense[] }>('/inks/dispense-batch', {
      department,
      items,
      date,
    })
    .then(({ inks }) => {
      const updatedMap = new Map(inks.map((i) => [i.id, i]))
      inksStore.setAll(inksStore.getAll().map((i) => updatedMap.get(i.id) ?? i))
      void inkDispensesStore.hydrate()
      onDone?.()
    })
    .catch(() => {})
}
