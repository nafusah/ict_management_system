import { useMemo, useState } from 'react'
import { Droplets, MonitorSmartphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { DictionaryTabs } from './components/DictionaryTabs'
import { Button, ConfirmDelete, Field, IconButton, Modal, PageHeader, Pill, TextInput } from '../../shared/components/ui'
import { brandsStore, useBrands, useDevices, useInks } from '../../shared/data/store'
import type { BrandCategory, BrandItem } from '../../shared/data/types'

export default function Brands() {
  const brands = useBrands()
  const devices = useDevices()
  const inks = useInks()

  const [modal, setModal] = useState<{ category: BrandCategory; item: BrandItem | null } | null>(null)
  const [deleting, setDeleting] = useState<BrandItem | null>(null)

  const deviceBrands = useMemo(() => brands.filter((b) => b.category === 'device'), [brands])
  const inkBrands = useMemo(() => brands.filter((b) => b.category === 'ink'), [brands])

  const deviceCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of devices) map[d.brand] = (map[d.brand] ?? 0) + 1
    return map
  }, [devices])

  const inkCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const i of inks) map[i.brand] = (map[i.brand] ?? 0) + 1
    return map
  }, [inks])

  return (
    <div>
      <PageHeader
        title="الماركات"
        description="إدارة ماركات الأجهزة وماركات الأحبار المتاحة للاختيار في نماذج الإضافة والتعديل."
      />

      <DictionaryTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <BrandCard
          title="ماركات الأجهزة"
          subtitle="الماركات المعتمدة للشاشات والكيسات والطابعات والهواتف"
          icon={<MonitorSmartphone className="size-5" />}
          unit="جهاز"
          items={deviceBrands}
          counts={deviceCounts}
          onAdd={() => setModal({ category: 'device', item: null })}
          onEdit={(item) => setModal({ category: 'device', item })}
          onDelete={(item) => setDeleting(item)}
        />

        <BrandCard
          title="ماركات الأحبار"
          subtitle="الماركات المعتمدة لخراطيش الأحبار والطابعات"
          icon={<Droplets className="size-5" />}
          unit="صنف"
          items={inkBrands}
          counts={inkCounts}
          onAdd={() => setModal({ category: 'ink', item: null })}
          onEdit={(item) => setModal({ category: 'ink', item })}
          onDelete={(item) => setDeleting(item)}
        />
      </div>

      <BrandFormModal
        open={modal !== null}
        category={modal?.category ?? 'device'}
        item={modal?.item ?? null}
        onClose={() => setModal(null)}
        onSave={(name) => {
          if (!modal) return
          if (modal.item) {
            brandsStore.update({ ...modal.item, name })
          } else {
            brandsStore.add({ name, category: modal.category })
          }
          setModal(null)
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) brandsStore.remove(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function BrandCard({
  title,
  subtitle,
  icon,
  unit,
  items,
  counts,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  unit: string
  items: BrandItem[]
  counts: Record<string, number>
  onAdd: () => void
  onEdit: (item: BrandItem) => void
  onDelete: (item: BrandItem) => void
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <Button variant="primary" className="h-9 px-3 text-xs" onClick={onAdd}>
          <Plus className="size-4" />
          إضافة ماركة
        </Button>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-slate-500">لا توجد ماركات مسجلة بعد.</li>
        ) : (
          items.map((item) => {
            const used = counts[item.name] ?? 0
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/70">
                <div className="min-w-0 font-semibold text-slate-900">
                  <bdi>{item.name}</bdi>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={used > 0 ? 'blue' : 'slate'}>
                    {used} {unit}
                  </Pill>
                  <IconButton label={`تعديل ${item.name}`} onClick={() => onEdit(item)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label={used > 0 ? 'ماركة مستخدمة حالياً' : `حذف ${item.name}`}
                    disabled={used > 0}
                    className="hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}

function BrandFormModal({
  open,
  category,
  item,
  onClose,
  onSave,
}: {
  open: boolean
  category: BrandCategory
  item: BrandItem | null
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [error, setError] = useState<string | undefined>()
  const [lastKey, setLastKey] = useState('')

  const currentKey = open ? `${category}-${item?.id ?? 'new'}` : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) {
      setName(item?.name ?? '')
      setError(undefined)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('يرجى إدخال اسم الماركة')
      return
    }
    onSave(name.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        item
          ? `تعديل الماركة: ${item.name}`
          : category === 'device'
            ? 'إضافة ماركة جهاز جديدة'
            : 'إضافة ماركة حبر جديدة'
      }
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="brand-form" variant="primary">
            {item ? 'حفظ التعديلات' : 'إضافة الماركة'}
          </Button>
        </>
      }
    >
      <form id="brand-form" onSubmit={submit}>
        <Field label="اسم الماركة" error={error}>
          {(id, desc) => (
            <TextInput
              id={id}
              aria-invalid={Boolean(error)}
              aria-describedby={desc}
              placeholder="مثال: Dell أو HP"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(undefined)
              }}
              autoFocus
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}

