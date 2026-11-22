import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Monitor, Pencil, Phone, Plus, Printer, Server, Smartphone, Trash2 } from 'lucide-react'
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
  SearchableSelect,
  SelectInput,
  TextInput,
  Toast,
  cx,
} from '../../shared/components/ui'
import { recordAudit, usePermission } from '../../shared/data/auth'
import { devicesStore, useBrands, useDepartments, useDeviceTypes, useDevices, useEmployees } from '../../shared/data/store'
import { OTHER } from '../../shared/data/options'
import { CLASSIFICATIONS, DEVICE_LOCATIONS } from '../../shared/data/types'
import type { BuiltinDeviceKind, Classification, Device, DeviceKind, DeviceLocation } from '../../shared/data/types'

const PAGE_SIZE = 10

const KIND_ICONS: Record<BuiltinDeviceKind, typeof Monitor> = {
  monitor: Monitor,
  pcCase: Server,
  phone: Phone,
  printer: Printer,
  other: Smartphone,
}

export default function Devices() {
  const navigate = useNavigate()
  const canManage = usePermission('devices.manage')
  const devices = useDevices()
  const deviceTypes = useDeviceTypes()
  const kindMap = useMemo(() => Object.fromEntries(deviceTypes.map((t) => [t.id, t])), [deviceTypes])
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Device | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Device | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const kindParam = params.get('kind')
  const kindFilter = kindParam && kindParam in kindMap ? kindParam : null
  const classParam = params.get('class')
  const classFilter = classParam && classParam in CLASSIFICATIONS ? (classParam as Classification) : null
  const locParam = params.get('loc')
  const locFilter = locParam && locParam in DEVICE_LOCATIONS ? (locParam as DeviceLocation) : null

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
        (!locFilter || (d.location ?? 'town') === locFilter) &&
        (!q ||
          [
            d.name,
            d.serialNumber,
            d.brand,
            d.employee,
            d.department,
            d.floor ?? '',
            d.officeNumber ?? '',
            DEVICE_LOCATIONS[d.location ?? 'town'].label,
          ].some((v) => v.toLowerCase().includes(q))),
    )
  }, [devices, query, kindFilter, classFilter, locFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="الأجهزة"
        description="الشاشات والكيسات والطابعات والهواتف المسلّمة للموظفين والإدارات."
        action={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              إضافة جهاز
            </Button>
          ) : undefined
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
          {deviceTypes.map((t) => (
            <FilterChip key={t.id} active={kindFilter === t.id} onClick={() => setFilter('kind', t.id)}>
              {t.label}
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
          <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />
          {(Object.keys(DEVICE_LOCATIONS) as DeviceLocation[]).map((loc) => (
            <FilterChip
              key={loc}
              active={locFilter === loc}
              onClick={() => setFilter('loc', locFilter === loc ? null : loc)}
            >
              {DEVICE_LOCATIONS[loc].label}
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
                <th scope="col" className="px-4 py-3 text-start font-semibold">الموقع</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">التصنيف</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  <span className="sr-only">الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => {
                const typeItem = kindMap[d.kind]
                const Icon = KIND_ICONS[typeItem?.icon ?? 'other']
                return (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/devices/${d.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/70"
                  >
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
                            {typeItem?.label ?? d.kind}، <bdi>{d.brand}</bdi>
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
                      <Pill tone={(d.location ?? 'town') === 'field' ? 'amber' : 'slate'}>
                        {DEVICE_LOCATIONS[d.location ?? 'town'].label}
                      </Pill>
                      {(d.floor || d.officeNumber) && (
                        <div className="mt-1 text-xs text-slate-500">
                          {[d.floor ? `الدور ${d.floor}` : '', d.officeNumber ? `مكتب ${d.officeNumber}` : '']
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={d.classification === 'personal' ? 'green' : 'blue'}>
                        {CLASSIFICATIONS[d.classification].label}
                      </Pill>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <IconButton label={`تفاصيل ${d.name}`} onClick={() => navigate(`/devices/${d.id}`)}>
                          <Eye className="size-4" />
                        </IconButton>
                        {canManage && (
                          <>
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

      <DeviceForm
        open={editing !== null}
        device={editing && editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)}
        onSuccess={(msg) => setToast(msg)}
      />

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            devicesStore.remove(deleting.id)
            recordAudit('deleted', 'device', `حذف الجهاز: ${deleting.name} (${deleting.serialNumber})`, deleting.id)
            setToast(`تم حذف "${deleting.name}" بنجاح`)
          }
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

export function DeviceForm({
  open,
  device,
  onClose,
  onSuccess,
}: {
  open: boolean
  device: Device | null
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const deviceTypes = useDeviceTypes()
  const brands = useBrands()
  const departments = useDepartments()
  const allEmployees = useEmployees()
  const brandOptions = useMemo(
    () => [...brands.filter((b) => b.category === 'device').map((b) => b.name), OTHER],
    [brands],
  )
  const deptOptions = useMemo(() => [...departments.map((d) => d.name), OTHER], [departments])
  const isEdit = device !== null
  const brand0 = splitOther(device?.brand ?? '', brandOptions)
  const dept0 = splitOther(device?.department ?? '', deptOptions)

  const [name, setName] = useState(device?.name ?? '')
  const [serial, setSerial] = useState(device?.serialNumber ?? '')
  const [kind, setKind] = useState<DeviceKind>(device?.kind ?? deviceTypes[0]?.id ?? 'monitor')
  const [brand, setBrand] = useState(brand0.choice)
  const [customBrand, setCustomBrand] = useState(brand0.custom)
  const [dept, setDept] = useState(dept0.choice)
  const [customDept, setCustomDept] = useState(dept0.custom)

  const employeesFor = (d: string) => [
    ...allEmployees.filter((e) => e.department === d).map((e) => e.name),
    OTHER,
  ]
  const emp0 = splitOther(device?.employee ?? '', employeesFor(dept0.choice))
  const [employee, setEmployee] = useState(emp0.choice)
  const [customEmployee, setCustomEmployee] = useState(emp0.custom)
  const [classification, setClassification] = useState<Classification>(device?.classification ?? 'personal')
  const [location, setLocation] = useState<DeviceLocation>(device?.location ?? 'town')
  const [floor, setFloor] = useState(device?.floor ?? '')
  const [officeNumber, setOfficeNumber] = useState(device?.officeNumber ?? '')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    const nextBrand = splitOther(device?.brand ?? '', brandOptions)
    const nextDept = splitOther(device?.department ?? '', deptOptions)
    const nextEmp = splitOther(
      device?.employee ?? '',
      [...allEmployees.filter((e) => e.department === nextDept.choice).map((e) => e.name), OTHER],
    )
    setName(device?.name ?? '')
    setSerial(device?.serialNumber ?? '')
    setKind(device?.kind ?? deviceTypes[0]?.id ?? 'monitor')
    setBrand(nextBrand.choice)
    setCustomBrand(nextBrand.custom)
    setDept(nextDept.choice)
    setCustomDept(nextDept.custom)
    setEmployee(nextEmp.choice)
    setCustomEmployee(nextEmp.custom)
    setClassification(device?.classification ?? 'personal')
    setLocation(device?.location ?? 'town')
    setFloor(device?.floor ?? '')
    setOfficeNumber(device?.officeNumber ?? '')
    setSubmitted(false)
  }, [open, device, brandOptions, deptOptions, allEmployees, deviceTypes])

  const isShared = classification === 'shared'

  const errors = {
    name: !name.trim() ? 'اكتب اسم الجهاز.' : undefined,
    serial: !serial.trim() ? 'اكتب الرقم التسلسلي.' : undefined,
    brand: brand === OTHER && !customBrand.trim() ? 'اكتب اسم الماركة.' : undefined,
    dept: dept === OTHER && !customDept.trim() ? 'اكتب اسم الإدارة.' : undefined,
    employee: !isShared && employee === OTHER && !customEmployee.trim() ? 'اكتب اسم الموظف.' : undefined,
  }
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const show = (e?: string) => (submitted ? e : undefined)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setSaveError(null)
    if (Object.values(errors).some(Boolean) || saving) return
    const data = {
      name: name.trim(),
      serialNumber: serial.trim(),
      kind,
      brand: brand === OTHER ? customBrand.trim() : brand,
      department: dept === OTHER ? customDept.trim() : dept,
      employee: isShared ? 'مشترك للإدارة' : employee === OTHER ? customEmployee.trim() : employee,
      classification,
      location,
      floor: floor.trim(),
      officeNumber: officeNumber.trim(),
    }
    setSaving(true)
    try {
      if (isEdit) {
        await devicesStore.updateAsync({ ...data, id: device.id })
        const custodyChanged = device.employee !== data.employee || device.department !== data.department
        const msg = custodyChanged
          ? `تعديل/نقل عهدة الجهاز «${data.name}» من (${device.employee} - ${device.department}) إلى (${data.employee} - ${data.department})`
          : `تعديل بيانات الجهاز: ${data.name} (${data.serialNumber})`
        recordAudit('updated', 'device', msg, device.id)
        onSuccess('تم حفظ التعديلات بنجاح')
      } else {
        await devicesStore.addAsync(data)
        recordAudit('created', 'device', `إضافة جهاز: ${data.name} (${data.serialNumber}) — ${data.employee}`)
        onSuccess('تمت إضافة الجهاز بنجاح')
      }
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'تعذر حفظ بيانات الجهاز على الخادم.')
    } finally {
      setSaving(false)
    }
  }

  const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }))

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={isEdit ? 'تعديل الجهاز' : 'إضافة جهاز'}
      description="الحقول كلها مطلوبة."
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button variant="primary" type="submit" form="device-form" disabled={saving}>
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الجهاز'}
          </Button>
        </>
      }
    >
      <form id="device-form" onSubmit={(e) => void submit(e)} noValidate className="grid gap-4 sm:grid-cols-2">
        {saveError && (
          <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {saveError}
          </p>
        )}
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
              options={deviceTypes.map((t) => ({
                value: t.id,
                label: t.label,
              }))}
            />
          )}
        </Field>

        <Field label="الماركة">
          {(id) => (
            <SelectInput id={id} value={brand} onChange={(e) => setBrand(e.target.value)} options={opts(brandOptions)} />
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
            <SearchableSelect
              id={id}
              value={dept}
              onChange={(nextDept) => {
                setDept(nextDept)
                setEmployee(employeesFor(nextDept)[0])
              }}
              options={opts(deptOptions)}
              searchPlaceholder="ابحث عن إدارة..."
            />
          )}
        </Field>

        <Field label="الموظف" hint={isShared ? 'مجمّد لأن الجهاز مصنّف كجهاز جماعي' : undefined}>
          {(id, d) => (
            <SearchableSelect
              id={id}
              aria-describedby={d}
              disabled={isShared}
              className={cx(isShared && 'cursor-not-allowed bg-slate-100 text-slate-400')}
              value={isShared ? '__shared__' : employee}
              onChange={setEmployee}
              options={
                isShared
                  ? [{ value: '__shared__', label: 'مشترك للإدارة (جهاز جماعي)' }]
                  : opts(employeesFor(dept))
              }
              searchPlaceholder="ابحث عن اسم الموظف..."
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
        {!isShared && employee === OTHER && (
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
          <legend className="mb-1.5 text-sm font-medium text-slate-700">الموقع</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(DEVICE_LOCATIONS) as DeviceLocation[]).map((loc) => (
              <label
                key={loc}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-slate-900',
                  location === loc ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400',
                )}
              >
                <input
                  type="radio"
                  name="device-location"
                  value={loc}
                  checked={location === loc}
                  onChange={() => setLocation(loc)}
                  className="mt-1 accent-slate-900"
                />
                <span>
                  <span className="block text-sm font-semibold">{DEVICE_LOCATIONS[loc].label}</span>
                  <span className="block text-xs text-slate-500">{DEVICE_LOCATIONS[loc].hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:max-w-xs">
          <Field label="الدور">
            {(id) => (
              <TextInput
                id={id}
                className="h-9 text-center font-mono"
                placeholder="2"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            )}
          </Field>
          <Field label="رقم المكتب">
            {(id) => (
              <TextInput
                id={id}
                className="h-9 text-center font-mono"
                placeholder="204"
                value={officeNumber}
                onChange={(e) => setOfficeNumber(e.target.value)}
              />
            )}
          </Field>
        </div>

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
