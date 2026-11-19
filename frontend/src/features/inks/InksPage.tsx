import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Minus, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
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
  cx,
} from '../../shared/components/ui'
import { getStoredToken } from '../../shared/data/api'
import { recordAudit, usePermission } from '../../shared/data/auth'
import { inkDispensesStore, inksStore, syncBatchInkDispenseWithServer, syncInkDispenseWithServer, useBrands, useDepartments, useEmployees, useInkColors, useInkDispenses, useInks, usePrinterTypes } from '../../shared/data/store'
import {
  DispenseRecipientFields,
  createInitialRecipientState,
  resolveDispenseRecipient,
} from './components/DispenseRecipientFields'
import { InkReceiptModal, type InkReceiptData } from './components/InkReceiptModal'
import { InkColorSetSelector, type ColorInkRow } from './components/InkColorSetSelector'
import { QuantityStepper } from './components/QuantityStepper'
import { OTHER } from '../../shared/data/options'
import { isLowStock } from '../../shared/data/types'
import type { Ink, InkColor, InkColorItem } from '../../shared/data/types'

const PAGE_SIZE = 10

const FALLBACK_COLOR: InkColorItem = {
  id: 'unknown',
  name: 'غير محدد',
  code: '?',
  primary: '#64748b',
  light: '#f1f5f9',
  border: '#cbd5e1',
}

function Swatch({ meta }: { meta: InkColorItem }) {
  return (
    <span
      aria-hidden
      className="inline-block size-3 shrink-0 rounded-full"
      style={{ background: meta.primary }}
    />
  )
}

export default function Inks({ lockedPrinterTypeId }: { lockedPrinterTypeId?: string } = {}) {
  const canManage = usePermission('inks.manage')
  const inks = useInks()
  const inkColors = useInkColors()
  const printerTypes = usePrinterTypes()
  const colorMap = useMemo(() => Object.fromEntries(inkColors.map((c) => [c.id, c])), [inkColors])
  const printerTypeMap = useMemo(() => Object.fromEntries(printerTypes.map((p) => [p.id, p])), [printerTypes])
  const lockedPrinter = lockedPrinterTypeId ? printerTypeMap[lockedPrinterTypeId] : undefined
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Ink | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Ink | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const viewing = useMemo(() => inks.find((i) => i.id === viewingId) ?? null, [inks, viewingId])

  const colorParam = params.get('color')
  const colorFilter = colorParam && colorParam in colorMap ? colorParam : null
  const printerParam = params.get('printerType')
  const printerFilter = lockedPrinterTypeId
    ? lockedPrinterTypeId
    : printerParam && printerParam in printerTypeMap
      ? printerParam
      : null
  const lowOnly = params.get('low') === '1'

  const setFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inks.filter((i) => {
      const printerName = i.printerTypeId ? (printerTypeMap[i.printerTypeId]?.name ?? '') : ''
      return (
        (!colorFilter || i.color === colorFilter) &&
        (!printerFilter || i.printerTypeId === printerFilter) &&
        (!lowOnly || isLowStock(i)) &&
        (!q ||
          [i.model, i.brand, printerName, colorMap[i.color]?.name ?? i.color].some((v) =>
            v.toLowerCase().includes(q),
          ))
      )
    })
  }, [inks, query, colorFilter, printerFilter, lowOnly, colorMap, printerTypeMap])

  const scopedInks = useMemo(
    () => (lockedPrinterTypeId ? inks.filter((i) => i.printerTypeId === lockedPrinterTypeId) : inks),
    [inks, lockedPrinterTypeId],
  )
  const lowCount = scopedInks.filter(isLowStock).length
  const totalCartridges = scopedInks.reduce((sum, i) => sum + i.quantity, 0)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      {lockedPrinterTypeId && (
        <div className="mb-4">
          <Link
            to="/inks/printers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowRight className="size-3.5" />
            العودة إلى الطابعات والأحبار
          </Link>
        </div>
      )}

      {lockedPrinter && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3.5">
            {lockedPrinter.image ? (
              <img
                src={lockedPrinter.image}
                alt={lockedPrinter.name}
                className="size-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain p-1"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Printer className="size-7" />
              </span>
            )}
            <div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                أحبار الطابعة فقط (عرض مخصص)
              </span>
              <h1 className="mt-1 text-lg font-extrabold text-slate-900">
                <bdi>{lockedPrinter.name}</bdi>
              </h1>
              <p className="text-xs text-slate-500">
                {lockedPrinter.brand ? `${lockedPrinter.brand} • ` : ''}
                {scopedInks.length} صنف حبر • {totalCartridges} خرطوشة متوفرة
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setBatchOpen(true)} disabled={totalCartridges === 0}>
                <ArrowUpFromLine className="size-4" />
                صرف من أحبار الطابعة
              </Button>
              <Button variant="primary" onClick={() => setEditing('new')}>
                <Plus className="size-4" />
                إضافة حبر للطابعة
              </Button>
            </div>
          )}
        </div>
      )}

      {!lockedPrinterTypeId && (
        <PageHeader
          title="مخزون الأحبار"
          description="تصنيف كميات خراطيش الأحبار حسب نوع الطابعة، مع تنبيه عند وصول أي صنف إلى حد الطلب."
          action={
            canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setBatchOpen(true)}>
                  <ArrowUpFromLine className="size-4" />
                  صرف لإدارة
                </Button>
                <Button variant="primary" onClick={() => setEditing('new')}>
                  <Plus className="size-4" />
                  إضافة صنف حبر
                </Button>
              </div>
            ) : undefined
          }
        />
      )}

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder={lockedPrinterTypeId ? 'ابحث في أحبار هذه الطابعة بالموديل أو اللون...' : 'ابحث بالموديل أو نوع الطابعة أو الماركة أو اللون'}
        />
        {!lockedPrinterTypeId && printerTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب نوع الطابعة">
            <FilterChip active={!printerFilter} onClick={() => setFilter('printerType', null)}>
              كل الطابعات
            </FilterChip>
            {printerTypes.map((pt) => (
              <FilterChip
                key={pt.id}
                active={printerFilter === pt.id}
                onClick={() => setFilter('printerType', pt.id)}
              >
                <Printer className="size-3.5 text-slate-500" />
                <bdi>{pt.name}</bdi>
              </FilterChip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب اللون">
          <FilterChip active={!colorFilter} onClick={() => setFilter('color', null)}>
            كل الألوان
          </FilterChip>
          {inkColors.map((c) => (
            <FilterChip key={c.id} active={colorFilter === c.id} onClick={() => setFilter('color', c.id)}>
              <Swatch meta={c} />
              {c.name}
            </FilterChip>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />
          <FilterChip active={lowOnly} onClick={() => setFilter('low', lowOnly ? null : '1')}>
            تحت حد الطلب ({lowCount})
          </FilterChip>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الصنف</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">نوع الطابعة</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الكمية المتوفرة</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">حد الطلب</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  <span className="sr-only">الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((ink) => {
                const low = isLowStock(ink)
                const meta = colorMap[ink.color] ?? FALLBACK_COLOR
                const printerType = ink.printerTypeId ? printerTypeMap[ink.printerTypeId] : undefined
                return (
                  <tr
                    key={ink.id}
                    onClick={() => setViewingId(ink.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Swatch meta={meta} />
                        <div>
                          <div className="font-semibold text-slate-900">
                            <bdi>{ink.model}</bdi>
                          </div>
                          <div className="text-xs text-slate-500">
                            <bdi>{ink.brand}</bdi>، {meta.name} ({meta.code})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {printerType ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                          <Printer className="size-3.5 text-slate-500" />
                          <bdi>{printerType.name}</bdi>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">غير محدد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cx(
                          'text-base font-bold tabular-nums',
                          low ? 'text-yellow-800' : 'text-slate-900',
                        )}
                      >
                        {ink.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{ink.alertThreshold}</td>
                    <td className="px-4 py-3">
                      {low ? <Pill tone="amber">تحت حد الطلب</Pill> : <Pill tone="green">كافٍ</Pill>}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="secondary"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => setViewingId(ink.id)}
                        >
                          التفاصيل
                        </Button>
                        {canManage && (
                          <>
                            <IconButton label={`تعديل ${ink.model}`} onClick={() => setEditing(ink)}>
                              <Pencil className="size-4" />
                            </IconButton>
                            <IconButton
                              label={`حذف ${ink.model}`}
                              className="hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleting(ink)}
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold">
              {inks.length === 0 ? 'لا توجد أصناف حبر في المخزون.' : 'لا توجد أصناف تطابق البحث.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {inks.length === 0 ? 'أضف أول صنف ليظهر هنا.' : 'غيّر كلمة البحث أو أزل الفلاتر.'}
            </p>
          </div>
        )}

        <Pagination
          page={current}
          pageCount={pageCount}
          shown={rows.length}
          total={filtered.length}
          noun="صنف"
          onPage={setPage}
        />
      </div>

      {viewing && (
        <InkDetailsModal
          ink={viewing}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            const target = viewing
            setViewingId(null)
            setEditing(target)
          }}
          onSuccess={(msg) => {
            setViewingId(null)
            setToast(msg)
          }}
        />
      )}

      {editing && (
        <InkForm
          ink={editing === 'new' ? null : editing}
          defaultPrinterTypeId={printerFilter ?? ''}
          lockPrinterType={Boolean(lockedPrinterTypeId)}
          onClose={() => setEditing(null)}
          onSuccess={(msg) => setToast(msg)}
        />
      )}

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.model ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            try {
              await inksStore.removeAsync(deleting.id)
              recordAudit('deleted', 'ink', `حذف صنف حبر: ${deleting.model}`, deleting.id)
              setToast(`تم حذف "${deleting.model}" بنجاح`)
            } catch (err) {
              setToast(err instanceof Error ? err.message : 'تعذر حذف صنف الحبر.')
            }
          }
          setDeleting(null)
        }}
      />

      {batchOpen && (
        <BatchDispenseModal
          lockedPrinterTypeId={lockedPrinterTypeId}
          onClose={() => setBatchOpen(false)}
          onSuccess={(msg) => {
            setBatchOpen(false)
            setToast(msg)
          }}
        />
      )}

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />
    </>
  )
}

function InkDetailsModal({
  ink,
  onClose,
  onEdit,
  onSuccess,
}: {
  ink: Ink
  onClose: () => void
  onEdit: () => void
  onSuccess: (msg: string) => void
}) {
  const canManage = usePermission('inks.manage')
  const inkColors = useInkColors()
  const printerTypes = usePrinterTypes()
  const departments = useDepartments()
  const employees = useEmployees()
  const allDispenses = useInkDispenses()
  const inkDispenses = useMemo(() => allDispenses.filter((d) => d.inkId === ink.id).slice(0, 5), [allDispenses, ink.id])
  const linkedPrinter = useMemo(
    () => (ink.printerTypeId ? printerTypes.find((p) => p.id === ink.printerTypeId) : undefined),
    [printerTypes, ink.printerTypeId],
  )
  const [mode, setMode] = useState<'dispense' | 'restock'>('dispense')
  const [amountStr, setAmountStr] = useState('1')
  const [recipient, setRecipient] = useState(() => createInitialRecipientState(departments, employees, 'shared'))
  const [submitting, setSubmitting] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<InkReceiptData | null>(null)

  const low = isLowStock(ink)
  const meta = inkColors.find((c) => c.id === ink.color) ?? FALLBACK_COLOR
  const parsed = parseInt(amountStr, 10)
  const validNumber = !isNaN(parsed) && parsed > 0
  const exceedsStock = mode === 'dispense' && validNumber && parsed > ink.quantity
  const resolvedRecipient = resolveDispenseRecipient(recipient)
  const canSubmit =
    !submitting &&
    validNumber &&
    !exceedsStock &&
    !(mode === 'dispense' && (ink.quantity === 0 || Boolean(resolvedRecipient.error)))

  const stepAmount = (delta: number) => {
    const current = validNumber ? parsed : 1
    const max = mode === 'dispense' ? Math.max(1, ink.quantity) : 999
    const next = Math.min(max, Math.max(1, current + delta))
    setAmountStr(String(next))
  }

  const handleTransaction = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setTxError(null)

    const nextQuantity =
      mode === 'dispense' ? Math.max(0, ink.quantity - parsed) : ink.quantity + parsed

    if (mode === 'dispense') {
      const today = new Date().toISOString().slice(0, 10)
      const { department: chosenDept, scope, recipientName, recipientEmail } = resolvedRecipient
      const targetDesc =
        scope === 'personal' && recipientName
          ? `«${chosenDept}» (الموظف: ${recipientName})`
          : `«${chosenDept}» (جماعي)`

      if (getStoredToken()) {
        setSubmitting(true)
        try {
          await syncInkDispenseWithServer(ink.id, chosenDept, parsed, today, scope, recipientName, recipientEmail)
        } catch (err) {
          setTxError(err instanceof Error ? err.message : 'تعذر تنفيذ عملية الصرف.')
          return
        } finally {
          setSubmitting(false)
        }
      } else {
        inksStore.update({ ...ink, quantity: nextQuantity })
        inkDispensesStore.add({
          inkId: ink.id,
          department: chosenDept,
          scope,
          recipientName,
          quantity: parsed,
          date: today,
        })
        recordAudit('dispensed', 'ink', `صرف ${parsed} من (${ink.model}) إلى ${targetDesc}`, ink.id)
      }
      onSuccess(`تم إنشاء أمر صرف (${parsed} × ${ink.model}) إلى ${targetDesc} بنجاح`)
    } else {
      setSubmitting(true)
      try {
        await inksStore.updateAsync({ ...ink, quantity: nextQuantity })
        recordAudit('restocked', 'ink', `توريد ${parsed} من (${ink.model}) — المتوفر: ${nextQuantity}`, ink.id)
        onSuccess(`تمت إضافة ${parsed} إلى مخزون (${ink.model}) بنجاح`)
      } catch (err) {
        setTxError(err instanceof Error ? err.message : 'تعذر تحديث مخزون الحبر.')
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="تفاصيل الصنف وحركة المخزون"
      description="استعرض بيانات الحبر، وقم بصرف الخراطيش أو إضافة كميات جديدة للمخزون."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {canManage ? (
            <Button onClick={onEdit}>
              <Pencil className="size-4" />
              تعديل بيانات الصنف
            </Button>
          ) : (
            <span />
          )}
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* بطاقة تعريف الحبر */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
          <Illustration
            svg={Illustrations.cartridge(meta)}
            label={`خرطوشة حبر ${meta.name}`}
            className="mx-auto h-24 w-32 shrink-0 sm:mx-0"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                <bdi>{ink.model}</bdi>
              </h3>
              {low ? <Pill tone="amber">تحت حد الطلب</Pill> : <Pill tone="green">كافٍ</Pill>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Swatch meta={meta} />
              <span>
                الماركة: <strong className="font-semibold text-slate-800"><bdi>{ink.brand}</bdi></strong>
              </span>
              <span aria-hidden className="text-slate-300">•</span>
              <span>
                اللون: <strong className="font-semibold text-slate-800">{meta.name} ({meta.code})</strong>
              </span>
              {linkedPrinter && (
                <>
                  <span aria-hidden className="text-slate-300">•</span>
                  <span>
                    الطابعة: <strong className="font-semibold text-slate-800"><bdi>{linkedPrinter.name}</bdi></strong>
                  </span>
                </>
              )}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="block text-xs text-slate-500">الكمية المتوفرة حاليًا</span>
                <span
                  className={cx(
                    'mt-0.5 block text-2xl font-extrabold tabular-nums',
                    low ? 'text-yellow-800' : 'text-slate-900',
                  )}
                >
                  {ink.quantity}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="block text-xs text-slate-500">حد الطلب (التنبيه)</span>
                <span className="mt-0.5 block text-2xl font-extrabold tabular-nums text-slate-700">
                  {ink.alertThreshold}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* قسم صرف أو إضافة الأحبار */}
        {canManage && (
          <form onSubmit={handleTransaction} noValidate className="rounded-xl border border-slate-200 p-4">
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-slate-900">عملية على المخزون</legend>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode('dispense')}
                  className={cx(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                    mode === 'dispense'
                      ? 'border-slate-900 bg-slate-900 font-bold text-white'
                      : 'border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <ArrowUpFromLine className="size-4" />
                  صرف من المخزون
                </button>
                <button
                  type="button"
                  onClick={() => setMode('restock')}
                  className={cx(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                    mode === 'restock'
                      ? 'border-slate-900 bg-slate-900 font-bold text-white'
                      : 'border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <ArrowDownToLine className="size-4" />
                  إضافة إلى المخزون
                </button>
              </div>
            </fieldset>

            {mode === 'dispense' && (
              <div className="mt-4">
                <DispenseRecipientFields
                  value={recipient}
                  onChange={setRecipient}
                  radioName="ink-detail-scope"
                  allowEmployeeEmail
                />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="tx-amount" className="mb-1.5 block text-sm font-medium text-slate-700">
                  {mode === 'dispense' ? 'الكمية المراد صرفها' : 'الكمية المراد إضافتها'}
                </label>
                <div className="flex items-center gap-2">
                  <IconButton
                    label="إنقاص واحد"
                    className="size-10 shrink-0 border border-slate-300"
                    disabled={!validNumber || parsed <= 1}
                    onClick={() => stepAmount(-1)}
                  >
                    <Minus className="size-4" />
                  </IconButton>
                  <TextInput
                    id="tx-amount"
                    inputMode="numeric"
                    className="text-center text-base font-bold tabular-nums"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                  />
                  <IconButton
                    label="زيادة واحد"
                    className="size-10 shrink-0 border border-slate-300"
                    disabled={mode === 'dispense' && validNumber && parsed >= ink.quantity}
                    onClick={() => stepAmount(1)}
                  >
                    <Plus className="size-4" />
                  </IconButton>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit}
                className="w-full sm:w-auto sm:min-w-40"
              >
                {mode === 'dispense' ? 'تأكيد الصرف' : 'تأكيد الإضافة'}
              </Button>
            </div>

            {mode === 'dispense' && ink.quantity === 0 && (
              <p className="mt-2.5 text-xs font-medium text-red-700">
                المخزون الحالي صفر؛ لا يمكن صرف خراطيش قبل إضافة كمية جديدة.
              </p>
            )}
            {exceedsStock && ink.quantity > 0 && (
              <p className="mt-2.5 text-xs font-medium text-red-700">
                الكمية المطلوبة ({parsed}) أكبر من المتوفر في المخزون ({ink.quantity}).
              </p>
            )}
            {txError && (
              <p className="mt-2.5 text-xs font-medium text-red-700">{txError}</p>
            )}
          </form>
        )}

        {inkDispenses.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2.5 text-sm font-bold text-slate-900">سجل الصرف الأخير</h3>
            <ul className="divide-y divide-slate-100 text-xs">
              {inkDispenses.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{d.department}</span>
                    <span className="text-slate-500">
                      • {(d.scope ?? 'shared') === 'personal' && d.recipientName ? d.recipientName : 'جماعي'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone="slate">{d.quantity} خرطوش</Pill>
                    <span className="font-mono text-slate-500">{d.date}</span>
                    <IconButton
                      label="طباعة وصل استلام"
                      className="size-7 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() =>
                        setReceiptData({
                          receiptNo: d.id,
                          date: d.date,
                          department: d.department,
                          scope: d.scope ?? 'shared',
                          recipientName: d.recipientName,
                          items: [
                            {
                              model: ink.model,
                              brand: ink.brand,
                              colorName: meta.name,
                              printerTypeName: linkedPrinter?.name ?? null,
                              quantity: d.quantity,
                            },
                          ],
                        })
                      }
                    >
                      <Printer className="size-3.5" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <InkReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
    </Modal>
  )
}

function InkForm({
  ink,
  defaultPrinterTypeId = '',
  lockPrinterType = false,
  onClose,
  onSuccess,
}: {
  ink: Ink | null
  defaultPrinterTypeId?: string
  lockPrinterType?: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const inkColors = useInkColors()
  const brands = useBrands()
  const printerTypes = usePrinterTypes()
  const brandOptions = useMemo(
    () => [...brands.filter((b) => b.category === 'ink').map((b) => b.name), OTHER],
    [brands],
  )
  const printerOptions = useMemo(
    () => printerTypes.map((p) => ({ value: p.id, label: p.brand ? `${p.name} (${p.brand})` : p.name })),
    [printerTypes],
  )
  const isEdit = ink !== null
  const initialPrinterId = ink?.printerTypeId ?? (defaultPrinterTypeId || printerTypes[0]?.id || '')
  const [printerTypeId, setPrinterTypeId] = useState(initialPrinterId)
  const selectedPrinter = useMemo(
    () => printerTypes.find((p) => p.id === printerTypeId),
    [printerTypes, printerTypeId],
  )

  const [model, setModel] = useState(ink?.model ?? '')
  const [color, setColor] = useState<InkColor>(ink?.color ?? inkColors[0]?.id ?? 'black')
  const [quantity, setQuantity] = useState(String(ink?.quantity ?? ''))
  const [threshold, setThreshold] = useState(String(ink?.alertThreshold ?? ''))
  const [colorRows, setColorRows] = useState<ColorInkRow[]>(() => [
    {
      color: ink?.color ?? inkColors[0]?.id ?? 'black',
      model: ink?.model ?? '',
      quantity: String(ink?.quantity ?? ''),
    },
  ])
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleModelChange = (nextModel: string) => {
    setColorRows((prev) =>
      prev.map((r) => (!r.model.trim() || r.model === model ? { ...r, model: nextModel } : r)),
    )
    setModel(nextModel)
  }

  const handleQuantityChange = (nextQty: string) => {
    setColorRows((prev) =>
      prev.map((r) => (!r.quantity.trim() || r.quantity === quantity ? { ...r, quantity: nextQty } : r)),
    )
    setQuantity(nextQty)
  }

  const isMultiColor = !isEdit && colorRows.length > 1
  const isCount = (v: string) => /^\d+$/.test(v.trim())
  const multiRowError = !isEdit
    ? colorRows.some((r) => !(r.model || model).trim() || !isCount(r.quantity || quantity))
      ? 'يرجى التأكد من كتابة الموديل والكمية لكل لون محدد.'
      : undefined
    : undefined

  const errors = {
    printer: !selectedPrinter && !ink ? 'يرجى اختيار نوع الطابعة.' : undefined,
    model: !model.trim() && (isEdit || colorRows.some((r) => !r.model.trim())) ? 'اكتب الموديل الرئيسي للحبر، مثل 222A.' : undefined,
    quantity: !isMultiColor && !isCount(colorRows[0]?.quantity || quantity) ? 'اكتب الكمية رقمًا صحيحًا، مثل 12.' : undefined,
    threshold: !isCount(threshold) ? 'اكتب حد الطلب رقمًا صحيحًا، مثل 5.' : undefined,
    colors: multiRowError,
  }
  const show = (e?: string) => (submitted ? e : undefined)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setSaveError(null)
    if (Object.values(errors).some(Boolean) || saving) return
    const resolvedBrand = selectedPrinter?.brand || ink?.brand || brandOptions[0] || 'HP'
    const resolvedModel = model.trim()
    const resolvedPrinterId = printerTypeId || null
    const resolvedThreshold = Number(threshold)

    setSaving(true)
    try {
      if (isEdit) {
        const data = {
          brand: resolvedBrand,
          model: resolvedModel,
          color,
          printerTypeId: resolvedPrinterId,
          quantity: Number(quantity),
          alertThreshold: resolvedThreshold,
        }
        await inksStore.updateAsync({ ...data, id: ink.id })
        recordAudit('updated', 'ink', `تعديل صنف حبر: ${data.model}`, ink.id)
        onSuccess('تم حفظ تعديلات الحبر بنجاح')
      } else if (colorRows.length > 1) {
        for (const row of colorRows) {
          const rowModel = (row.model || resolvedModel).trim()
          const rowQty = Number((row.quantity || quantity).trim())
          await inksStore.addAsync({
            brand: resolvedBrand,
            model: rowModel,
            color: row.color,
            printerTypeId: resolvedPrinterId,
            quantity: rowQty,
            alertThreshold: resolvedThreshold,
          })
        }
        recordAudit('created', 'ink', `إضافة طقم أحبار (${colorRows.length} ألوان): ${resolvedModel || colorRows[0]?.model}`)
        onSuccess(`تمت إضافة ${colorRows.length} أصناف حبر بنجاح`)
      } else {
        const onlyRow = colorRows[0]
        const onlyColor = onlyRow?.color ?? color
        const onlyModel = (onlyRow?.model || resolvedModel).trim()
        const onlyQty = Number((onlyRow?.quantity || quantity).trim())
        const data = {
          brand: resolvedBrand,
          model: onlyModel,
          color: onlyColor,
          printerTypeId: resolvedPrinterId,
          quantity: onlyQty,
          alertThreshold: resolvedThreshold,
        }
        await inksStore.addAsync(data)
        recordAudit('created', 'ink', `إضافة صنف حبر: ${data.model} (الكمية: ${data.quantity})`)
        onSuccess('تمت إضافة صنف الحبر بنجاح')
      }
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'تعذر حفظ الحبر على الخادم.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title={isEdit ? 'تعديل صنف الحبر' : 'إضافة صنف حبر'}
      description="يتم جلب الماركة تلقائياً من نوع الطابعة المختارة مع إدخال موديل الحبر لمرة واحدة."
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button variant="primary" type="submit" form="ink-form" disabled={saving}>
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : isMultiColor ? `إضافة (${colorRows.length} ألوان)` : 'إضافة الصنف'}
          </Button>
        </>
      }
    >
      <form id="ink-form" onSubmit={(e) => void submit(e)} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {lockPrinterType && selectedPrinter ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="block text-xs text-slate-500">نوع الطابعة (مثبّت تلقائياً)</span>
              <span className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-900">
                <Printer className="size-4 text-slate-600" />
                <bdi>{selectedPrinter.name}</bdi>
                {selectedPrinter.brand && <span className="font-normal text-slate-500">({selectedPrinter.brand})</span>}
              </span>
            </div>
          ) : (
            <Field label="نوع الطابعة" hint="يتم اعتماد الماركة من الطابعة المختارة تلقائياً" error={show(errors.printer)}>
              {(id) => (
                <SearchableSelect
                  id={id}
                  value={printerTypeId}
                  onChange={setPrinterTypeId}
                  options={printerOptions}
                  searchPlaceholder="ابحث عن نوع الطابعة..."
                />
              )}
            </Field>
          )}
        </div>

        <div className="sm:col-span-2">
          <Field
            label={isEdit ? 'موديل الحبر' : 'الموديل الرئيسي للحبر'}
            hint={!isEdit ? 'ينزل تلقائياً في الموديل الفرعي لكل لون بالأسفل ويمكنك تعديل كل لون حسب رغبتك' : undefined}
            error={show(errors.model)}
          >
            {(id, desc) => (
              <TextInput
                id={id}
                dir="ltr"
                className="text-right"
                aria-invalid={Boolean(show(errors.model))}
                aria-describedby={desc}
                placeholder="مثال: 222A"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
              />
            )}
          </Field>
        </div>

        {isEdit ? (
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">اللون</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {inkColors.map((c) => (
                <label
                  key={c.id}
                  className={cx(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-slate-900',
                    color === c.id ? 'border-slate-900 bg-slate-50 font-semibold' : 'border-slate-300 hover:border-slate-400',
                  )}
                >
                  <input
                    type="radio"
                    name="ink-color"
                    value={c.id}
                    checked={color === c.id}
                    onChange={() => setColor(c.id)}
                    className="sr-only"
                  />
                  <Swatch meta={c} />
                  {c.name} ({c.code})
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <div className="sm:col-span-2">
            <InkColorSetSelector
              inkColors={inkColors}
              rows={colorRows}
              baseModel={model}
              baseQuantity={quantity}
              onChange={setColorRows}
              error={show(errors.colors)}
            />
          </div>
        )}

        <Field
          label={isMultiColor ? 'الكمية الافتراضية لكل لون' : 'الكمية المتوفرة'}
          error={show(errors.quantity)}
          hint="عدد الخراطيش في المخزن الآن"
        >
          {(id, d) => (
            <TextInput
              id={id}
              inputMode="numeric"
              aria-describedby={d}
              aria-invalid={!!show(errors.quantity)}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="12"
            />
          )}
        </Field>

        <Field label="حد الطلب" error={show(errors.threshold)} hint="أقل كمية قبل أن نعيد الطلب">
          {(id, d) => (
            <TextInput
              id={id}
              inputMode="numeric"
              aria-describedby={d}
              aria-invalid={!!show(errors.threshold)}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="5"
            />
          )}
        </Field>

        {saveError && (
          <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {saveError}
          </p>
        )}
      </form>
    </Modal>
  )
}

function BatchDispenseModal({
  lockedPrinterTypeId,
  onClose,
  onSuccess,
}: {
  lockedPrinterTypeId?: string
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const inks = useInks()
  const departments = useDepartments()
  const employees = useEmployees()
  const inkColors = useInkColors()
  const availableInks = useMemo(
    () =>
      inks.filter(
        (i) => i.quantity > 0 && (!lockedPrinterTypeId || i.printerTypeId === lockedPrinterTypeId),
      ),
    [inks, lockedPrinterTypeId],
  )

  const [recipient, setRecipient] = useState(() => createInitialRecipientState(departments, employees, 'shared'))
  const [rows, setRows] = useState<{ key: number; inkId: string; quantity: string }[]>(() => [
    { key: 1, inkId: availableInks[0]?.id ?? '', quantity: '1' },
  ])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const addRow = () => {
    const used = new Set(rows.map((r) => r.inkId))
    const nextInk = availableInks.find((i) => !used.has(i.id)) ?? availableInks[0]
    if (!nextInk) return
    setRows((prev) => [...prev, { key: Date.now() + Math.random(), inkId: nextInk.id, quantity: '1' }])
    setError('')
  }

  const removeRow = (key: number) => {
    setRows((prev) => prev.filter((r) => r.key !== key))
    setError('')
  }

  const updateRow = (key: number, patch: Partial<{ inkId: string; quantity: string }>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError('')

    const resolved = resolveDispenseRecipient(recipient)
    if (resolved.error) {
      setError(resolved.error)
      return
    }
    const { department: chosenDept, scope, recipientName, recipientEmail } = resolved

    if (rows.length === 0) {
      setError('أضف صنف حبر واحداً على الأقل.')
      return
    }

    const totals = new Map<string, number>()
    for (const r of rows) {
      if (!r.inkId) {
        setError('يرجى اختيار صنف الحبر في كل سطر.')
        return
      }
      const qty = parseInt(r.quantity, 10)
      if (isNaN(qty) || qty <= 0) {
        setError('يجب أن تكون الكمية رقماً أكبر من صفر.')
        return
      }
      totals.set(r.inkId, (totals.get(r.inkId) ?? 0) + qty)
    }

    for (const [inkId, totalQty] of totals.entries()) {
      const ink = inks.find((i) => i.id === inkId)
      if (!ink) {
        setError('أحد أصناف الحبر غير موجود.')
        return
      }
      if (totalQty > ink.quantity) {
        setError(`الكمية المطلوبة من (${ink.model}) أكبر من المتوفر (${ink.quantity}).`)
        return
      }
    }

    const items = Array.from(totals.entries()).map(([inkId, quantity]) => ({ inkId, quantity }))
    const today = new Date().toISOString().slice(0, 10)
    const targetDesc =
      scope === 'personal' && recipientName
        ? `«${chosenDept}» (الموظف: ${recipientName})`
        : `«${chosenDept}» (جماعي)`

    if (getStoredToken()) {
      setSubmitting(true)
      try {
        await syncBatchInkDispenseWithServer(chosenDept, items, today, scope, recipientName, recipientEmail)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'تعذر تنفيذ عملية الصرف.')
        return
      } finally {
        setSubmitting(false)
      }
    } else {
      inksStore.setAll(
        inksStore.getAll().map((ink) => {
          const deducted = totals.get(ink.id)
          return deducted ? { ...ink, quantity: Math.max(0, ink.quantity - deducted) } : ink
        }),
      )
      const parts: string[] = []
      for (const { inkId, quantity } of items) {
        const ink = inks.find((i) => i.id === inkId)
        inkDispensesStore.add({ inkId, department: chosenDept, scope, recipientName, quantity, date: today })
        if (ink) parts.push(`${quantity} × ${ink.model}`)
      }
      recordAudit('dispensed', 'ink', `صرف مجمع إلى ${targetDesc}: ${parts.join('، ')}`)
    }

    onSuccess(`تم إنشاء أمر صرف (${items.length} ${items.length === 1 ? 'صنف' : 'أصناف'}) إلى ${targetDesc} بنجاح`)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="صرف أكثر من نوع حبر"
      description="حدد نوع الصرف (جماعي للإدارة أو موظف محدد) ثم أضف أصناف الأحبار والكميات المطلوبة."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            type="submit"
            form="batch-dispense-form"
            disabled={submitting || availableInks.length === 0}
          >
            {submitting ? 'جارٍ الصرف...' : 'تأكيد الصرف'}
          </Button>
        </>
      }
    >
      <form id="batch-dispense-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <DispenseRecipientFields
          value={recipient}
          onChange={setRecipient}
          radioName="ink-batch-scope"
          allowEmployeeEmail
        />

        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">أصناف الأحبار ({rows.length})</span>
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-2.5 text-xs"
              disabled={availableInks.length === 0}
              onClick={addRow}
            >
              <Plus className="size-3.5" />
              إضافة صنف آخر
            </Button>
          </div>

          {availableInks.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">لا توجد أحبار متوفرة في المخزون حالياً.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const selectedInk = availableInks.find((i) => i.id === r.inkId)
                return (
                  <div key={r.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <SearchableSelect
                        value={r.inkId}
                        onChange={(inkId) => updateRow(r.key, { inkId })}
                        options={availableInks.map((i) => {
                          const cName = inkColors.find((c) => c.id === i.color)?.name ?? i.color
                          return {
                            value: i.id,
                            label: `${i.model} — ${cName} (المتوفر: ${i.quantity})`,
                          }
                        })}
                        searchPlaceholder="ابحث عن موديل الحبر..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <QuantityStepper
                        min={1}
                        max={selectedInk?.quantity}
                        value={r.quantity}
                        onChange={(v) => updateRow(r.key, { quantity: v })}
                      />
                      {rows.length > 1 && (
                        <IconButton
                          label="إزالة الصنف"
                          className="hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeRow(r.key)}
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
