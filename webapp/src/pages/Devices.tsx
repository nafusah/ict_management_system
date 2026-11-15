import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Monitor, Pencil, Phone, Plus, Server, Smartphone, Trash2 } from 'lucide-react'
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
} from '../components/ui'
import { devicesStore, useDevices } from '../data/store'
import { DEPARTMENTS, DEPARTMENT_EMPLOYEES, DEVICE_BRANDS, OTHER } from '../data/options'
import { CLASSIFICATIONS, DEVICE_KINDS } from '../data/types'
import type { Classification, Device, DeviceKind } from '../data/types'

const PAGE_SIZE = 10

const KIND_ICONS: Record<DeviceKind, typeof Monitor> = {
  monitor: Monitor,
  pcCase: Server,
  phone: Phone,
  other: Smartphone,
}

export default function Devices() {
  const devices = useDevices()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Device | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Device | null>(null)

  const kindParam = params.get('kind')
  const kindFilter = kindParam && kindParam in DEVICE_KINDS ? (kindParam as DeviceKind) : null
  const classParam = params.get('class')
  const classFilter = classParam && classParam in CLASSIFICATIONS ? (classParam as Classification) : null

  const setFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return devices.filter(
      (d) =>
        (!kindFilter || d.kind === kindFilter) &&
        (!classFilter || d.classification === classFilter) &&
        (!q ||
          [d.name, d.serialNumber, d.brand, d.employee, d.department].some((v) => v.toLowerCase().includes(q))),
    )
  }, [devices, query, kindFilter, classFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="الأجهزة"
        description="الشاشات والكيسات والهواتف المسلّمة للموظفين والإدارات."
        action={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" />
            إضافة جهاز
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
          placeholder="ابحث بالاسم أو الرقم التسلسلي أو الموظف"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب النوع">
          <FilterChip active={!kindFilter} onClick={() => setFilter('kind', null)}>
            كل الأنواع
          </FilterChip>
          {(Object.keys(DEVICE_KINDS) as DeviceKind[]).map((k) => (
            <FilterChip key={k} active={kindFilter === k} onClick={() => setFilter('kind', k)}>
              {DEVICE_KINDS[k].label}
            </FilterChip>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />
          {(Object.keys(CLASSIFICATIONS) as Classification[]).map((c) => (
            <FilterChip
              key={c}
              active={classFilter === c}
              onClick={() => setFilter('class', classFilter === c ? null : c)}
            >
              {CLASSIFICATIONS[c].label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الجهاز</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الرقم التسلسلي</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الموظف والإدارة</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">التصنيف</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  <span className="sr-only">الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => {
                const Icon = KIND_ICONS[d.kind]
                return (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <div className="font-semibold">
                            <bdi>{d.name}</bdi>
                          </div>
                          <div className="text-xs text-slate-500">
                            {DEVICE_KINDS[d.kind].label}، <bdi>{d.brand}</bdi>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-700">
                      <bdi>{d.serialNumber}</bdi>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.employee}</div>
                      <div className="text-xs text-slate-500">{d.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={d.classification === 'personal' ? 'green' : 'blue'}>
                        {CLASSIFICATIONS[d.classification].label}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label={`تعديل ${d.name}`} onClick={() => setEditing(d)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label={`حذف ${d.name}`}
                          className="hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleting(d)}
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
              {devices.length === 0 ? 'لم يُسجَّل أي جهاز بعد.' : 'لا توجد أجهزة تطابق البحث.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {devices.length === 0 ? 'أضف أول جهاز ليظهر هنا.' : 'غيّر كلمة البحث أو أزل الفلاتر.'}
            </p>
          </div>
        )}

        <Pagination
          page={current}
          pageCount={pageCount}
          shown={rows.length}
          total={filtered.length}
          noun="جهاز"
          onPage={setPage}
        />
      </div>

      {editing && (
        <DeviceForm
          device={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) devicesStore.remove(deleting.id)
          setDeleting(null)
        }}
      />
    </>
  )
}

/** يعيد القيمة من القائمة إن وُجدت، وإلا "أخرى" مع النص في حقل الإدخال اليدوي. */
function splitOther(value: string, list: string[]) {
  if (!value) return { choice: list[0], custom: '' }
  return list.includes(value) ? { choice: value, custom: '' } : { choice: OTHER, custom: value }
}

function DeviceForm({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const isEdit = device !== null
  const brand0 = splitOther(device?.brand ?? '', DEVICE_BRANDS)
  const dept0 = splitOther(device?.department ?? '', [...DEPARTMENTS, OTHER])

  const [name, setName] = useState(device?.name ?? '')
  const [serial, setSerial] = useState(device?.serialNumber ?? '')
  const [kind, setKind] = useState<DeviceKind>(device?.kind ?? 'monitor')
  const [brand, setBrand] = useState(brand0.choice)
  const [customBrand, setCustomBrand] = useState(brand0.custom)
  const [dept, setDept] = useState(dept0.choice)
  const [customDept, setCustomDept] = useState(dept0.custom)

  const employeesFor = (d: string) => [...(DEPARTMENT_EMPLOYEES[d] ?? []), OTHER]
  const emp0 = splitOther(device?.employee ?? '', employeesFor(dept0.choice))
  const [employee, setEmployee] = useState(emp0.choice)
  const [customEmployee, setCustomEmployee] = useState(emp0.custom)
  const [classification, setClassification] = useState<Classification>(device?.classification ?? 'personal')
  const [submitted, setSubmitted] = useState(false)

  const errors = {
    name: !name.trim() ? 'اكتب اسم الجهاز.' : undefined,
    serial: !serial.trim() ? 'اكتب الرقم التسلسلي.' : undefined,
    brand: brand === OTHER && !customBrand.trim() ? 'اكتب اسم الماركة.' : undefined,
    dept: dept === OTHER && !customDept.trim() ? 'اكتب اسم الإدارة.' : undefined,
    employee: employee === OTHER && !customEmployee.trim() ? 'اكتب اسم الموظف.' : undefined,
  }
  const show = (e?: string) => (submitted ? e : undefined)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const data = {
      name: name.trim(),
      serialNumber: serial.trim(),
      kind,
      brand: brand === OTHER ? customBrand.trim() : brand,
      department: dept === OTHER ? customDept.trim() : dept,
      employee: employee === OTHER ? customEmployee.trim() : employee,
      classification,
    }
    if (isEdit) devicesStore.update({ ...data, id: device.id })
    else devicesStore.add(data)
    onClose()
  }

  const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }))

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'تعديل الجهاز' : 'إضافة جهاز'}
      description="الحقول كلها مطلوبة."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button variant="primary" type="submit" form="device-form">
            {isEdit ? 'حفظ التعديلات' : 'إضافة الجهاز'}
          </Button>
        </>
      }
    >
      <form id="device-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="اسم الجهاز والموديل" error={show(errors.name)}>
            {(id, d) => (
              <TextInput
                id={id}
                aria-describedby={d}
                aria-invalid={!!show(errors.name)}
                dir="auto"
                className="text-right"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: Dell P2422H"
                autoFocus
              />
            )}
          </Field>
        </div>

        <Field label="النوع">
          {(id) => (
            <SelectInput
              id={id}
              value={kind}
              onChange={(e) => setKind(e.target.value as DeviceKind)}
              options={(Object.keys(DEVICE_KINDS) as DeviceKind[]).map((k) => ({
                value: k,
                label: DEVICE_KINDS[k].label,
              }))}
            />
          )}
        </Field>

        <Field label="الماركة">
          {(id) => (
            <SelectInput id={id} value={brand} onChange={(e) => setBrand(e.target.value)} options={opts(DEVICE_BRANDS)} />
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

        <div className="sm:col-span-2">
          <Field label="الرقم التسلسلي" error={show(errors.serial)}>
            {(id, d) => (
              <TextInput
                id={id}
                dir="ltr"
                aria-describedby={d}
                aria-invalid={!!show(errors.serial)}
                className="text-right font-mono"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="CN-0P2422-7731"
              />
            )}
          </Field>
        </div>

        <Field label="الإدارة">
          {(id) => (
            <SelectInput
              id={id}
              value={dept}
              onChange={(e) => {
                setDept(e.target.value)
                setEmployee(employeesFor(e.target.value)[0])
              }}
              options={opts([...DEPARTMENTS, OTHER])}
            />
          )}
        </Field>

        <Field label="الموظف">
          {(id) => (
            <SelectInput
              id={id}
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              options={opts(employeesFor(dept))}
            />
          )}
        </Field>

        {dept === OTHER && (
          <Field label="اسم الإدارة" error={show(errors.dept)}>
            {(id, d) => (
              <TextInput
                id={id}
                aria-describedby={d}
                aria-invalid={!!show(errors.dept)}
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
              />
            )}
          </Field>
        )}
        {employee === OTHER && (
          <Field label="اسم الموظف" error={show(errors.employee)}>
            {(id, d) => (
              <TextInput
                id={id}
                aria-describedby={d}
                aria-invalid={!!show(errors.employee)}
                value={customEmployee}
                onChange={(e) => setCustomEmployee(e.target.value)}
              />
            )}
          </Field>
        )}

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-slate-700">التصنيف</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(CLASSIFICATIONS) as Classification[]).map((c) => (
              <label
                key={c}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-slate-900',
                  classification === c ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400',
                )}
              >
                <input
                  type="radio"
                  name="classification"
                  value={c}
                  checked={classification === c}
                  onChange={() => setClassification(c)}
                  className="mt-1 accent-slate-900"
                />
                <span>
                  <span className="block text-sm font-semibold">{CLASSIFICATIONS[c].label}</span>
                  <span className="block text-xs text-slate-500">{CLASSIFICATIONS[c].hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
