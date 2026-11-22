import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import { cx } from '../../shared/components/ui'
import { usePermission } from '../../shared/data/auth'
import { useDevices, useInks, usePrinterTypes, useSubscriptions } from '../../shared/data/store'
import { getSubscriptionStatus, isLowStock } from '../../shared/data/types'

const cardBase =
  'group block rounded-xl border border-slate-200 bg-white transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'
const cardLink = `${cardBase} hover:border-slate-300 hover:bg-slate-50/60`

function WarningNote({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950">
      {children}
    </span>
  )
}

/** العدد مع المعدود بصيغته العربية الصحيحة: صنف واحد، صنفان، 3 أصناف، 11 صنفًا. */
const countItems = (n: number) =>
  n === 1 ? 'صنف واحد' : n === 2 ? 'صنفان' : n <= 10 ? `${n} أصناف` : `${n} صنفًا`

function HeroCard({
  to,
  svg,
  svgLabel,
  value,
  label,
  note,
}: {
  to?: string
  svg: string
  svgLabel: string
  value: number
  label: string
  note: ReactNode
}) {
  const content = (
    <div className="flex flex-col-reverse items-stretch gap-4 @md:flex-row @md:items-center">
      <div className="min-w-0 flex-1">
        <div className="text-6xl leading-none font-extrabold tabular-nums">{value}</div>
        <div className="mt-2 text-base font-bold">{label}</div>
        <div className="mt-3 text-sm text-slate-500">{note}</div>
      </div>
      <Illustration svg={svg} label={svgLabel} className="h-40 @md:h-44 @md:w-1/2" />
    </div>
  )

  if (!to) {
    return <div className={`${cardBase} @container p-6`}>{content}</div>
  }

  return (
    <Link to={to} className={`${cardLink} @container p-6`}>
      {content}
    </Link>
  )
}

export default function Dashboard() {
  const canDashboardDevices = usePermission('dashboard.devices')
  const canDashboardInks = usePermission('dashboard.inks')
  const canDashboardSubs = usePermission('dashboard.subscriptions')
  const canViewDevices = usePermission(['devices.view', 'devices.manage'])

  const devices = useDevices()
  const inks = useInks()
  const printerTypes = usePrinterTypes()
  const subscriptions = useSubscriptions()

  const heroCount = Number(canDashboardDevices) + Number(canDashboardInks) + Number(canDashboardSubs)

  const totalCartridges = inks.reduce((s, i) => s + i.quantity, 0)
  const lowItems = inks.filter(isLowStock).length
  const personal = devices.filter((d) => d.classification === 'personal').length
  const dueSubscriptions = subscriptions.filter((s) => {
    const st = getSubscriptionStatus(s)
    return st === 'expiring' || st === 'expired'
  }).length

  if (heroCount === 0) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">لوحة التحكم</h1>
        <p className="mt-2 text-sm text-slate-500">
          لا توجد أقسام إحصائية مفعّلة لحسابك في لوحة التحكم. يمكنك التنقل عبر القائمة الجانبية إلى الصفحات المصرح لك بها.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-label="الملخص"
        className={cx(
          'grid gap-4',
          heroCount === 1 ? 'lg:grid-cols-1' : heroCount === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3',
        )}
      >
        {canDashboardDevices && (
          <HeroCard
            to={canViewDevices ? '/devices' : undefined}
            svg={Illustrations.devicesHero}
            svgLabel="رسمة مكتب عليه شاشة وكيس وهاتف مكتبي"
            value={devices.length}
            label="جهاز مسجل"
            note={`${personal} شخصي و${devices.length - personal} جماعي`}
          />
        )}
        {canDashboardInks && (
          <HeroCard
            to="/inks/printers"
            svg={Illustrations.inkHero()}
            svgLabel="رسمة خرطوشة حبر بالألوان الأربعة"
            value={totalCartridges}
            label="خرطوشة حبر في المخزون"
            note={
              <div className="flex flex-wrap items-center gap-2">
                {lowItems === 0 ? (
                  <span>كل الأصناف فوق حد الطلب</span>
                ) : (
                  <WarningNote>
                    {countItems(lowItems)} تحت حد الطلب
                  </WarningNote>
                )}
                <span className="text-xs font-semibold text-slate-600">
                  • {printerTypes.length} طابعة مسجلة
                </span>
              </div>
            }
          />
        )}
        {canDashboardSubs && (
          <HeroCard
            to="/subscriptions/summary"
            svg={Illustrations.subscriptionsHero}
            svgLabel="رسمة الاشتراكات والتراخيص"
            value={subscriptions.length}
            label="اشتراك وترخيص"
            note={
              dueSubscriptions === 0 ? (
                'جميع الاشتراكات سارية'
              ) : (
                <WarningNote>{dueSubscriptions} بحاجة للمتابعة أو التجديد</WarningNote>
              )
            }
          />
        )}
      </section>

      {/* {canDashboardDevices && (
        <section aria-labelledby="devices-by-kind">
          <h2 id="devices-by-kind" className="mb-4 text-lg font-bold">
            الأجهزة حسب النوع
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {deviceTypes
              .filter((t) => kindCounts[t.id])
              .map((t) => (
                <SmallCard
                  key={t.id}
                  to={canViewDevices ? `/devices?kind=${t.id}` : undefined}
                  svg={Illustrations.device(t.icon)}
                  svgLabel={`رسمة ${t.label}`}
                  value={kindCounts[t.id] ?? 0}
                  label={t.label}
                  artClass="h-24"
                />
              ))}
          </div>
        </section>
      )} */}
    </div>
  )
}
