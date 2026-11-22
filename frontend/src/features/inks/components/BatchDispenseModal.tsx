import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton, Modal, SearchableSelect } from '../../../shared/components/ui'
import { getStoredToken } from '../../../shared/data/api'
import { recordAudit } from '../../../shared/data/auth'
import {
  inkDispensesStore,
  inksStore,
  syncBatchInkDispenseWithServer,
  useDepartments,
  useEmployees,
  useInkColors,
  useInks,
} from '../../../shared/data/store'
import {
  DispenseRecipientFields,
  createInitialRecipientState,
  resolveDispenseRecipient,
} from './DispenseRecipientFields'
import { QuantityStepper } from './QuantityStepper'

export function BatchDispenseModal({
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
