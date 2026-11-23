import { useMemo, useState } from 'react'
import { ListSkeleton } from '../../shared/components/Skeleton'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpFromLine, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
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
  cx,
} from '../../shared/components/ui'
import { recordAudit, usePermission } from '../../shared/data/auth'
import { inksStore, useInkColors, useInks, usePrinterTypes, useDataLoading } from '../../shared/data/store'
import { isLowStock } from '../../shared/data/types'
import type { Ink } from '../../shared/data/types'
import { FALLBACK_COLOR } from './components/inkFallbackColor'
import { Swatch } from './components/InkSwatch'
import { InkDetailsModal } from './components/InkDetailsModal'
import { InkForm } from './components/InkFormModal'
import { BatchDispenseModal } from './components/BatchDispenseModal'

const PAGE_SIZE = 10

export default function Inks({ lockedPrinterTypeId }: { lockedPrinterTypeId?: string } = {}) {
  const canManage = usePermission('inks.manage')
  const dataLoading = useDataLoading()
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

        {dataLoading && inks.length === 0 ? <ListSkeleton /> : filtered.length === 0 && (
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
