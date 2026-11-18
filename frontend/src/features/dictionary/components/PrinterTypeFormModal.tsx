import { useRef, useState } from 'react'
import { ImagePlus, Printer, X } from 'lucide-react'
import { Button, Field, Modal, SelectInput, TextInput } from '../../../shared/components/ui'
import { useBrands } from '../../../shared/data/store'
import type { PrinterTypeItem } from '../../../shared/data/types'

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
        const webp = canvas.toDataURL('image/webp', 0.82)
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function PrinterTypeFormModal({
  item,
  open,
  onClose,
  onSave,
}: {
  item: PrinterTypeItem | null
  open: boolean
  onClose: () => void
  onSave: (data: Omit<PrinterTypeItem, 'id'>) => Promise<void>
}) {
  const brands = useBrands()
  const brandOptions = Array.from(new Set(brands.map((b) => b.name)))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(item?.name ?? '')
  const [brand, setBrand] = useState(item?.brand ?? '')
  const [image, setImage] = useState<string | null>(item?.image ?? null)
  const [imageError, setImageError] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
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
      setSubmitting(false)
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('يرجى إدخال اسم أو موديل الطابعة')
      return
    }
    setError(undefined)
    setSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        brand: brand.trim() || undefined,
        image: image || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الطابعة، يرجى المحاولة مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      size="sm"
      title={item ? `تعديل نوع الطابعة: ${item.name}` : 'إضافة نوع طابعة جديد'}
      description="أدخل اسم أو موديل الطابعة وأرفق صورتها (اختياري) ليظهر لجميع المستخدمين في صفحة الطابعات والأحبار."
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" form="printer-type-form" variant="primary" disabled={submitting}>
            {submitting ? 'جاري الحفظ...' : item ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </>
      }
    >
      <form id="printer-type-form" onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field label="صورة الطابعة (اختياري)" error={imageError}>
          {() => (
            <div className="flex items-center gap-4">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {image ? (
                  <>
                    <img src={image} alt="معاينة الطابعة" className="size-full object-contain p-1" />
                    <button
                      type="button"
                      aria-label="إزالة الصورة"
                      onClick={() => setImage(null)}
                      className="absolute top-1 left-1 rounded-full bg-slate-900/75 p-0.5 text-white hover:bg-slate-900"
                    >
                      <X className="size-3" />
                    </button>
                  </>
                ) : (
                  <Printer className="size-7 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  {image ? 'تغيير الصورة' : 'رفع صورة الطابعة'}
                </Button>
                <span className="text-[11px] text-slate-500">يتم ضغط الصورة تلقائياً (PNG / JPG / WEBP)</span>
              </div>
            </div>
          )}
        </Field>

        <Field label="اسم / موديل الطابعة" error={error}>
          {(id, desc) => (
            <TextInput
              id={id}
              dir="ltr"
              className="text-right"
              aria-invalid={Boolean(error)}
              aria-describedby={desc}
              placeholder="مثال: HP Color LaserJet Pro M254"
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
              options={[
                { value: '', label: '— بدون تحديد —' },
                ...brandOptions.map((n) => ({ value: n, label: n })),
              ]}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
