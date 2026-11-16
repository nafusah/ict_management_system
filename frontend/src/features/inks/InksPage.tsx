import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
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
  SelectInput,
  TextInput,
  cx,
} from '../../shared/components/ui'
import { inkDispensesStore, inksStore, useBrands, useDepartments, useInkColors, useInkDispenses, useInks } from '../../shared/data/store'
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
      className="inline-block size-3 shrink-0 rounded-full ring-2 ring-white"
      style={{ background: meta.primary, boxShadow: `0 0 0 3px ${meta.border}` }}
    />
  )
}

export default function Inks() {
  const inks = useInks()
  const inkColors = useInkColors()
  const colorMap = useMemo(() => Object.fromEntries(inkColors.map((c) => [c.id, c])), [inkColors])
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Ink | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Ink | null>(null)

  const viewing = useMemo(() => inks.find((i) => i.id === viewingId) ?? null, [inks, viewingId])

  const colorParam = params.get('color')
  const colorFilter = colorParam && colorParam in colorMap ? colorParam : null
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
    return inks.filter(
      (i) =>
        (!colorFilter || i.color === colorFilter) &&
        (!lowOnly || isLowStock(i)) &&
        (!q || [i.model, i.brand, colorMap[i.color]?.name ?? i.color].some((v) => v.toLowerCase().includes(q))),
    )
  }, [inks, query, colorFilter, lowOnly, colorMap])

  const lowCount = inks.filter(isLowStock).length
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="مخزون الأحبار"
        description="كميات خراطيش الأحبار الأربعة، مع تنبيه عند وصول أي صنف إلى حد الطلب."
        action={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" />
            إضافة صنف حبر
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث بالموديل أو الماركة أو اللون"
        />
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
        />
      )}

      {editing && <InkForm ink={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.model ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) inksStore.remove(deleting.id)
          setDeleting(null)
        }}
      />
    </>
  )
}

function InkDetailsModal({
  ink,
  onClose,
  onEdit,
}: {
  ink: Ink
  onClose: () => void
  onEdit: () => void
}) {
  const inkColors = useInkColors()
  const departments = useDepartments()
  const deptNames = useMemo(() => departments.map((d) => d.name), [departments])
  const allDispenses = useInkDispenses()
  const inkDispenses = useMemo(() => allDispenses.filter((d) => d.inkId === ink.id).slice(0, 5), [allDispenses, ink.id])
  const [mode, setMode] = useState<'dispense' | 'restock'>('dispense')
  const [amountStr, setAmountStr] = useState('1')
  const [dept, setDept] = useState<string>(deptNames[0] ?? OTHER)
  const [customDept, setCustomDept] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const low = isLowStock(ink)
  const meta = inkColors.find((c) => c.id === ink.color) ?? FALLBACK_COLOR
  const parsed = parseInt(amountStr, 10)
  const validNumber = !isNaN(parsed) && parsed > 0
  const exceedsStock = mode === 'dispense' && validNumber && parsed > ink.quantity
  const chosenDept = dept === OTHER ? customDept.trim() : dept
  const canSubmit =
    validNumber &&
    !exceedsStock &&
    !(mode === 'dispense' && (ink.quantity === 0 || !chosenDept))

  const stepAmount = (delta: number) => {
    const current = validNumber ? parsed : 1
    const max = mode === 'dispense' ? Math.max(1, ink.quantity) : 999
    const next = Math.min(max, Math.max(1, current + delta))
    setAmountStr(String(next))
    setNotice(null)
  }

  const handleTransaction = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const nextQuantity =
      mode === 'dispense' ? Math.max(0, ink.quantity - parsed) : ink.quantity + parsed

    inksStore.update({ ...ink, quantity: nextQuantity })

    if (mode === 'dispense') {
      inkDispensesStore.add({
        inkId: ink.id,
        department: chosenDept,
        quantity: parsed,
        date: new Date().toISOString().slice(0, 10),
      })
      setNotice(`تم صرف ${parsed} لإدارة «${chosenDept}». الكمية المتبقية الآن: ${nextQuantity}`)
      if (nextQuantity === 0) {
        setAmountStr('1')
      } else if (parsed > nextQuantity) {
        setAmountStr(String(nextQuantity))
      }
    } else {
      setNotice(`تمت إضافة ${parsed} إلى المخزون. الكمية المتوفرة الآن: ${nextQuantity}`)
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
          <Button onClick={onEdit}>
            <Pencil className="size-4" />
            تعديل بيانات الصنف
          </Button>
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
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Swatch meta={meta} />
              <span>
                الماركة: <strong className="font-semibold text-slate-800"><bdi>{ink.brand}</bdi></strong>
              </span>
              <span aria-hidden className="text-slate-300">•</span>
              <span>
                اللون: <strong className="font-semibold text-slate-800">{meta.name} ({meta.code})</strong>
              </span>
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
        <form onSubmit={handleTransaction} noValidate className="rounded-xl border border-slate-200 p-4">
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-slate-900">عملية على المخزون</legend>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMode('dispense')
                  setNotice(null)
                }}
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
                onClick={() => {
                  setMode('restock')
                  setNotice(null)
                }}
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={dept === OTHER ? '' : 'sm:col-span-2'}>
                <Field label="الإدارة المستلمة">
                  {(id) => (
                    <SelectInput
                      id={id}
                      value={dept}
                      onChange={(e) => {
                        setDept(e.target.value)
                        setNotice(null)
                      }}
                      options={[...deptNames, OTHER].map((d) => ({ value: d, label: d }))}
                    />
                  )}
                </Field>
              </div>
              {dept === OTHER && (
                <Field label="اسم الإدارة">
                  {(id) => (
                    <TextInput
                      id={id}
                      value={customDept}
                      onChange={(e) => {
                        setCustomDept(e.target.value)
                        setNotice(null)
                      }}
                      placeholder="اكتب اسم الإدارة المستلمة"
                    />
                  )}
                </Field>
              )}
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
                  onChange={(e) => {
                    setAmountStr(e.target.value)
                    setNotice(null)
                  }}
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
          {notice && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              {notice}
            </p>
          )}
        </form>

        {inkDispenses.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2.5 text-sm font-bold text-slate-900">سجل الصرف الأخير</h3>
            <ul className="divide-y divide-slate-100 text-xs">
              {inkDispenses.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="font-semibold text-slate-800">{d.department}</span>
                  <div className="flex items-center gap-2">
                    <Pill tone="slate">{d.quantity} خرطوش</Pill>
                    <span className="font-mono text-slate-500">{d.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}

function InkForm({ ink, onClose }: { ink: Ink | null; onClose: () => void }) {
  const inkColors = useInkColors()
  const brands = useBrands()
  const brandOptions = useMemo(
    () => [...brands.filter((b) => b.category === 'ink').map((b) => b.name), OTHER],
    [brands],
  )
  const isEdit = ink !== null
  const knownBrand = !ink || brandOptions.includes(ink.brand)

  const [brand, setBrand] = useState(ink ? (knownBrand ? ink.brand : OTHER) : brandOptions[0])
  const [customBrand, setCustomBrand] = useState(ink && !knownBrand ? ink.brand : '')
  const [model, setModel] = useState(ink?.model ?? '')
  const [color, setColor] = useState<InkColor>(ink?.color ?? inkColors[0]?.id ?? 'black')
  const [quantity, setQuantity] = useState(String(ink?.quantity ?? ''))
  const [threshold, setThreshold] = useState(String(ink?.alertThreshold ?? ''))
  const [submitted, setSubmitted] = useState(false)

  const isCount = (v: string) => /^\d+$/.test(v.trim())
  const errors = {
    brand: brand === OTHER && !customBrand.trim() ? 'اكتب اسم الماركة.' : undefined,
    model: !model.trim() ? 'اكتب موديل الحبر.' : undefined,
    quantity: !isCount(quantity) ? 'اكتب الكمية رقمًا صحيحًا، مثل 12.' : undefined,
    threshold: !isCount(threshold) ? 'اكتب حد الطلب رقمًا صحيحًا، مثل 5.' : undefined,
  }
  const show = (e?: string) => (submitted ? e : undefined)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const data = {
      brand: brand === OTHER ? customBrand.trim() : brand,
      model: model.trim(),
      color,
      quantity: Number(quantity),
      alertThreshold: Number(threshold),
    }
    if (isEdit) inksStore.update({ ...data, id: ink.id })
    else inksStore.add(data)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'تعديل صنف الحبر' : 'إضافة صنف حبر'}
      description="عندما تصل الكمية إلى حد الطلب أو أقل، يظهر الصنف تحت حد الطلب في المخزون ولوحة التحكم."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button variant="primary" type="submit" form="ink-form">
            {isEdit ? 'حفظ التعديلات' : 'إضافة الصنف'}
          </Button>
        </>
      }
    >
      <form id="ink-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="الماركة">
          {(id) => (
            <SelectInput
              id={id}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              options={brandOptions.map((b) => ({ value: b, label: b }))}
            />
          )}
        </Field>

        <Field label="الموديل" error={show(errors.model)}>
          {(id, d) => (
            <TextInput
              id={id}
              dir="ltr"
              className="text-right"
              aria-describedby={d}
              aria-invalid={!!show(errors.model)}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="HP 205A (CF530A)"
              autoFocus
            />
          )}
        </Field>

        {brand === OTHER && (
          <div className="sm:col-span-2">
            <Field label="اسم الماركة" error={show(errors.brand)}>
              {(id, d) => (
                <TextInput
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!show(errors.brand)}
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                />
              )}
            </Field>
          </div>
        )}

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

        <Field label="الكمية المتوفرة" error={show(errors.quantity)} hint="عدد الخراطيش في المخزن الآن">
          {(id, d) => (
            <TextInput
              id={id}
              inputMode="numeric"
              aria-describedby={d}
              aria-invalid={!!show(errors.quantity)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
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
      </form>
    </Modal>
  )
}
