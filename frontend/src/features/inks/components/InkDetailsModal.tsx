import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Minus, Pencil, Plus, Printer } from 'lucide-react'
import { Illustration, Illustrations } from '../../../shared/components/Illustrations'
import { Button, IconButton, Modal, Pill, TextInput, cx } from '../../../shared/components/ui'
import { getStoredToken } from '../../../shared/data/api'
import { recordAudit, usePermission } from '../../../shared/data/auth'
import {
  inkDispensesStore,
  inksStore,
  syncInkDispenseWithServer,
  useDepartments,
  useEmployees,
  useInkColors,
  useInkDispenses,
  usePrinterTypes,
} from '../../../shared/data/store'
import {
  DispenseRecipientFields,
  createInitialRecipientState,
  resolveDispenseRecipient,
} from './DispenseRecipientFields'
import { InkReceiptModal, type InkReceiptData } from './InkReceiptModal'
import { isLowStock } from '../../../shared/data/types'
import type { Ink } from '../../../shared/data/types'
import { FALLBACK_COLOR } from './inkFallbackColor'
import { Swatch } from './InkSwatch'

export function InkDetailsModal({
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
