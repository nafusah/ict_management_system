import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Printer } from 'lucide-react'
import { Button, Field, Modal, SearchableSelect, TextInput, cx } from '../../../shared/components/ui'
import { recordAudit } from '../../../shared/data/auth'
import { inksStore, useBrands, useInkColors, usePrinterTypes } from '../../../shared/data/store'
import { InkColorSetSelector, type ColorInkRow } from './InkColorSetSelector'
import { OTHER } from '../../../shared/data/options'
import type { Ink, InkColor } from '../../../shared/data/types'
import { Swatch } from './InkSwatch'

export function InkForm({
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
