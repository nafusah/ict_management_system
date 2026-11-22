import { useMemo, useState } from 'react'
import { Monitor, Pencil, Phone, Plus, Printer, Server, Smartphone, Trash2 } from 'lucide-react'
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
import { deviceTypesStore, useDeviceTypes, useDevices } from '../../shared/data/store'
import type { BuiltinDeviceKind, DeviceTypeItem } from '../../shared/data/types'

const ICON_OPTIONS: { value: BuiltinDeviceKind; label: string }[] = [
  { value: 'monitor', label: 'شاشة' },
  { value: 'pcCase', label: 'كيس / حاسوب' },
  { value: 'printer', label: 'طابعة' },
  { value: 'phone', label: 'هاتف' },
  { value: 'other', label: 'أخرى' },
]

const KIND_ICONS: Record<BuiltinDeviceKind, typeof Monitor> = {
  monitor: Monitor,
  pcCase: Server,
  phone: Phone,
  printer: Printer,
  other: Smartphone,
}

export default function DeviceTypes() {
  const deviceTypes = useDeviceTypes()
  const devices = useDevices()
  const [editing, setEditing] = useState<DeviceTypeItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<DeviceTypeItem | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of devices) map[d.kind] = (map[d.kind] ?? 0) + 1
    return map
  }, [devices])

  return (
    <div>
      <PageHeader
        title="أنواع الأجهزة"
        description="إدارة تصنيفات وأنواع الأجهزة المتاحة في النظام مثل الشاشات والطابعات وغيرها."
        action={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" />
            إضافة نوع جهاز
          </Button>
        }
      />

      <DictionaryTabs />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">نوع الجهاز</th>
                <th className="px-4 py-3">الأيقونة</th>
                <th className="px-4 py-3">الأجهزة المسجلة</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deviceTypes.map((t) => {
                const Icon = KIND_ICONS[t.icon] ?? Smartphone
                const usedCount = counts[t.id] ?? 0
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <Icon className="size-5" />
                        </span>
                        <span className="font-bold text-slate-900">{t.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ICON_OPTIONS.find((o) => o.value === t.icon)?.label ?? 'أخرى'}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={usedCount > 0 ? 'blue' : 'slate'}>{usedCount} جهاز</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label="تعديل النوع" onClick={() => setEditing(t)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label={usedCount > 0 ? 'لا يمكن حذف نوع مستخدم في الأجهزة' : 'حذف النوع'}
                          disabled={usedCount > 0}
                          className="hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => setDeleting(t)}
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

      <DeviceTypeFormModal
        item={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (editing && editing !== 'new') {
            deviceTypesStore.update({ ...data, id: editing.id })
          } else {
            deviceTypesStore.add(data)
          }
          setEditing(null)
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.label ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deviceTypesStore.remove(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function DeviceTypeFormModal({
  item,
  open,
  onClose,
  onSave,
}: {
  item: DeviceTypeItem | null
  open: boolean
  onClose: () => void
  onSave: (data: Omit<DeviceTypeItem, 'id'>) => void
}) {
  const [label, setLabel] = useState(item?.label ?? '')
  const [icon, setIcon] = useState<BuiltinDeviceKind>(item?.icon ?? 'other')
  const [error, setError] = useState<string | undefined>()
  const [lastKey, setLastKey] = useState('')

  const currentKey = open ? (item?.id ?? 'new') : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) {
      setLabel(item?.label ?? '')
      setIcon(item?.icon ?? 'other')
      setError(undefined)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      setError('يرجى إدخال اسم نوع الجهاز')
      return
    }
    onSave({ label: label.trim(), icon })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={item ? `تعديل نوع الجهاز: ${item.label}` : 'إضافة نوع جهاز جديد'}
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="device-type-form" variant="primary">
            {item ? 'حفظ التعديلات' : 'إضافة النوع'}
          </Button>
        </>
      }
    >
      <form id="device-type-form" onSubmit={submit} className="space-y-4">
        <Field label="اسم النوع" error={error}>
          {(id, desc) => (
            <TextInput
              id={id}
              aria-invalid={Boolean(error)}
              aria-describedby={desc}
              placeholder="مثال: طابعة، ماسح ضوئي..."
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                setError(undefined)
              }}
              autoFocus
            />
          )}
        </Field>

        <Field label="الأيقونة والرسم التوضيحي">
          {(id) => (
            <SelectInput
              id={id}
              value={icon}
              onChange={(e) => setIcon(e.target.value as BuiltinDeviceKind)}
              options={ICON_OPTIONS}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}

