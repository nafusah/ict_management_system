import { useMemo, useState } from 'react'
import { ListSkeleton } from '../../shared/components/Skeleton'
import { CheckCircle2, Eye, Plus, Printer, Trash2, XCircle } from 'lucide-react'
import { InkReceiptModal, type InkReceiptData } from './components/InkReceiptModal'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import {
  Button,
  ConfirmDelete,
  FilterChip,
  IconButton,
  PageHeader,
  Pagination,
  Pill,
  SearchInput,
  Toast,
} from '../../shared/components/ui'
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
  useInkColors,
  useInkVouchers,
  useInks,
  usePrinterTypes,
  useDataLoading,
} from '../../shared/data/store'
import { INK_VOUCHER_STATUSES } from '../../shared/data/types'
import type { InkColorItem, InkVoucher, InkVoucherLineItem, InkVoucherStatus } from '../../shared/data/types'
import { DEFAULT_COLOR } from './components/voucherUtils'
import { formatDateTime } from './components/voucherUtils'
import { CreateVoucherModal } from './components/CreateVoucherModal'
import { VoucherDetailModal } from './components/VoucherDetailModal'
import { ApproveDispenseModal } from './components/ApproveDispenseModal'
import { RejectVoucherModal } from './components/RejectVoucherModal'

const PAGE_SIZE = 10

export default function InkVouchersPage() {
  const dataLoading = useDataLoading()
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
  const [receiptData, setReceiptData] = useState<InkReceiptData | null>(null)
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

      {dataLoading && vouchers.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ListSkeleton />
        </div>
      ) : rows.length === 0 ? (
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
                          {v.status === 'dispensed' && (
                            <IconButton
                              label="طباعة وصل استلام"
                              className="text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                              onClick={() =>
                                setReceiptData({
                                  receiptNo: v.id,
                                  date: v.dispensedAt ? v.dispensedAt.slice(0, 10) : v.date,
                                  department: v.department,
                                  scope: v.scope ?? 'shared',
                                  recipientName: v.recipientName,
                                  requesterName: v.requesterName,
                                  approvedByName: v.approvedByName,
                                  notes: v.notes,
                                  items: v.items.map((it) => {
                                    const ink = inkMap[it.inkId]
                                    const pt = ink?.printerTypeId ? printerTypes.find((p) => p.id === ink.printerTypeId) : undefined
                                    return {
                                      model: it.model,
                                      brand: it.brand ?? ink?.brand ?? '—',
                                      colorName: colorMap[it.color]?.name ?? it.color,
                                      printerTypeName: pt?.name ?? null,
                                      quantity: it.quantity,
                                    }
                                  }),
                                })
                              }
                            >
                              <Printer className="size-4" />
                            </IconButton>
                          )}
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
        onPrintReceipt={() => {
          if (!viewing) return
          const v = viewing
          setViewing(null)
          setReceiptData({
            receiptNo: v.id,
            date: v.dispensedAt ? v.dispensedAt.slice(0, 10) : v.date,
            department: v.department,
            scope: v.scope ?? 'shared',
            recipientName: v.recipientName,
            requesterName: v.requesterName,
            approvedByName: v.approvedByName,
            notes: v.notes,
            items: v.items.map((it) => {
              const ink = inkMap[it.inkId]
              const pt = ink?.printerTypeId ? printerTypes.find((p) => p.id === ink.printerTypeId) : undefined
              return {
                model: it.model,
                brand: it.brand ?? ink?.brand ?? '—',
                colorName: colorMap[it.color]?.name ?? it.color,
                printerTypeName: pt?.name ?? null,
                quantity: it.quantity,
              }
            }),
          })
        }}
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

      <InkReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />

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
