import { getStoredToken, request } from '../../shared/data/api'
import { createCollection } from '../../shared/data/createCollection'
import type { Classification, Ink, InkDispense, InkVoucher } from '../../shared/data/types'

export const inksStore = createCollection<Ink>('inks', 'INK', '/inks')
export const inkDispensesStore = createCollection<InkDispense>('ink-dispenses', 'DSP', '/inks/dispenses')
export const inkVouchersStore = createCollection<InkVoucher>('ink-vouchers', 'VCH', '/ink-vouchers')

export const useInksStore = inksStore.useStore
export const useInks = () => inksStore.useStore((s) => s.items)
export const useInkDispenses = () => inkDispensesStore.useStore((s) => s.items)
export const useInkVouchers = () => inkVouchersStore.useStore((s) => s.items)

export async function createInkVoucherOnServer(payload: {
  department: string
  scope?: Classification
  recipientName?: string | null
  items: { inkId: string; quantity: number }[]
  notes?: string
  date?: string
}): Promise<InkVoucher> {
  const voucher = await request.post<InkVoucher>('/ink-vouchers', payload)
  inkVouchersStore.setAll([voucher, ...inkVouchersStore.getAll()])
  return voucher
}

export async function dispenseInkVoucherOnServer(voucherId: string): Promise<InkVoucher> {
  const res = await request.post<{ voucher: InkVoucher; inks: Ink[] }>(
    `/ink-vouchers/${encodeURIComponent(voucherId)}/dispense`,
  )
  const updatedMap = new Map(res.inks.map((i) => [i.id, i]))
  inksStore.setAll(inksStore.getAll().map((i) => updatedMap.get(i.id) ?? i))
  inkVouchersStore.setAll(
    inkVouchersStore.getAll().map((v) => (v.id === res.voucher.id ? res.voucher : v)),
  )
  void inkDispensesStore.hydrate()
  return res.voucher
}

export async function rejectInkVoucherOnServer(voucherId: string, notes?: string): Promise<InkVoucher> {
  const res = await request.post<{ voucher: InkVoucher }>(
    `/ink-vouchers/${encodeURIComponent(voucherId)}/reject`,
    { notes },
  )
  inkVouchersStore.setAll(
    inkVouchersStore.getAll().map((v) => (v.id === res.voucher.id ? res.voucher : v)),
  )
  return res.voucher
}

export async function deleteInkVoucherOnServer(voucherId: string): Promise<void> {
  await request.delete(`/ink-vouchers/${encodeURIComponent(voucherId)}`)
  inkVouchersStore.setAll(inkVouchersStore.getAll().filter((v) => v.id !== voucherId))
}

export async function syncInkDispenseWithServer(
  inkId: string,
  department: string,
  quantity: number,
  date: string,
  scope: Classification = 'shared',
  recipientName?: string | null,
  recipientEmail?: string | null,
  onDone?: () => void,
): Promise<void> {
  if (!getStoredToken()) return
  try {
    const { ink } = await request.post<{ ink: Ink; dispense: InkDispense }>(
      `/inks/${encodeURIComponent(inkId)}/dispense`,
      {
        department,
        scope,
        recipientName: scope === 'personal' ? recipientName ?? null : null,
        recipientEmail: recipientEmail || null,
        quantity,
        date,
      },
    )
    inksStore.setAll(inksStore.getAll().map((i) => (i.id === ink.id ? ink : i)))
    void inkDispensesStore.hydrate()
    onDone?.()
  } catch (err) {
    void inksStore.hydrate()
    throw err
  }
}

export async function syncBatchInkDispenseWithServer(
  department: string,
  items: { inkId: string; quantity: number }[],
  date: string,
  scope: Classification = 'shared',
  recipientName?: string | null,
  recipientEmail?: string | null,
  onDone?: () => void,
): Promise<void> {
  if (!getStoredToken()) return
  try {
    const { inks } = await request.post<{ inks: Ink[]; dispenses: InkDispense[] }>('/inks/dispense-batch', {
      department,
      scope,
      recipientName: scope === 'personal' ? recipientName ?? null : null,
      recipientEmail: recipientEmail || null,
      items,
      date,
    })
    const updatedMap = new Map(inks.map((i) => [i.id, i]))
    inksStore.setAll(inksStore.getAll().map((i) => updatedMap.get(i.id) ?? i))
    void inkDispensesStore.hydrate()
    onDone?.()
  } catch (err) {
    void inksStore.hydrate()
    throw err
  }
}
