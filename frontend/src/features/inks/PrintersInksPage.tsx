import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Plus } from 'lucide-react'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import { Button, PageHeader, Pill, SearchInput, Toast, cx } from '../../shared/components/ui'
import { usePermission } from '../../shared/data/auth'
import { savePrinterType, useInkColors, useInks, usePrinterTypes } from '../../shared/data/store'
import { isLowStock } from '../../shared/data/types'
import { PrinterTypeFormModal } from '../dictionary/components/PrinterTypeFormModal'

const countItems = (n: number) =>
  n === 1 ? 'صنف واحد' : n === 2 ? 'صنفان' : n <= 10 ? `${n} أصناف` : `${n} صنفًا`

export default function PrintersInksPage() {
  const printerTypes = usePrinterTypes()
  const inks = useInks()
  const inkColors = useInkColors()
  const colorMap = useMemo(() => Object.fromEntries(inkColors.map((c) => [c.id, c])), [inkColors])
  const canViewInks = usePermission(['inks.view', 'inks.manage'])
  const canManagePrinterTypes = usePermission(['dictionary.printerTypes', 'dictionary.inkColors'])
  const canAddPrinter = usePermission(['inks.manage', 'dictionary.printerTypes', 'dictionary.inkColors'])
  const [query, setQuery] = useState('')
  const [openPrinterId, setOpenPrinterId] = useState<string | null>(null)
  const [addingPrinter, setAddingPrinter] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return printerTypes
    return printerTypes.filter((pt) =>
      [pt.name, pt.brand ?? ''].some((v) => v.toLowerCase().includes(q)),
    )
  }, [printerTypes, query])

  return (
    <div>
      <PageHeader
        title="الطابعات والأحبار المرتبطة بها"
        description="اضغط على أي طابعة لعرض قائمة الأحبار المربوطة بها وكمياتها المتوفرة."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/">
              <Button variant="secondary">
                <ArrowRight className="size-4" />
                لوحة التحكم
              </Button>
            </Link>
            {canManagePrinterTypes && (
              <Link to="/dictionary/printer-types">
                <Button variant="secondary">إدارة أنواع الطابعات</Button>
              </Link>
            )}
            {canAddPrinter && (
              <Button variant="primary" onClick={() => setAddingPrinter(true)}>
                <Plus className="size-4" />
                إضافة طابعة
              </Button>
            )}
            {canViewInks && (
              <Link to="/inks">
                <Button variant={canAddPrinter ? 'secondary' : 'primary'}>عرض كل الأحبار</Button>
              </Link>
            )}
          </div>
        }
      />

      {printerTypes.length > 0 && (
        <div className="mb-5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="ابحث باسم الطابعة أو الماركة"
          />
        </div>
      )}

      {printerTypes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          لم يتم إضافة أنواع طابعات بعد.
          {canManagePrinterTypes && (
            <>
              {' '}
              أضف أنواع الطابعات من{' '}
              <Link to="/dictionary/printer-types" className="font-semibold text-slate-900 underline">
                القاموس
              </Link>{' '}
              لربطها بالأحبار.
            </>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          لا توجد طابعات تطابق البحث.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((pt) => {
            const items = inks.filter((i) => i.printerTypeId === pt.id)
            const total = items.reduce((s, i) => s + i.quantity, 0)
            const low = items.filter(isLowStock).length
            const isOpen = openPrinterId === pt.id

            return (
              <div
                key={pt.id}
                className={cx(
                  'overflow-hidden rounded-xl border bg-white transition-colors',
                  isOpen ? 'border-slate-900 ring-1 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenPrinterId((cur) => (cur === pt.id ? null : pt.id))}
                  className="w-full cursor-pointer p-4 text-start transition-colors hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  {pt.image ? (
                    <img
                      src={pt.image}
                      alt={`صورة طابعة ${pt.name}`}
                      className="mx-auto h-28 w-auto max-w-full rounded-lg object-contain"
                    />
                  ) : (
                    <Illustration
                      svg={Illustrations.device('printer')}
                      label={`رسمة طابعة ${pt.name}`}
                      className="mx-auto h-28"
                    />
                  )}
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="text-3xl font-extrabold tabular-nums">{total}</span>
                      <span className="line-clamp-2 text-sm font-semibold text-slate-700">
                        <bdi>{pt.name}</bdi>
                      </span>
                    </div>
                    <ChevronDown
                      className={cx(
                        'size-4 shrink-0 text-slate-400 transition-transform duration-200',
                        isOpen && 'rotate-180 text-slate-900',
                      )}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {items.length === 0 ? (
                      'لا توجد أحبار مربوطة'
                    ) : low === 0 ? (
                      `${countItems(items.length)} مربوط • المخزون كافٍ`
                    ) : (
                      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950">
                        {countItems(low)} تحت الحد
                      </span>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="page-transition border-t border-slate-200 bg-slate-50/70 p-3">
                    {items.length === 0 ? (
                      <p className="py-2 text-center text-xs text-slate-500">
                        لا توجد أحبار مربوطة بهذه الطابعة.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-200/80">
                        {items.map((ink) => {
                          const color = colorMap[ink.color]
                          const lowInk = isLowStock(ink)
                          return (
                            <li key={ink.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className="size-2.5 shrink-0 rounded-full border border-black/10"
                                  style={{ background: color?.primary ?? '#64748b' }}
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-bold text-slate-900">
                                    <bdi>{ink.model}</bdi>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {color ? `${color.name} (${color.code})` : ink.color}
                                  </div>
                                </div>
                              </div>
                              <Pill tone={lowInk ? 'amber' : 'green'}>
                                {ink.quantity}
                              </Pill>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    {canViewInks && (
                      <Link
                        to={`/inks?printerType=${pt.id}`}
                        className="mt-3 block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                      >
                        إدارة أحبار الطابعة ←
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <PrinterTypeFormModal
        item={null}
        open={addingPrinter}
        onClose={() => setAddingPrinter(false)}
        onSave={async (data) => {
          await savePrinterType(data)
          setAddingPrinter(false)
          setToast('تمت إضافة الطابعة بنجاح وأصبحت متاحة لجميع المستخدمين')
        }}
      />

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />
    </div>
  )
}
