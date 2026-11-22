import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import { DictionaryTabs } from './components/DictionaryTabs'
import {
  Button,
  ConfirmDelete,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Pill,
  TextInput,
} from '../../shared/components/ui'
import { inkColorsStore, useInkColors, useInks } from '../../shared/data/store'
import type { InkColorItem } from '../../shared/data/types'

const COLOR_PRESETS = [
  { name: 'أحمر', hex: '#dc2626' },
  { name: 'أخضر', hex: '#16a34a' },
  { name: 'أزرق', hex: '#2563eb' },
  { name: 'رمادي', hex: '#64748b' },
  { name: 'برتقالي', hex: '#ea580c' },
  { name: 'بنفسجي', hex: '#9333ea' },
]

function buildPalette(hex: string) {
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#64748b'
  return {
    primary: clean,
    light: `${clean}1a`,
    border: `${clean}4d`,
  }
}

export default function InkColors() {
  const inkColors = useInkColors()
  const inks = useInks()
  const [editing, setEditing] = useState<InkColorItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<InkColorItem | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const i of inks) map[i.color] = (map[i.color] ?? 0) + 1
    return map
  }, [inks])

  return (
    <div>
      <PageHeader
        title="ألوان الأحبار"
        description="إدارة ألوان الأحبار المتاحة في المخزون وإضافة ألوان جديدة مع تحديد درجة اللون والرمز."
        action={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" />
            إضافة لون جديد
          </Button>
        }
      />

      <DictionaryTabs />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">اللون</th>
                <th className="px-4 py-3">الرمز</th>
                <th className="px-4 py-3">درجة اللون</th>
                <th className="px-4 py-3">الأصناف المسجلة</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inkColors.map((c) => {
                const usedCount = counts[c.id] ?? 0
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="inline-block size-4 shrink-0 rounded-full ring-2 ring-white"
                          style={{ background: c.primary, boxShadow: `0 0 0 3px ${c.border}` }}
                        />
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span dir="ltr" className="font-mono text-xs text-slate-600">
                        {c.primary}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={usedCount > 0 ? 'blue' : 'slate'}>{usedCount} صنف</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label="تعديل اللون" onClick={() => setEditing(c)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label={usedCount > 0 ? 'لا يمكن حذف لون مستخدم في المخزون' : 'حذف اللون'}
                          disabled={usedCount > 0}
                          className="hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => setDeleting(c)}
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
      </div>

      <InkColorFormModal
        item={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (editing && editing !== 'new') {
            inkColorsStore.update({ ...data, id: editing.id })
          } else {
            inkColorsStore.add(data)
          }
          setEditing(null)
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) inkColorsStore.remove(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function InkColorFormModal({
  item,
  open,
  onClose,
  onSave,
}: {
  item: InkColorItem | null
  open: boolean
  onClose: () => void
  onSave: (data: Omit<InkColorItem, 'id'>) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [code, setCode] = useState(item?.code ?? '')
  const [primary, setPrimary] = useState(item?.primary ?? '#2563eb')
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({})
  const [lastKey, setLastKey] = useState('')

  const currentKey = open ? (item?.id ?? 'new') : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) {
      setName(item?.name ?? '')
      setCode(item?.code ?? '')
      setPrimary(item?.primary ?? '#2563eb')
      setErrors({})
    }
  }

  const palette = buildPalette(primary)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { name?: string; code?: string } = {}
    if (!name.trim()) nextErrors.name = 'يرجى إدخال اسم اللون'
    if (!code.trim()) nextErrors.code = 'يرجى إدخال رمز اللون (مثل R أو GY)'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      ...palette,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={item ? `تعديل اللون: ${item.name}` : 'إضافة لون حبر جديد'}
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="ink-color-form" variant="primary">
            {item ? 'حفظ التعديلات' : 'إضافة اللون'}
          </Button>
        </>
      }
    >
      <form id="ink-color-form" onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <Illustration
            svg={Illustrations.cartridge({
              id: 'preview',
              name: name || 'معاينة',
              code: code || '?',
              ...palette,
            })}
            label="معاينة لون الخرطوشة"
            className="h-24 w-32"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم اللون" error={errors.name}>
            {(id, desc) => (
              <TextInput
                id={id}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={desc}
                placeholder="مثال: أحمر أو رمادي"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((err) => ({ ...err, name: undefined }))
                }}
                autoFocus
              />
            )}
          </Field>

          <Field label="الرمز المختصر" error={errors.code}>
            {(id, desc) => (
              <TextInput
                id={id}
                dir="ltr"
                maxLength={4}
                className="text-right font-mono uppercase"
                aria-invalid={Boolean(errors.code)}
                aria-describedby={desc}
                placeholder="مثال: R أو GY"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setErrors((err) => ({ ...err, code: undefined }))
                }}
              />
            )}
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">اختيار درجة اللون</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-700">
              <input
                type="color"
                value={palette.primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="size-6 cursor-pointer border-0 bg-transparent p-0"
              />
              <span dir="ltr">{palette.primary}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.name}
                  onClick={() => setPrimary(p.hex)}
                  className="size-6 rounded-full border border-white ring-1 ring-slate-300 transition-transform hover:scale-110"
                  style={{ background: p.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

