import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Illustration, Illustrations } from '../../shared/components/Illustrations'
import { Pill, cx } from '../../shared/components/ui'
import { usePermission } from '../../shared/data/auth'
import { useDeviceTypes, useDevices, useInks, usePrinterTypes, useSubscriptions } from '../../shared/data/store'
import { SUBSCRIPTION_STATUSES, daysUntilExpiry, getSubscriptionStatus, isLowStock } from '../../shared/data/types'
import type { DeviceKind, SubscriptionStatus } from '../../shared/data/types'

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

function SmallCard({
  to,
  svg,
  svgLabel,
  imageUrl,
  value,
  label,
  note,
  artClass = 'h-28',
}: {
  to?: string
  svg: string
  svgLabel: string
  imageUrl?: string | null
  value: number
  label: string
  note?: ReactNode
  artClass?: string
}) {
  const content = (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={svgLabel}
          className={`mx-auto ${artClass} w-auto max-w-full rounded-lg object-contain`}
        />
      ) : (
        <Illustration svg={svg} label={svgLabel} className={`mx-auto ${artClass}`} />
      )}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tabular-nums">{value}</span>
        <span className="truncate text-sm font-semibold text-slate-700">{label}</span>
      </div>
      {note && <div className="mt-2 text-xs text-slate-500">{note}</div>}
    </>
  )

  if (!to) {
    return <div className={`${cardBase} p-4`}>{content}</div>
  }

  return (
    <Link to={to} className={`${cardLink} p-4`}>
      {content}
    </Link>
  )
}

export default function Dashboard() {
  const canDashboardDevices = usePermission('dashboard.devices')
  const canDashboardInks = usePermission('dashboard.inks')
  const canDashboardSubs = usePermission('dashboard.subscriptions')
  const canViewDevices = usePermission(['devices.view', 'devices.manage'])
  const canViewInks = usePermission(['inks.view', 'inks.manage'])
  const canViewSubs = usePermission(['subscriptions.view', 'subscriptions.manage'])
  const canManagePrinterTypes = usePermission(['dictionary.printerTypes', 'dictionary.inkColors'])

  const devices = useDevices()
  const deviceTypes = useDeviceTypes()
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
            to={canViewInks ? '/inks' : undefined}
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
        )}
        {canDashboardSubs && (
          <HeroCard
            to={
              canViewSubs
                ? dueSubscriptions > 0
                  ? '/subscriptions?status=expiring'
                  : '/subscriptions'
                : undefined
            }
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

      {canDashboardInks && (
        <section aria-labelledby="inks-by-printer">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="inks-by-printer" className="text-lg font-bold">
              الطابعات والأحبار المرتبطة بها
            </h2>
            {canManagePrinterTypes && (
              <Link to="/dictionary/printer-types" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                إدارة أنواع الطابعات ←
              </Link>
            )}
          </div>
          {printerTypes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              لم يتم إضافة أنواع طابعات بعد.
              {canManagePrinterTypes && (
                <>
                  {' '}
                  أضف أنواع الطابعات من{' '}
                  <Link to="/dictionary/printer-types" className="font-semibold text-slate-900 underline">
                    القاموس
                  </Link>{' '}
                  لربطها بالأحبار.
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {printerTypes.map((pt) => {
                const items = inks.filter((i) => i.printerTypeId === pt.id)
                const total = items.reduce((s, i) => s + i.quantity, 0)
                const low = items.filter(isLowStock).length
                return (
                  <SmallCard
                    key={pt.id}
                    to={canViewInks ? `/inks?printerType=${pt.id}` : undefined}
                    svg={Illustrations.device('printer')}
                    svgLabel={`صورة طابعة ${pt.name}`}
                    imageUrl={pt.image}
                    value={total}
                    label={pt.name}
                    artClass="h-24"
                    note={
                      items.length === 0 ? (
                        'لا توجد أحبار مربوطة'
                      ) : low === 0 ? (
                        `${countItems(items.length)} مربوط • المخزون كافٍ`
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
          )}
        </section>
      )}

      {canDashboardDevices && (
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
      )}

      {canDashboardSubs && (
        <section aria-labelledby="subscriptions-summary">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="subscriptions-summary" className="text-lg font-bold">
              ملخص الاشتراكات والتراخيص
            </h2>
            {canViewSubs && (
              <Link to="/subscriptions" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                عرض الكل ←
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(
              [
                { key: 'active', tone: 'green', desc: 'سارية المفعول حالياً' },
                { key: 'expiring', tone: 'amber', desc: 'تستحق التنبيه والتجديد' },
                { key: 'expired', tone: 'red', desc: 'انتهت صلاحيتها' },
                { key: 'cancelled', tone: 'slate', desc: 'تم إلغاؤها' },
              ] as const
            ).map(({ key, tone, desc }) => {
              const cardContent = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Pill tone={tone}>{SUBSCRIPTION_STATUSES[key].label}</Pill>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
                    {subscriptionCounts[key]}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{desc}</div>
                </>
              )
              return canViewSubs ? (
                <Link key={key} to={`/subscriptions?status=${key}`} className={`${cardLink} p-4`}>
                  {cardContent}
                </Link>
              ) : (
                <div key={key} className={`${cardBase} p-4`}>
                  {cardContent}
                </div>
              )
            })}
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
                  const rowInner = (
                    <>
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
                    </>
                  )
                  return (
                    <li key={sub.id}>
                      {canViewSubs ? (
                        <Link
                          to="/subscriptions"
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50/70"
                        >
                          {rowInner}
                        </Link>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                          {rowInner}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
