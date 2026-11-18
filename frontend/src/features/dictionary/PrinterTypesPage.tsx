import { useMemo, useState } from 'react'
import { Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { DictionaryTabs } from './components/DictionaryTabs'
import { PrinterTypeFormModal } from './components/PrinterTypeFormModal'
import {
  Button,
  ConfirmDelete,
  IconButton,
  PageHeader,
  Pill,
  Toast,
} from '../../shared/components/ui'
import { deletePrinterType, savePrinterType, useInks, usePrinterTypes } from '../../shared/data/store'
import type { PrinterTypeItem } from '../../shared/data/types'

export default function PrinterTypes() {
  const printerTypes = usePrinterTypes()
  const inks = useInks()
  const [editing, setEditing] = useState<PrinterTypeItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PrinterTypeItem | null>(null)
  const [toast, setToast] = useState<{ message: string; tone?: 'green' | 'red' } | null>(null)

  const stats = useMemo(() => {
    const map: Record<string, { items: number; cartridges: number }> = {}
    for (const ink of inks) {
      if (!ink.printerTypeId) continue
      const cur = (map[ink.printerTypeId] ??= { items: 0, cartridges: 0 })
      cur.items += 1
      cur.cartridges += ink.quantity
    }
    return map
  }, [inks])

  return (
    <div>
      <PageHeader
        title="أنواع الطابعات"
        description="إدارة أنواع وموديلات الطابعات لربطها بأصناف الأحبار ومتابعة مخزون كل طابعة."
        action={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" />
            إضافة نوع طابعة
          </Button>
        }
      />

      <DictionaryTabs />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">نوع الطابعة / الموديل</th>
                <th className="px-4 py-3">الماركة</th>
                <th className="px-4 py-3">الأحبار المربوطة</th>
                <th className="px-4 py-3">إجمالي الخراطيش</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {printerTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    لا توجد أنواع طابعات مسجلة بعد. أضف أول نوع طابعة لربطه بالأحبار.
                  </td>
                </tr>
              ) : (
                printerTypes.map((pt) => {
                  const st = stats[pt.id] ?? { items: 0, cartridges: 0 }
                  return (
                    <tr key={pt.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {pt.image ? (
                            <img
                              src={pt.image}
                              alt={pt.name}
                              className="size-10 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                            />
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                              <Printer className="size-5" />
                            </span>
                          )}
                          <span className="font-bold text-slate-900">
                            <bdi>{pt.name}</bdi>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {pt.brand ? <bdi>{pt.brand}</bdi> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={st.items > 0 ? 'blue' : 'slate'}>{st.items} صنف</Pill>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-700">
                        {st.cartridges} خرطوشة
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label={`تعديل ${pt.name}`} onClick={() => setEditing(pt)}>
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton
                            label={st.items > 0 ? 'لا يمكن حذف طابعة مرتبطة بأحبار' : `حذف ${pt.name}`}
                            disabled={st.items > 0}
                            className="hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => setDeleting(pt)}
                          >
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrinterTypeFormModal
        item={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          const isEdit = editing && editing !== 'new'
          await savePrinterType(data, isEdit ? editing.id : undefined)
          setEditing(null)
          setToast({
            message: isEdit ? 'تم حفظ تعديلات الطابعة بنجاح' : 'تمت إضافة الطابعة بنجاح',
            tone: 'green',
          })
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            try {
              await deletePrinterType(deleting.id)
              setToast({ message: `تم حذف "${deleting.name}" بنجاح`, tone: 'green' })
            } catch (err) {
              setToast({
                message: err instanceof Error ? err.message : 'تعذر حذف الطابعة.',
                tone: 'red',
              })
            }
          }
          setDeleting(null)
        }}
      />

      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  )
}
