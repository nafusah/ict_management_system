import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Illustration, Illustrations } from '../components/Illustrations'
import { useDevices, useInks } from '../data/store'
import { DEVICE_KINDS, INK_COLORS, isLowStock } from '../data/types'
import type { DeviceKind, InkColor } from '../data/types'

const cardBase =
  'group block rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50/60 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'

function WarningNote({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
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
  const inks = useInks()

  const totalCartridges = inks.reduce((s, i) => s + i.quantity, 0)
  const lowItems = inks.filter(isLowStock).length
  const personal = devices.filter((d) => d.classification === 'personal').length

  const kindCounts = devices.reduce<Partial<Record<DeviceKind, number>>>((acc, d) => {
    acc[d.kind] = (acc[d.kind] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="الملخص" className="grid gap-4 lg:grid-cols-2">
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
      </section>

      <section aria-labelledby="inks-by-color">
        <h2 id="inks-by-color" className="mb-4 text-lg font-bold">
          الأحبار حسب اللون
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(Object.keys(INK_COLORS) as InkColor[]).map((color) => {
            const items = inks.filter((i) => i.color === color)
            const total = items.reduce((s, i) => s + i.quantity, 0)
            const low = items.filter(isLowStock).length
            const meta = INK_COLORS[color]
            return (
              <SmallCard
                key={color}
                to={`/inks?color=${color}`}
                svg={Illustrations.cartridge(color)}
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
          {(Object.keys(DEVICE_KINDS) as DeviceKind[])
            .filter((k) => kindCounts[k])
            .map((kind) => (
              <SmallCard
                key={kind}
                to={`/devices?kind=${kind}`}
                svg={Illustrations.device(kind)}
                svgLabel={`رسمة ${DEVICE_KINDS[kind].label}`}
                value={kindCounts[kind] ?? 0}
                label={DEVICE_KINDS[kind].label}
                artClass="h-24"
              />
            ))}
        </div>
      </section>
    </div>
  )
}
