import { useMemo, useRef, useState } from 'react'
import { ImagePlus, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { DictionaryTabs } from './components/DictionaryTabs'
import {
  Button,
  ConfirmDelete,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Pill,
  SelectInput,
  TextInput,
} from '../../shared/components/ui'
import { printerTypesStore, useBrands, useInks, usePrinterTypes } from '../../shared/data/store'
import type { PrinterTypeItem } from '../../shared/data/types'

export default function PrinterTypes() {
  const printerTypes = usePrinterTypes()
  const inks = useInks()
  const [editing, setEditing] = useState<PrinterTypeItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PrinterTypeItem | null>(null)

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
        onSave={(data) => {
          if (editing && editing !== 'new') {
            printerTypesStore.update({ ...data, id: editing.id })
          } else {
            printerTypesStore.add(data)
          }
          setEditing(null)
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) printerTypesStore.remove(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function resizeImageToDataUrl(file: File, maxSize = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('الملف ليس صورة صالحة'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const webp = canvas.toDataURL('image/webp', 0.85)
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function PrinterTypeFormModal({
  item,
  open,
  onClose,
  onSave,
}: {
  item: PrinterTypeItem | null
  open: boolean
  onClose: () => void
  onSave: (data: Omit<PrinterTypeItem, 'id'>) => void
}) {
  const brands = useBrands()
  const brandOptions = useMemo(() => {
    const names = Array.from(new Set(brands.map((b) => b.name)))
    return [{ value: '', label: '— بدون تحديد —' }, ...names.map((n) => ({ value: n, label: n }))]
  }, [brands])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(item?.name ?? '')
  const [brand, setBrand] = useState(item?.brand ?? '')
  const [image, setImage] = useState<string | null>(item?.image ?? null)
  const [imageError, setImageError] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [lastKey, setLastKey] = useState('')

  const currentKey = open ? (item?.id ?? 'new') : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) {
      setName(item?.name ?? '')
      setBrand(item?.brand ?? '')
      setImage(item?.image ?? null)
      setImageError(undefined)
      setError(undefined)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.')
      return
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setImage(dataUrl)
      setImageError(undefined)
    } catch {
      setImageError('تعذر تحميل الصورة، جرب صورة أخرى.')
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('يرجى إدخال اسم أو موديل الطابعة')
      return
    }
    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      image: image || null,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={item ? `تعديل نوع الطابعة: ${item.name}` : 'إضافة نوع طابعة جديد'}
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="printer-type-form" variant="primary">
            {item ? 'حفظ التعديلات' : 'إضافة الطابعة'}
          </Button>
        </>
      }
    >
      <form id="printer-type-form" onSubmit={submit} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">صورة الطابعة (اختياري)</span>
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              {image ? (
                <img src={image} alt="معاينة الطابعة" className="size-full object-contain p-1" />
              ) : (
                <Printer className="size-8 text-slate-400" />
              )}
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleFileChange(e)}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                {image ? 'تغيير الصورة' : 'رفع صورة'}
              </Button>
              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setImage(null)
                    setImageError(undefined)
                  }}
                >
                  <X className="size-4" />
                  إزالة
                </Button>
              )}
              <p className="w-full text-[11px] text-slate-500">
                تظهر الصورة في لوحة التحكم وقائمة الطابعات.
              </p>
            </div>
          </div>
          {imageError && <p className="mt-1.5 text-xs font-medium text-red-600">{imageError}</p>}
        </div>

        <Field label="اسم / موديل الطابعة" error={error}>
          {(id, desc) => (
            <TextInput
              id={id}
              dir="ltr"
              className="text-right"
              aria-invalid={Boolean(error)}
              aria-describedby={desc}
              placeholder="مثال: HP LaserJet Pro M404dn"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(undefined)
              }}
              autoFocus
            />
          )}
        </Field>

        <Field label="الماركة (اختياري)">
          {(id) => (
            <SelectInput
              id={id}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              options={brandOptions}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
