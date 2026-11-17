import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, ClipboardCheck, Eye, Plus, Trash2, XCircle } from 'lucide-react'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import {
  Button,
  ConfirmDelete,
  Field,
  FilterChip,
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  SearchInput,
  SearchableSelect,
  TextInput,
  Toast,
} from '../../shared/components/ui'
import { OTHER } from '../../shared/data/options'
import { getStoredToken } from '../../shared/data/api'
import { recordAudit, useAuth, usePermission } from '../../shared/data/auth'
import {
  auditLogsStore,
  createInkVoucherOnServer,
  deleteInkVoucherOnServer,
  dispenseInkVoucherOnServer,
  inkDispensesStore,
  inkVouchersStore,
  inksStore,
  rejectInkVoucherOnServer,
  useDepartments,
  useEmployees,
  useInkColors,
  useInkVouchers,
  useInks,
  usePrinterTypes,
} from '../../shared/data/store'
import {
  DispenseRecipientFields,
  createInitialRecipientState,
  resolveDispenseRecipient,
} from './components/DispenseRecipientFields'
import { INK_DISPENSE_SCOPES, INK_VOUCHER_STATUSES } from '../../shared/data/types'
import type { Classification, InkColorItem, InkVoucher, InkVoucherLineItem, InkVoucherStatus } from '../../shared/data/types'

const PAGE_SIZE = 10

const DEFAULT_COLOR: InkColorItem = {
  id: 'black',
  name: 'أسود',
  code: 'K',
  primary: '#182230',
  light: '#f2f4f7',
  border: '#d0d5dd',
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  try {
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return value
    return dt.toLocaleString('ar-LY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function InkVouchersPage() {
  const vouchers = useInkVouchers()
  const inks = useInks()
  const inkColors = useInkColors()
  const printerTypes = usePrinterTypes()
  const session = useAuth()

  const canCreate = usePermission(['inks.vouchers.create', 'inks.vouchers.approve'])
  const canApprove = usePermission('inks.vouchers.approve')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InkVoucherStatus>('all')
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewing, setViewing] = useState<InkVoucher | null>(null)
  const [approving, setApproving] = useState<InkVoucher | null>(null)
  const [rejecting, setRejecting] = useState<InkVoucher | null>(null)
  const [deleting, setDeleting] = useState<InkVoucher | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone?: 'green' | 'red' } | null>(null)

  const colorMap = useMemo(
    () => Object.fromEntries(inkColors.map((c) => [c.id, c])) as Record<string, InkColorItem>,
    [inkColors],
  )
  const inkMap = useMemo(() => Object.fromEntries(inks.map((i) => [i.id, i])), [inks])
  const printerTypeMap = useMemo(
    () => Object.fromEntries(printerTypes.map((p) => [p.id, p])),
    [printerTypes],
  )

  const counts = useMemo(() => {
    let pending = 0
    let dispensed = 0
    let rejected = 0
    for (const v of vouchers) {
      if (v.status === 'pending') pending += 1
      else if (v.status === 'dispensed') dispensed += 1
      else if (v.status === 'rejected') rejected += 1
    }
    return { total: vouchers.length, pending, dispensed, rejected }
  }, [vouchers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vouchers.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (!q) return true
      const itemMatch = v.items.some((item) => {
        const colorName = colorMap[item.color]?.name ?? item.color
        return [item.model, item.brand ?? '', colorName].some((val) => val.toLowerCase().includes(q))
      })
      const scopeLabel = (v.scope ?? 'shared') === 'personal' ? 'موظف محدد' : 'جماعي'
      return (
        itemMatch ||
        [
          v.id,
          v.department,
          v.recipientName ?? '',
          scopeLabel,
          v.requesterName,
          v.approvedByName ?? '',
          v.notes ?? '',
        ].some((val) => val.toLowerCase().includes(q))
      )
    })
  }, [vouchers, statusFilter, query, colorMap])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const canDeleteVoucher = (v: InkVoucher) => {
    if (v.status === 'dispensed') return false
    if (canApprove) return true
    return canCreate && Boolean(session?.userId && v.requesterId === session.userId)
  }

  const handleConfirmDispense = async () => {
    if (!approving || busy) return
    setBusy(true)
    try {
      if (getStoredToken()) {
        await dispenseInkVoucherOnServer(approving.id)
        void auditLogsStore.hydrate()
      } else {
        for (const item of approving.items) {
          const currentInk = inksStore.getAll().find((i) => i.id === item.inkId)
          if (!currentInk) {
            throw new Error(`الصنف (${item.model}) غير موجود في المخزون.`)
          }
          if (item.quantity > currentInk.quantity) {
            throw new Error(
              `الكمية المطلوبة من (${item.model}) أكبر من المتوفر حالياً (${currentInk.quantity}).`,
            )
          }
        }
        const today = new Date().toISOString().slice(0, 10)
        const nowIso = new Date().toISOString()
        for (const item of approving.items) {
          const currentInk = inksStore.getAll().find((i) => i.id === item.inkId)!
          inksStore.update({ ...currentInk, quantity: currentInk.quantity - item.quantity })
          inkDispensesStore.add({
            inkId: item.inkId,
            department: approving.department,
            scope: approving.scope ?? 'shared',
            recipientName: approving.recipientName ?? null,
            quantity: item.quantity,
            date: today,
          })
        }
        inkVouchersStore.update({
          ...approving,
          status: 'dispensed',
          approvedById: session?.userId ?? null,
          approvedByName: session?.name ?? 'معتمد الصرف',
          dispensedAt: nowIso,
        })
        const summaryParts = approving.items.map((i) => `${i.quantity} × ${i.model}`)
        const targetDesc =
          (approving.scope ?? 'shared') === 'personal' && approving.recipientName
            ? `${approving.department} (الموظف: ${approving.recipientName})`
            : `${approving.department} (جماعي)`
        recordAudit(
          'dispensed',
          'ink_voucher',
          `اعتماد وصرف الإذن (${approving.id}) إلى ${targetDesc}: ${summaryParts.join('، ')}`,
          approving.id,
        )
      }
      setToast({ message: `تم اعتماد وصرف الإذن (${approving.id}) وخصم الكميات من المخزون.`, tone: 'green' })
      setApproving(null)
      if (viewing?.id === approving.id) setViewing(null)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'تعذر تنفيذ صرف الإذن.',
        tone: 'red',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async (notes: string) => {
    if (!rejecting || busy) return
    setBusy(true)
    try {
      if (getStoredToken()) {
        await rejectInkVoucherOnServer(rejecting.id, notes || undefined)
        void auditLogsStore.hydrate()
      } else {
        inkVouchersStore.update({
          ...rejecting,
          status: 'rejected',
          approvedById: session?.userId ?? null,
          approvedByName: session?.name ?? 'معتمد الصرف',
          notes: notes.trim() || rejecting.notes || null,
        })
        recordAudit(
          'updated',
          'ink_voucher',
          `رفض إذن الصرف (${rejecting.id}) لإدارة ${rejecting.department}`,
          rejecting.id,
        )
      }
      setToast({ message: `تم رفض إذن الصرف (${rejecting.id}).`, tone: 'green' })
      setRejecting(null)
      if (viewing?.id === rejecting.id) setViewing(null)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'تعذر رفض الإذن.',
        tone: 'red',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting || busy) return
    setBusy(true)
    try {
      if (getStoredToken()) {
        await deleteInkVoucherOnServer(deleting.id)
        void auditLogsStore.hydrate()
      } else {
        inkVouchersStore.remove(deleting.id)
        recordAudit('deleted', 'ink_voucher', `حذف إذن الصرف (${deleting.id})`, deleting.id)
      }
      setToast({ message: `تم حذف إذن الصرف (${deleting.id}).`, tone: 'green' })
      setDeleting(null)
      if (viewing?.id === deleting.id) setViewing(null)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'تعذر حذف الإذن.',
        tone: 'red',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="أذونات صرف الأحبار"
        description="إصدار أذونات صرف الأحبار للإدارات بوضع «قيد الانتظار» ثم اعتمادها وتنفيذ الصرف الفعلي «تم الصرف» من المخزون."
        action={
          canCreate ? (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              إصدار إذن صرف
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث برقم الإذن، الإدارة، الموظف، مقدّم الطلب، أو موديل الحبر..."
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={statusFilter === 'all'}
            onClick={() => {
              setStatusFilter('all')
              setPage(1)
            }}
          >
            الكل ({counts.total})
          </FilterChip>
          <FilterChip
            active={statusFilter === 'pending'}
            onClick={() => {
              setStatusFilter('pending')
              setPage(1)
            }}
          >
            قيد الانتظار ({counts.pending})
          </FilterChip>
          <FilterChip
            active={statusFilter === 'dispensed'}
            onClick={() => {
              setStatusFilter('dispensed')
              setPage(1)
            }}
          >
            تم الصرف ({counts.dispensed})
          </FilterChip>
          <FilterChip
            active={statusFilter === 'rejected'}
            onClick={() => {
              setStatusFilter('rejected')
              setPage(1)
            }}
          >
            مرفوض ({counts.rejected})
          </FilterChip>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Illustration svg={Illustrations.inkHero()} label="أذونات صرف الأحبار" className="mb-4 size-36" />
          <p className="text-sm font-semibold text-slate-800">
            {vouchers.length === 0 ? 'لا توجد أذونات صرف مسجلة بعد' : 'لا توجد أذونات مطابقة للتصفية الحالية'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {canCreate
              ? 'يمكنك إصدار إذن صرف جديد لإرسال طلب صرف أحبار للإدارات.'
              : 'سيتم عرض أذونات الصرف هنا فور إصدارها.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3 font-medium">رقم الإذن والتاريخ</th>
                  <th className="px-4 py-3 font-medium">الإدارة الطالبة ومقدّم الطلب</th>
                  <th className="px-4 py-3 font-medium">الأصناف المطلوبة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">المعتمد / الصرف</th>
                  <th className="w-40 px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => {
                  const statusMeta = INK_VOUCHER_STATUSES[v.status]
                  const totalUnits = v.items.reduce((sum, it) => sum + it.quantity, 0)
                  return (
                    <tr key={v.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono text-xs font-bold text-slate-900">{v.id}</div>
                        <div className="mt-0.5 text-xs text-slate-500 tabular-nums">{v.date}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-slate-900">{v.department}</span>
                          <Pill tone={(v.scope ?? 'shared') === 'personal' ? 'green' : 'blue'}>
                            {(v.scope ?? 'shared') === 'personal' && v.recipientName
                              ? v.recipientName
                              : 'جماعي'}
                          </Pill>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">بواسطة: {v.requesterName}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {v.items.slice(0, 3).map((item, idx) => {
                            const c = colorMap[item.color] ?? DEFAULT_COLOR
                            return (
                              <span
                                key={`${item.inkId}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-700"
                              >
                                <span
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: c.primary }}
                                />
                                <bdi className="font-medium">{item.model}</bdi>
                                <span className="font-bold text-slate-900 tabular-nums">× {item.quantity}</span>
                              </span>
                            )
                          })}
                          {v.items.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              +{v.items.length - 3} أخرى
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          إجمالي الكمية: {totalUnits} عبوة
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-600">
                        {v.approvedByName ? (
                          <div>
                            <div className="font-medium text-slate-800">{v.approvedByName}</div>
                            {v.dispensedAt && (
                              <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                                {formatDateTime(v.dispensedAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">بانتظار الاعتماد</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label="عرض تفاصيل الإذن" onClick={() => setViewing(v)}>
                            <Eye className="size-4" />
                          </IconButton>
                          {v.status === 'pending' && canApprove && (
                            <>
                              <IconButton
                                label="اعتماد وتنفيذ الصرف"
                                className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                onClick={() => setApproving(v)}
                              >
                                <CheckCircle2 className="size-4" />
                              </IconButton>
                              <IconButton
                                label="رفض الإذن"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setRejecting(v)}
                              >
                                <XCircle className="size-4" />
                              </IconButton>
                            </>
                          )}
                          {canDeleteVoucher(v) && (
                            <IconButton
                              label="حذف الإذن"
                              className="hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleting(v)}
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={current}
            pageCount={pageCount}
            shown={rows.length}
            total={filtered.length}
            noun="إذن"
            onPage={setPage}
          />
        </div>
      )}

      <CreateVoucherModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        inks={inks}
        colorMap={colorMap}
        printerTypeMap={printerTypeMap}
        onCreated={async (payload) => {
          if (getStoredToken()) {
            const created = await createInkVoucherOnServer(payload)
            void auditLogsStore.hydrate()
            setCreateOpen(false)
            setToast({ message: `تم إنشاء أمر صرف (${created.id}) بحالة «قيد الانتظار» بنجاح.`, tone: 'green' })
          } else {
            const lineItems: InkVoucherLineItem[] = payload.items.map((row) => {
              const ink = inkMap[row.inkId]
              return {
                inkId: row.inkId,
                model: ink?.model ?? row.inkId,
                brand: ink?.brand ?? '',
                color: ink?.color ?? 'black',
                quantity: row.quantity,
              }
            })
            inkVouchersStore.add({
              department: payload.department,
              scope: payload.scope ?? 'shared',
              recipientName: payload.scope === 'personal' ? payload.recipientName ?? null : null,
              requesterId: session?.userId ?? 'USR-001',
              requesterName: session?.name ?? 'مستخدم النظام',
              status: 'pending',
              items: lineItems,
              notes: payload.notes || null,
              approvedById: null,
              approvedByName: null,
              dispensedAt: null,
              date: payload.date,
            })
            const created = inkVouchersStore.getAll()[0]
            const targetDesc =
              (created.scope ?? 'shared') === 'personal' && created.recipientName
                ? `${created.department} (الموظف: ${created.recipientName})`
                : `${created.department} (جماعي)`
            recordAudit(
              'created',
              'ink_voucher',
              `إصدار إذن صرف (${created.id}) إلى ${targetDesc}`,
              created.id,
            )
            setCreateOpen(false)
            setToast({ message: `تم إنشاء أمر صرف (${created.id}) بحالة «قيد الانتظار» بنجاح.`, tone: 'green' })
          }
        }}
      />

      <VoucherDetailModal
        voucher={viewing}
        onClose={() => setViewing(null)}
        colorMap={colorMap}
        inkMap={inkMap}
        canApprove={canApprove}
        onApprove={() => {
          if (!viewing) return
          const target = viewing
          setViewing(null)
          setApproving(target)
        }}
        onReject={() => {
          if (!viewing) return
          const target = viewing
          setViewing(null)
          setRejecting(target)
        }}
      />

      <ApproveDispenseModal
        voucher={approving}
        onClose={() => !busy && setApproving(null)}
        inkMap={inkMap}
        colorMap={colorMap}
        busy={busy}
        onConfirm={handleConfirmDispense}
      />

      <RejectVoucherModal
        voucher={rejecting}
        onClose={() => !busy && setRejecting(null)}
        busy={busy}
        onConfirm={handleReject}
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        itemName={deleting ? `إذن الصرف ${deleting.id}` : ''}
        onCancel={() => !busy && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={() => setToast(null)} />
    </>
  )
}

function CreateVoucherModal({
  open,
  onClose,
  inks,
  colorMap,
  printerTypeMap,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  inks: ReturnType<typeof useInks>
  colorMap: Record<string, InkColorItem>
  printerTypeMap: Record<string, { id: string; name: string; brand?: string }>
  onCreated: (payload: {
    department: string
    scope?: Classification
    recipientName?: string | null
    date: string
    notes?: string
    items: { inkId: string; quantity: number }[]
  }) => Promise<void>
}) {
  const departments = useDepartments()
  const employees = useEmployees()
  const availableInks = useMemo(() => inks.filter((i) => i.quantity > 0), [inks])
  const [recipient, setRecipient] = useState(() => createInitialRecipientState(departments, employees, 'shared'))
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<{ inkId: string; quantity: string }[]>([{ inkId: '', quantity: '1' }])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setRecipient((prev) =>
      prev.department && prev.department !== OTHER
        ? prev
        : createInitialRecipientState(departments, employees, 'shared'),
    )
  }, [open, departments, employees])

  const inkOptions = useMemo(
    () =>
      availableInks.map((i) => {
        const printerName = i.printerTypeId ? printerTypeMap[i.printerTypeId]?.name : undefined
        const colorName = colorMap[i.color]?.name ?? i.color
        return {
          value: i.id,
          label: `${i.model} — ${printerName ? `${printerName} — ` : ''}${colorName} (المتوفر: ${i.quantity})`,
        }
      }),
    [availableInks, printerTypeMap, colorMap],
  )

  const resetForm = () => {
    setRecipient(createInitialRecipientState(departments, employees, 'shared'))
    setDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setRows([{ inkId: '', quantity: '1' }])
    setError('')
  }

  const handleClose = () => {
    if (submitting) return
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const resolved = resolveDispenseRecipient(recipient)
    if (resolved.error) {
      setError(resolved.error)
      return
    }

    const validRows = rows.filter((r) => r.inkId)
    if (validRows.length === 0) {
      setError('يرجى إضافة صنف حبر واحد على الأقل.')
      return
    }

    const merged = new Map<string, number>()
    for (const row of validRows) {
      const qty = Number.parseInt(row.quantity, 10)
      if (!Number.isFinite(qty) || qty < 1) {
        setError('يجب أن تكون الكمية المطلوبة رقمًا صحيحًا أكبر من صفر.')
        return
      }
      merged.set(row.inkId, (merged.get(row.inkId) ?? 0) + qty)
    }

    for (const [inkId, qty] of merged.entries()) {
      const ink = inks.find((i) => i.id === inkId)
      if (!ink) {
        setError('أحد أصناف الحبر المحددة غير موجود.')
        return
      }
      if (qty > ink.quantity) {
        setError(`الكمية المطلوبة من (${ink.model}) أكبر من المتوفر بالمخزون (${ink.quantity}).`)
        return
      }
    }

    setError('')
    setSubmitting(true)
    try {
      await onCreated({
        department: resolved.department,
        scope: resolved.scope,
        recipientName: resolved.recipientName,
        date,
        notes: notes.trim() || undefined,
        items: Array.from(merged.entries()).map(([inkId, quantity]) => ({ inkId, quantity })),
      })
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إصدار إذن الصرف.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="إصدار إذن صرف أحبار"
      description="يُنشأ الإذن بحالة «قيد الانتظار» ولا تُخصم الكميات إلا عند اعتماده من المخوّل."
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" form="create-voucher-form" disabled={submitting || availableInks.length === 0}>
            <ClipboardCheck className="size-4" />
            {submitting ? 'جاري الإصدار...' : 'إصدار الإذن (قيد الانتظار)'}
          </Button>
        </>
      }
    >
      <form id="create-voucher-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <DispenseRecipientFields
          value={recipient}
          onChange={setRecipient}
          departmentLabel="الإدارة الطالبة *"
          radioName="voucher-scope"
        />

        <Field label="تاريخ الإذن *">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          )}
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">الأصناف المطلوبة *</label>
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setRows((prev) => [...prev, { inkId: '', quantity: '1' }])}
            >
              <Plus className="size-3.5" />
              إضافة صنف آخر
            </Button>
          </div>

          {availableInks.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              لا توجد خراطيش حبر متوفرة في المخزون حالياً.
            </div>
          ) : (
            <div className="space-y-2.5">
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <SearchableSelect
                      value={row.inkId}
                      onChange={(val) =>
                        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, inkId: val } : r)))
                      }
                      options={inkOptions}
                      placeholder="اختر صنف الحبر..."
                      searchPlaceholder="ابحث بالموديل أو الطابعة..."
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <TextInput
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r)),
                        )
                      }
                      aria-label="الكمية"
                    />
                  </div>
                  {rows.length > 1 && (
                    <IconButton
                      label="حذف السطر"
                      className="mt-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="ملاحظات إضافية">
          {(id) => (
            <TextInput
              id={id}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: طابعة الدور الثاني، طلب عاجل..."
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}

function VoucherDetailModal({
  voucher,
  onClose,
  colorMap,
  inkMap,
  canApprove,
  onApprove,
  onReject,
}: {
  voucher: InkVoucher | null
  onClose: () => void
  colorMap: Record<string, InkColorItem>
  inkMap: Record<string, { quantity: number }>
  canApprove: boolean
  onApprove: () => void
  onReject: () => void
}) {
  if (!voucher) return null
  const statusMeta = INK_VOUCHER_STATUSES[voucher.status]

  return (
    <Modal
      open={Boolean(voucher)}
      onClose={onClose}
      title={`تفاصيل إذن الصرف (${voucher.id})`}
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            إغلاق
          </Button>
          {voucher.status === 'pending' && canApprove && (
            <>
              <Button variant="danger" type="button" onClick={onReject}>
                <XCircle className="size-4" />
                رفض الإذن
              </Button>
              <Button variant="primary" type="button" onClick={onApprove}>
                <CheckCircle2 className="size-4" />
                اعتماد وتنفيذ الصرف
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-2">
          <div>
            <div className="text-xs text-slate-500">الحالة</div>
            <div className="mt-1">
              <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">تاريخ الإذن</div>
            <div className="mt-1 font-medium text-slate-900 tabular-nums">{voucher.date}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">الإدارة الطالبة</div>
            <div className="mt-1 font-medium text-slate-900">{voucher.department}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">نوع الصرف / المستلم</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
              <Pill tone={(voucher.scope ?? 'shared') === 'personal' ? 'green' : 'blue'}>
                {INK_DISPENSE_SCOPES[voucher.scope ?? 'shared'].label}
              </Pill>
              {(voucher.scope ?? 'shared') === 'personal' && voucher.recipientName && (
                <span>{voucher.recipientName}</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">مقدّم الطلب</div>
            <div className="mt-1 font-medium text-slate-900">{voucher.requesterName}</div>
          </div>
          {voucher.approvedByName && (
            <>
              <div>
                <div className="text-xs text-slate-500">تمت المعالجة بواسطة</div>
                <div className="mt-1 font-medium text-slate-900">{voucher.approvedByName}</div>
              </div>
              {voucher.dispensedAt && (
                <div>
                  <div className="text-xs text-slate-500">تاريخ ووقت الصرف</div>
                  <div className="mt-1 font-medium text-slate-900 tabular-nums">
                    {formatDateTime(voucher.dispensedAt)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">الأصناف المطلوبة</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">موديل الحبر</th>
                  <th className="px-3 py-2 font-medium">اللون</th>
                  <th className="px-3 py-2 font-medium">الكمية</th>
                  {voucher.status === 'pending' && <th className="px-3 py-2 font-medium">المتوفر بالمخزون</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {voucher.items.map((item, idx) => {
                  const c = colorMap[item.color] ?? DEFAULT_COLOR
                  const stock = inkMap[item.inkId]?.quantity
                  return (
                    <tr key={`${item.inkId}-${idx}`}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <bdi>{item.model}</bdi>
                        {item.brand && <span className="mr-1.5 text-slate-400">({item.brand})</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: c.primary }} />
                          <span>{c.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 tabular-nums">{item.quantity}</td>
                      {voucher.status === 'pending' && (
                        <td className="px-3 py-2 tabular-nums">
                          {stock === undefined ? (
                            <span className="text-slate-400">غير متاح</span>
                          ) : stock < item.quantity ? (
                            <span className="font-semibold text-red-600">{stock} (غير كافٍ)</span>
                          ) : (
                            <span className="font-medium text-emerald-700">{stock}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {voucher.notes && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">ملاحظات: </span>
            {voucher.notes}
          </div>
        )}
      </div>
    </Modal>
  )
}

function ApproveDispenseModal({
  voucher,
  onClose,
  inkMap,
  colorMap,
  busy,
  onConfirm,
}: {
  voucher: InkVoucher | null
  onClose: () => void
  inkMap: Record<string, { quantity: number }>
  colorMap: Record<string, InkColorItem>
  busy: boolean
  onConfirm: () => Promise<void>
}) {
  if (!voucher) return null

  const hasShortage = voucher.items.some((item) => {
    const stock = inkMap[item.inkId]?.quantity ?? 0
    return item.quantity > stock
  })

  return (
    <Modal
      open={Boolean(voucher)}
      onClose={onClose}
      title={`تأكيد صرف الإذن (${voucher.id})`}
      description={`سيتم تحويل حالة الإذن إلى «تم الصرف» وخصم الكميات التالية لصالح ${voucher.department}${
        (voucher.scope ?? 'shared') === 'personal' && voucher.recipientName
          ? ` (الموظف: ${voucher.recipientName})`
          : ' (جماعي للإدارة)'
      }.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy || hasShortage}
          >
            <CheckCircle2 className="size-4" />
            {busy ? 'جاري التنفيذ...' : 'تأكيد وتم الصرف'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {voucher.items.map((item, idx) => {
            const stock = inkMap[item.inkId]?.quantity ?? 0
            const c = colorMap[item.color] ?? DEFAULT_COLOR
            const insufficient = item.quantity > stock
            return (
              <li key={`${item.inkId}-${idx}`} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: c.primary }} />
                  <bdi>{item.model}</bdi>
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="font-bold text-slate-900">المطلوب: {item.quantity}</span>
                  <span className={insufficient ? 'font-semibold text-red-600' : 'text-slate-500'}>
                    (المتوفر: {stock})
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        {hasShortage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            رصيد المخزون الحالي لا يكفي لتنفيذ هذا الإذن. يرجى توريد الكمية أو رفض الإذن.
          </div>
        )}
      </div>
    </Modal>
  )
}

function RejectVoucherModal({
  voucher,
  onClose,
  busy,
  onConfirm,
}: {
  voucher: InkVoucher | null
  onClose: () => void
  busy: boolean
  onConfirm: (notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState('')

  const handleClose = () => {
    if (busy) return
    setNotes('')
    onClose()
  }

  return (
    <Modal
      open={Boolean(voucher)}
      onClose={handleClose}
      title={voucher ? `رفض إذن الصرف (${voucher.id})` : ''}
      description="سيتم تغيير حالة الإذن إلى «مرفوض» دون خصم أي كميات من المخزون."
      size="sm"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            type="button"
            disabled={busy}
            onClick={() => {
              void onConfirm(notes).then(() => setNotes(''))
            }}
          >
            <XCircle className="size-4" />
            {busy ? 'جاري الرفض...' : 'تأكيد الرفض'}
          </Button>
        </>
      }
    >
      <Field label="سبب الرفض (اختياري)">
        {(id) => (
          <TextInput
            id={id}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: عدم توفر رصيد أو تكرار الطلب..."
          />
        )}
      </Field>
    </Modal>
  )
}
