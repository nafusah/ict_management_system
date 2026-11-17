import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Cloud, Globe, Layers, Monitor, ShieldCheck } from 'lucide-react'
import { Button, PageHeader, Pill, SearchInput, cx } from '../../shared/components/ui'
import { usePermission } from '../../shared/data/auth'
import { useSubscriptions } from '../../shared/data/store'
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  daysUntilExpiry,
  getSubscriptionStatus,
} from '../../shared/data/types'
import type { Subscription, SubscriptionCategory, SubscriptionStatus } from '../../shared/data/types'

const CATEGORY_ICONS: Record<SubscriptionCategory, typeof Monitor> = {
  software: Monitor,
  cloud: Cloud,
  security: ShieldCheck,
  network: Globe,
  other: Layers,
}

const STATUS_TONE: Record<SubscriptionStatus, 'green' | 'amber' | 'red' | 'slate'> = {
  active: 'green',
  expiring: 'amber',
  expired: 'red',
  cancelled: 'slate',
}

function formatDays(days: number, cancelled: boolean) {
  if (cancelled) return 'ملغي'
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`
  if (days === 0) return 'ينتهي اليوم'
  if (days === 1) return 'ينتهي غداً'
  return `متبقي ${days} يوم`
}

export default function SubscriptionsSummaryPage() {
  const subscriptions = useSubscriptions()
  const canViewSubs = usePermission(['subscriptions.view', 'subscriptions.manage'])
  const [query, setQuery] = useState('')
  const [openCategory, setOpenCategory] = useState<SubscriptionCategory | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subscriptions
    return subscriptions.filter((s) =>
      [s.serviceName, s.provider, s.department, s.poNumber, SUBSCRIPTION_CATEGORIES[s.category].label].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  }, [subscriptions, query])

  const grouped = useMemo(() => {
    const map: Record<SubscriptionCategory, Subscription[]> = {
      software: [],
      cloud: [],
      security: [],
      network: [],
      other: [],
    }
    for (const sub of filtered) {
      map[sub.category].push(sub)
    }
    for (const key of Object.keys(map) as SubscriptionCategory[]) {
      map[key].sort((a, b) => a.endDate.localeCompare(b.endDate))
    }
    return map
  }, [filtered])

  const categories = Object.keys(SUBSCRIPTION_CATEGORIES) as SubscriptionCategory[]

  return (
    <div>
      <PageHeader
        title="تصنيفات الاشتراكات والتراخيص"
        description="اضغط على أي تصنيف لعرض المزودين والاشتراكات المسجلة تحته وتفاصيلها."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/">
              <Button variant="secondary">
                <ArrowRight className="size-4" />
                لوحة التحكم
              </Button>
            </Link>
            {canViewSubs && (
              <Link to="/subscriptions">
                <Button variant="primary">عرض كل الاشتراكات</Button>
              </Link>
            )}
          </div>
        }
      />

      {subscriptions.length > 0 && (
        <div className="mb-5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="ابحث بالتصنيف أو الخدمة أو المزود أو الإدارة"
          />
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const items = grouped[cat]
          const isOpen = openCategory === cat
          const Icon = CATEGORY_ICONS[cat]
          const dueCount = items.filter((s) => {
            const st = getSubscriptionStatus(s)
            return st === 'expiring' || st === 'expired'
          }).length
          const providers = Array.from(new Set(items.map((i) => i.provider).filter(Boolean)))

          return (
            <div
              key={cat}
              className={cx(
                'overflow-hidden rounded-xl border bg-white transition-colors',
                isOpen ? 'border-slate-900 ring-1 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenCategory((cur) => (cur === cat ? null : cat))}
                className="w-full cursor-pointer p-4 text-start transition-colors hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="size-5" />
                  </span>
                  <ChevronDown
                    className={cx(
                      'size-4 shrink-0 text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-slate-900',
                    )}
                  />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums text-slate-900">
                    {items.length}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {SUBSCRIPTION_CATEGORIES[cat].label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {items.length === 0 ? (
                    <span>لا توجد اشتراكات</span>
                  ) : dueCount > 0 ? (
                    <span className="inline-flex whitespace-nowrap rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950">
                      {dueCount} بحاجة للمتابعة
                    </span>
                  ) : (
                    <span>{providers.length} مزود • جميعها سارية</span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="page-transition border-t border-slate-200 bg-slate-50/70 p-3">
                  {items.length === 0 ? (
                    <p className="py-2 text-center text-xs text-slate-500">
                      لا توجد اشتراكات مسجلة في هذا التصنيف.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-200/80">
                      {items.map((sub) => {
                        const st = getSubscriptionStatus(sub)
                        const days = daysUntilExpiry(sub.endDate)
                        return (
                          <li key={sub.id} className="py-2.5 first:pt-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-xs font-bold text-slate-900">
                                  <bdi>{sub.provider}</bdi>
                                </div>
                                <div className="truncate text-[11px] font-medium text-slate-700">
                                  <bdi>{sub.serviceName}</bdi>
                                </div>
                                <div className="mt-0.5 truncate text-[11px] text-slate-500">
                                  {sub.department}
                                  {sub.poNumber ? ` • ${sub.poNumber}` : ''}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <Pill tone={STATUS_TONE[st]}>{SUBSCRIPTION_STATUSES[st].label}</Pill>
                                <div dir="ltr" className="font-mono text-[11px] text-slate-600">
                                  {sub.endDate}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {formatDays(days, sub.cancelled)}
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {canViewSubs && (
                    <Link
                      to="/subscriptions"
                      className="mt-3 block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                    >
                      إدارة الاشتراكات ←
                    </Link>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
