import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import { Pill } from '../../shared/components/ui'
import { useDeviceTypes, useDevices, useInkColors, useInks, useSubscriptions } from '../../shared/data/store'
import { SUBSCRIPTION_STATUSES, daysUntilExpiry, getSubscriptionStatus, isLowStock } from '../../shared/data/types'
import type { DeviceKind, SubscriptionStatus } from '../../shared/data/types'

const cardBase =
  'group block rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50/60 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'

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
  to: string
  svg: string
  svgLabel: string
  value: number
  label: string
  note: ReactNode
}) {
  return (
    <Link to={to} className={`${cardBase} @container p-6`}>
      <div className="flex flex-col-reverse items-stretch gap-4 @md:flex-row @md:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-6xl leading-none font-extrabold tabular-nums">{value}</div>
          <div className="mt-2 text-base font-bold">{label}</div>
          <div className="mt-3 text-sm text-slate-500">{note}</div>
        </div>
        <Illustration svg={svg} label={svgLabel} className="h-40 @md:h-44 @md:w-1/2" />
      </div>
    </Link>
  )
}

function SmallCard({
  to,
  svg,
  svgLabel,
  value,
  label,
  note,
  artClass = 'h-28',
}: {
  to: string
  svg: string
  svgLabel: string
  value: number
  label: string
  note?: ReactNode
  artClass?: string
}) {
  return (
    <Link to={to} className={`${cardBase} p-4`}>
      <Illustration svg={svg} label={svgLabel} className={`mx-auto ${artClass}`} />
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tabular-nums">{value}</span>
        <span className="truncate text-sm font-semibold text-slate-700">{label}</span>
      </div>
      {note && <div className="mt-2 text-xs text-slate-500">{note}</div>}
    </Link>
  )
}

export default function Dashboard() {
  const devices = useDevices()
  const deviceTypes = useDeviceTypes()
  const inks = useInks()
  const inkColors = useInkColors()
  const subscriptions = useSubscriptions()

  const totalCartridges = inks.reduce((s, i) => s + i.quantity, 0)
  const lowItems = inks.filter(isLowStock).length
  const personal = devices.filter((d) => d.classification === 'personal').length
  const dueSubscriptions = subscriptions.filter((s) => {
    const st = getSubscriptionStatus(s)
    return st === 'expiring' || st === 'expired'
  }).length

  const kindCounts = devices.reduce<Partial<Record<DeviceKind, number>>>((acc, d) => {
    acc[d.kind] = (acc[d.kind] ?? 0) + 1
    return acc
  }, {})

  const subscriptionCounts = subscriptions.reduce<Record<SubscriptionStatus, number>>(
    (acc, s) => {
      acc[getSubscriptionStatus(s)] += 1
      return acc
    },
    { active: 0, expiring: 0, expired: 0, cancelled: 0 },
  )

  const upcomingSubscriptions = [...subscriptions]
    .filter((s) => !s.cancelled)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="الملخص" className="grid gap-4 lg:grid-cols-3">
        <HeroCard
          to="/devices"
          svg={Illustrations.devicesHero}
          svgLabel="رسمة مكتب عليه شاشة وكيس وهاتف مكتبي"
          value={devices.length}
          label="جهاز مسجل"
          note={`${personal} شخصي و${devices.length - personal} جماعي`}
        />
        <HeroCard
          to="/inks"
          svg={Illustrations.inkHero()}
          svgLabel="رسمة خرطوشة حبر بالألوان الأربعة"
          value={totalCartridges}
          label="خرطوشة حبر في المخزون"
          note={
            lowItems === 0 ? (
              'كل الأصناف فوق حد الطلب'
            ) : (
              <WarningNote>
                {countItems(lowItems)} تحت حد الطلب
              </WarningNote>
            )
          }
        />
        <HeroCard
          to={dueSubscriptions > 0 ? '/subscriptions?status=expiring' : '/subscriptions'}
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
      </section>

      <section aria-labelledby="inks-by-color">
        <h2 id="inks-by-color" className="mb-4 text-lg font-bold">
          الأحبار حسب اللون
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {inkColors.map((meta) => {
            const items = inks.filter((i) => i.color === meta.id)
            const total = items.reduce((s, i) => s + i.quantity, 0)
            const low = items.filter(isLowStock).length
            return (
              <SmallCard
                key={meta.id}
                to={`/inks?color=${meta.id}`}
                svg={Illustrations.cartridge(meta)}
                svgLabel={`رسمة خرطوشة حبر ${meta.name}`}
                value={total}
                label={`${meta.name} (${meta.code})`}
                note={
                  items.length === 0 ? (
                    'لا توجد أصناف'
                  ) : low === 0 ? (
                    'المخزون كافٍ'
                  ) : (
                    <WarningNote>
                      {countItems(low)} تحت الحد
                    </WarningNote>
                  )
                }
              />
            )
          })}
        </div>
      </section>

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
                to={`/devices?kind=${t.id}`}
                svg={Illustrations.device(t.icon)}
                svgLabel={`رسمة ${t.label}`}
                value={kindCounts[t.id] ?? 0}
                label={t.label}
                artClass="h-24"
              />
            ))}
        </div>
      </section>

      <section aria-labelledby="subscriptions-summary">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="subscriptions-summary" className="text-lg font-bold">
            ملخص الاشتراكات والتراخيص
          </h2>
          <Link to="/subscriptions" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
            عرض الكل ←
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(
            [
              { key: 'active', tone: 'green', desc: 'سارية المفعول حالياً' },
              { key: 'expiring', tone: 'amber', desc: 'تستحق التنبيه والتجديد' },
              { key: 'expired', tone: 'red', desc: 'انتهت صلاحيتها' },
              { key: 'cancelled', tone: 'slate', desc: 'تم إلغاؤها' },
            ] as const
          ).map(({ key, tone, desc }) => (
            <Link key={key} to={`/subscriptions?status=${key}`} className={`${cardBase} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <Pill tone={tone}>{SUBSCRIPTION_STATUSES[key].label}</Pill>
              </div>
              <div className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
                {subscriptionCounts[key]}
              </div>
              <div className="mt-1 text-xs text-slate-500">{desc}</div>
            </Link>
          ))}
        </div>

        {upcomingSubscriptions.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500">
              أقرب الاشتراكات انتهاءً
            </div>
            <ul className="divide-y divide-slate-100">
              {upcomingSubscriptions.map((sub) => {
                const st = getSubscriptionStatus(sub)
                const days = daysUntilExpiry(sub.endDate)
                const tone = st === 'expired' ? 'red' : st === 'expiring' ? 'amber' : 'green'
                return (
                  <li key={sub.id}>
                    <Link
                      to="/subscriptions"
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50/70"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          <bdi>{sub.serviceName}</bdi>
                        </div>
                        <div className="text-xs text-slate-500">
                          <bdi>{sub.provider}</bdi> • {sub.department}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div dir="ltr" className="font-mono text-xs font-semibold text-slate-800">
                            {sub.endDate}
                          </div>
                          <div className="text-xs text-slate-500">
                            {days < 0
                              ? `منتهي منذ ${Math.abs(days)} يوم`
                              : days === 0
                                ? 'ينتهي اليوم'
                                : `متبقي ${days} يوم`}
                          </div>
                        </div>
                        <Pill tone={tone}>{SUBSCRIPTION_STATUSES[st].label}</Pill>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
