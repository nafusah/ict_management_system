import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Laptop, Monitor, Pencil, Phone, Printer, Server, Smartphone } from 'lucide-react'
import { DeviceForm } from './DevicesPage'
import { DeviceLocationTower } from './components/DeviceLocationTower'
import { Button, PageHeader, Pill, Toast } from '../../shared/components/ui'
import { usePermission } from '../../shared/data/auth'
import { useDeviceTypes, useDevices } from '../../shared/data/store'
import { CLASSIFICATIONS, DEVICE_LOCATIONS } from '../../shared/data/types'
import type { BuiltinDeviceKind } from '../../shared/data/types'

const KIND_ICONS: Record<BuiltinDeviceKind, typeof Monitor> = {
  monitor: Monitor,
  pcCase: Server,
  phone: Phone,
  printer: Printer,
  other: Smartphone,
}

export default function DeviceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const devices = useDevices()
  const deviceTypes = useDeviceTypes()
  const canManage = usePermission('devices.manage')

  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const kindMap = useMemo(
    () => Object.fromEntries(deviceTypes.map((t) => [t.id, t])),
    [deviceTypes],
  )

  const device = useMemo(() => devices.find((d) => d.id === id) ?? null, [devices, id])

  const relatedDevices = useMemo(() => {
    if (!device) return []
    if (device.classification === 'personal') {
      return devices.filter(
        (d) =>
          d.id !== device.id &&
          d.classification === 'personal' &&
          d.employee.trim() === device.employee.trim(),
      )
    }
    return devices.filter(
      (d) =>
        d.id !== device.id &&
        d.classification === 'shared' &&
        d.department.trim() === device.department.trim(),
    )
  }, [devices, device])

  if (!device) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <Laptop className="size-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">لم يتم العثور على الجهاز</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          قد يكون الجهاز حُذف أو أن الرابط غير صحيح.
        </p>
        <Link to="/devices" className="mt-5 inline-block">
          <Button variant="primary">
            <ArrowRight className="size-4" />
            العودة إلى قائمة الأجهزة
          </Button>
        </Link>
      </div>
    )
  }

  const typeItem = kindMap[device.kind]
  const KindIcon = KIND_ICONS[typeItem?.icon ?? 'other']
  const loc = device.location ?? 'town'

  return (
    <div className="space-y-6">
      <PageHeader
        title={device.name}
        description={`${typeItem?.label ?? device.kind} • ${device.brand} • الرقم التسلسلي: ${device.serialNumber}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/devices">
              <Button variant="secondary">
                <ArrowRight className="size-4" />
                العودة إلى الأجهزة
              </Button>
            </Link>
            {canManage && (
              <Button variant="primary" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                تعديل البيانات
              </Button>
            )}
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <DeviceLocationTower
          location={loc}
          floor={device.floor}
          officeNumber={device.officeNumber}
        />

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <KindIcon className="size-6" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    <bdi>{device.name}</bdi>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {typeItem?.label ?? device.kind} • <bdi>{device.brand}</bdi>
                  </p>
                </div>
              </div>
              <Pill tone={device.classification === 'personal' ? 'green' : 'blue'}>
                {CLASSIFICATIONS[device.classification].label}
              </Pill>
            </div>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">الرقم التسلسلي</dt>
                <dd className="mt-1 font-mono font-bold text-slate-900">
                  <bdi>{device.serialNumber}</bdi>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">الموظف / المستفيد</dt>
                <dd className="mt-1 font-semibold text-slate-900">{device.employee}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">الإدارة</dt>
                <dd className="mt-1 font-semibold text-slate-900">{device.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">الموقع</dt>
                <dd className="mt-1">
                  <Pill tone={loc === 'field' ? 'amber' : 'slate'}>
                    {DEVICE_LOCATIONS[loc].label}
                  </Pill>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">الدور</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {device.floor ? `الدور ${device.floor}` : 'غير محدد'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">رقم المكتب</dt>
                <dd className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {device.officeNumber ? `مكتب ${device.officeNumber}` : 'غير محدد'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
              {CLASSIFICATIONS[device.classification].hint}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {device.classification === 'personal'
                    ? `الأجهزة الأخرى المربوطة للموظف (${device.employee})`
                    : `الأجهزة الجماعية الأخرى في ${device.department}`}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  اضغط على أي جهاز للانتقال إلى تفاصيله وموقعه في البرج.
                </p>
              </div>
              <Pill tone="slate">{relatedDevices.length} جهاز</Pill>
            </div>

            {relatedDevices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-xs text-slate-500">
                {device.classification === 'personal'
                  ? 'لا توجد أجهزة أخرى مربوطة بهذا الموظف حالياً.'
                  : 'لا توجد أجهزة جماعية أخرى مسجلة في هذه الإدارة حالياً.'}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedDevices.map((other) => {
                  const otherType = kindMap[other.kind]
                  const OtherIcon = KIND_ICONS[otherType?.icon ?? 'other']
                  const otherLoc = other.location ?? 'town'
                  return (
                    <Link
                      key={other.id}
                      to={`/devices/${other.id}`}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50/70"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-signal">
                          <OtherIcon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900">
                            <bdi>{other.name}</bdi>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {otherType?.label ?? other.kind} • <bdi>{other.brand}</bdi>
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-slate-500">
                            <bdi>{other.serialNumber}</bdi>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Pill tone={otherLoc === 'field' ? 'amber' : 'slate'}>
                          {DEVICE_LOCATIONS[otherLoc].label}
                        </Pill>
                        {(other.floor || other.officeNumber) && (
                          <span className="text-[11px] text-slate-500">
                            {[other.floor ? `دور ${other.floor}` : '', other.officeNumber ? `مكتب ${other.officeNumber}` : '']
                              .filter(Boolean)
                              .join(' • ')}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <DeviceForm
        open={editing}
        device={device}
        onClose={() => setEditing(false)}
        onSuccess={(msg) => setToast(msg)}
      />

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />
    </div>
  )
}
