import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { QuantityStepper } from './QuantityStepper'
import { Button, Field, IconButton, Modal, SearchableSelect, TextInput } from '../../../shared/components/ui'
import { OTHER } from '../../../shared/data/options'
import { useDepartments, useEmployees, useInks } from '../../../shared/data/store'
import {
  DispenseRecipientFields,
  createInitialRecipientState,
  resolveDispenseRecipient,
} from './DispenseRecipientFields'
import type { Classification, InkColorItem } from '../../../shared/data/types'

const NO_PRINTER = '__none__'

export function CreateVoucherModal({
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
  const [rows, setRows] = useState<{ printerId: string; inkId: string; quantity: string }[]>([
    { printerId: '', inkId: '', quantity: '1' },
  ])
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

  const printerOptions = useMemo(() => {
    const ids = new Set(availableInks.map((i) => i.printerTypeId || NO_PRINTER))
    const opts = Array.from(ids)
      .filter((id) => id !== NO_PRINTER)
      .map((id) => {
        const p = printerTypeMap[id]
        return { value: id, label: p ? (p.brand ? `${p.name} (${p.brand})` : p.name) : id }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
    if (ids.has(NO_PRINTER)) opts.push({ value: NO_PRINTER, label: 'أحبار غير مرتبطة بطابعة' })
    return opts
  }, [availableInks, printerTypeMap])

  const inkOptionsFor = (printerId: string) =>
    availableInks
      .filter((i) => (i.printerTypeId || NO_PRINTER) === printerId)
      .map((i) => {
        const colorName = colorMap[i.color]?.name ?? i.color
        return {
          value: i.id,
          label: `${colorName} — ${i.model} (المتوفر: ${i.quantity})`,
        }
      })

  const resetForm = () => {
    setRecipient(createInitialRecipientState(departments, employees, 'shared'))
    setDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setRows([{ printerId: '', inkId: '', quantity: '1' }])
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
              onClick={() => setRows((prev) => [...prev, { printerId: prev[prev.length - 1]?.printerId ?? '', inkId: '', quantity: '1' }])}
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
                <div key={idx} className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2 sm:flex-nowrap">
                  <div className="min-w-0 flex-1 basis-full sm:basis-0">
                    <SearchableSelect
                      value={row.printerId}
                      onChange={(val) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, printerId: val, inkId: '' } : r)),
                        )
                      }
                      options={printerOptions}
                      placeholder="اختر الطابعة أولاً..."
                      searchPlaceholder="ابحث عن الطابعة..."
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {row.printerId ? (
                      <SearchableSelect
                        value={row.inkId}
                        onChange={(val) =>
                          setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, inkId: val } : r)))
                        }
                        options={inkOptionsFor(row.printerId)}
                        placeholder="اختر الحبر (اللون)..."
                        searchPlaceholder="ابحث باللون أو الموديل..."
                      />
                    ) : (
                      <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-white px-3 text-xs text-slate-400">
                        اختر الطابعة لعرض أحبارها
                      </div>
                    )}
                  </div>
                  <QuantityStepper
                    min={1}
                    max={inks.find((i) => i.id === row.inkId)?.quantity}
                    value={row.quantity}
                    onChange={(v) =>
                      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, quantity: v } : r)))
                    }
                  />
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
