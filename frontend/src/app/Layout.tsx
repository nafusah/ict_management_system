import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  CaretDown,
  CheckCircle,
  ClockCounterClockwise,
  DesktopTower,
  Drop,
  Gear,
  IdentificationCard,
  Key,
  List,
  LockSimple,
  SignOut,
  SquaresFour,
  Users,
  Warning,
  X,
} from '@phosphor-icons/react'
import { useAuthStore } from '../features/auth/authStore'
import { logout, useAuth, useCurrentPermissions } from '../shared/data/auth'
import { useInkColors, useInks, useSubscriptions } from '../shared/data/store'
import { daysUntilExpiry, getSubscriptionStatus, isLowStock } from '../shared/data/types'
import type { Permission } from '../shared/data/types'
import { Button, Field, Modal, Pill, TextInput, Toast, cx } from '../shared/components/ui'

type NavItem = {
  to: string
  label: string
  icon: typeof SquaresFour
  indent?: boolean
  end?: boolean
  matchPrefix?: string
  permissions?: Permission[]
}

const NAV: NavItem[] = [
  {
    to: '/',
    label: 'لوحة التحكم',
    icon: SquaresFour,
    permissions: ['dashboard.devices', 'dashboard.inks', 'dashboard.subscriptions'],
  },
  { to: '/devices', label: 'الأجهزة', icon: DesktopTower, permissions: ['devices.view', 'devices.manage'] },
  { to: '/inks', label: 'مخزون الأحبار', icon: Drop, permissions: ['inks.view', 'inks.manage'] },
  {
    to: '/subscriptions',
    label: 'الاشتراكات والتراخيص',
    icon: Key,
    permissions: ['subscriptions.view', 'subscriptions.manage'],
  },
]

const BOTTOM_NAV: NavItem[] = [
  { to: '/settings', label: 'الإعدادات', icon: Gear, end: true, permissions: ['settings.manage'] },
  { to: '/settings/users', label: 'المستخدمين', icon: Users, indent: true, permissions: ['settings.manage'] },
  {
    to: '/settings/employees',
    label: 'الموظفين',
    icon: IdentificationCard,
    indent: true,
    permissions: ['employees.manage', 'settings.manage'],
  },
  {
    to: '/settings/audit-logs',
    label: 'سجل التدقيق',
    icon: ClockCounterClockwise,
    indent: true,
    permissions: ['settings.manage'],
  },
  {
    to: '/dictionary/device-types',
    label: 'القاموس',
    icon: BookOpen,
    indent: true,
    matchPrefix: '/dictionary',
    permissions: ['dictionary.deviceTypes', 'dictionary.printerTypes', 'dictionary.inkColors', 'dictionary.brands', 'dictionary.services'],
  },
]

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  const { to, label, icon: Icon, indent, end, matchPrefix } = item
  return (
    <li>
      <NavLink
        to={to}
        end={end ?? to === '/'}
        onClick={onNavigate}
        className={({ isActive }) => {
          const active = matchPrefix ? window.location.pathname.startsWith(matchPrefix) : isActive
          return cx(
            'sidebar-water relative flex items-center gap-3 rounded-lg text-sm transition-colors duration-300',
            indent ? 'h-9 ps-9 pe-4 text-[13px]' : 'h-11 px-4',
            'focus-visible:outline-2 focus-visible:outline-signal',
            active
              ? 'sidebar-water-active bg-slate-800/80 font-semibold text-white'
              : 'hover:text-white',
          )
        }}
      >
        {({ isActive }) => {
          const active = matchPrefix ? window.location.pathname.startsWith(matchPrefix) : isActive
          return (
            <>
              <Icon
                className={cx('relative z-10', indent ? 'size-4' : 'size-5')}
                weight={active ? 'duotone' : 'regular'}
              />
              <span className="relative z-10">{label}</span>
            </>
          )
        }}
      </NavLink>
    </li>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const userPerms = useCurrentPermissions()
  const canSee = (item: NavItem) =>
    !item.permissions || item.permissions.some((p) => userPerms.includes(p))

  const visibleNav = NAV.filter(canSee)
  const visibleBottom = BOTTOM_NAV.filter(canSee)

  return (
    <nav aria-label="القائمة الرئيسية" className="flex h-full flex-col bg-slate-900 text-slate-400">
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-5">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/ims_logo_dark_theme.svg"
            alt="شعار النظام"
            className="h-11 w-11 object-contain"
          />

        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1 p-2">
        {visibleNav.map((item) => (
          <SidebarLink key={`${item.label}-${item.to}`} item={item} onNavigate={onNavigate} />
        ))}
      </ul>
      {visibleBottom.length > 0 && (
        <div className="border-t border-slate-800 p-2">
          <ul className="flex flex-col gap-1">
            {visibleBottom.map((item) => (
              <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdToast, setPwdToast] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])
  const [lowStockAlertOpen, setLowStockAlertOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('it-low-stock-alert-seen') !== '1'
  })
  const location = useLocation()
  const navigate = useNavigate()
  const session = useAuth()
  const inks = useInks()
  const inkColors = useInkColors()
  const subscriptions = useSubscriptions()
  const lowStockInks = useMemo(() => inks.filter(isLowStock), [inks])
  const showLowStockAlert = lowStockAlertOpen && lowStockInks.length > 0

  const dismissLowStockAlert = () => {
    sessionStorage.setItem('it-low-stock-alert-seen', '1')
    setLowStockAlertOpen(false)
  }

  const notifications = useMemo(() => {
    const items: {
      id: string
      title: string
      subtitle: string
      badge: string
      tone: 'red' | 'amber'
      to: string
      kind: 'ink' | 'subscription'
    }[] = []

    for (const sub of subscriptions) {
      const st = getSubscriptionStatus(sub)
      if (st === 'expired' || st === 'expiring') {
        const days = daysUntilExpiry(sub.endDate)
        items.push({
          id: `sub-${sub.id}`,
          title: sub.serviceName,
          subtitle:
            days < 0
              ? `${sub.provider} • منتهي منذ ${Math.abs(days)} يوم`
              : days === 0
                ? `${sub.provider} • ينتهي اليوم`
                : `${sub.provider} • متبقي ${days} يوم`,
          badge: st === 'expired' ? 'منتهي' : 'قارب الانتهاء',
          tone: st === 'expired' ? 'red' : 'amber',
          to: `/subscriptions?status=${st}`,
          kind: 'subscription',
        })
      }
    }

    for (const ink of inks) {
      if (isLowStock(ink)) {
        const colorName = inkColors.find((c) => c.id === ink.color)?.name ?? ink.color
        items.push({
          id: `ink-${ink.id}`,
          title: ink.model,
          subtitle: `${ink.brand} (${colorName}) • المتوفر ${ink.quantity} من حد ${ink.alertThreshold}`,
          badge: 'تحت حد الطلب',
          tone: 'amber',
          to: '/inks?low=1',
          kind: 'ink',
        })
      }
    }

    return items
  }, [inks, inkColors, subscriptions])

  const allNav = [...NAV, ...BOTTOM_NAV]
  const current = allNav.find((n) =>
    n.to === '/' || ('end' in n && n.end) ? location.pathname === n.to : location.pathname.startsWith(n.to),
  )

  useEffect(() => {
    document.title = `${current?.label ?? 'إدارة أصول IT'} | إدارة أصول IT`
  }, [current])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-72 max-w-[85%]">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
            <button
              aria-label="إغلاق القائمة"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 left-3 rounded p-1 text-slate-400 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            aria-label="فتح القائمة"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <List className="size-5" />
          </button>
          <div className="ms-auto flex items-center gap-2.5">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 ps-1 pe-2.5 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-signal">
                  IT
                </span>
                <span className="text-xs font-bold text-slate-800">{session?.name ?? 'مدير النظام'}</span>
                <CaretDown className={cx('size-3.5 text-slate-400 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute top-full left-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                >
                  <div className="border-b border-slate-100 px-3.5 py-2.5">
                    <p className="truncate text-xs font-bold text-slate-900">{session?.name ?? 'مدير النظام'}</p>
                    {session?.email && (
                      <p className="mt-0.5 truncate text-[11px] text-slate-500" dir="ltr">
                        {session.email}
                      </p>
                    )}
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        setPwdOpen(true)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <LockSimple className="size-4 text-slate-500" />
                      تغيير كلمة المرور
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                        navigate('/login', { replace: true })
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                    >
                      <SignOut className="size-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="الإشعارات"
              onClick={() => setNotifOpen(true)}
              className="relative inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
            >
              <Bell className="size-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {notifOpen && (
          <div className="fixed inset-0 z-50">
            <button
              aria-label="إغلاق الإشعارات"
              className="absolute inset-0 bg-slate-900/45"
              onClick={() => setNotifOpen(false)}
            />
            <aside
              aria-label="لوحة الإشعارات"
              className="drawer-left-enter absolute inset-y-0 left-0 flex w-96 max-w-[92vw] flex-col border-r border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
                <div className="flex items-center gap-2.5">
                  <Bell className="size-5 text-slate-800" />
                  <h2 className="text-base font-bold text-slate-900">الإشعارات</h2>
                  {notifications.length > 0 && <Pill tone="red">{notifications.length}</Pill>}
                </div>
                <button
                  type="button"
                  aria-label="إغلاق"
                  onClick={() => setNotifOpen(false)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {notifications.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <CheckCircle className="size-10 text-emerald-600" weight="duotone" />
                    <p className="mt-3 text-sm font-bold text-slate-900">لا توجد تنبيهات حالياً</p>
                    <p className="mt-1 text-xs text-slate-500">
                      جميع الاشتراكات سارية ومخزون الأحبار فوق حد الطلب.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <Link
                          to={n.to}
                          onClick={() => setNotifOpen(false)}
                          className="block rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                              {n.kind === 'ink' ? (
                                <Drop className="size-4 shrink-0 text-slate-600" weight="duotone" />
                              ) : (
                                <Key className="size-4 shrink-0 text-slate-600" weight="duotone" />
                              )}
                              <bdi>{n.title}</bdi>
                            </span>
                            <Pill tone={n.tone}>{n.badge}</Pill>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500">{n.subtitle}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      <Modal
        open={showLowStockAlert}
        onClose={dismissLowStockAlert}
        size="sm"
        title="تنبيه نقص مخزون الأحبار"
        description={`يوجد ${lowStockInks.length} صنف حبر وصل إلى حد التنبيه أو أقل ويحتاج لإعادة التزويد.`}
        footer={
          <>
            <Button onClick={dismissLowStockAlert}>إغلاق</Button>
            <Button
              variant="primary"
              onClick={() => {
                dismissLowStockAlert()
                navigate('/inks?low=1')
              }}
            >
              عرض المخزون الناقص
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-amber-500 px-3.5 py-2.5 text-sm font-bold text-slate-950">
            <Warning className="size-5 shrink-0" weight="duotone" />
            <span>يرجى مراجعة الأصناف التالية قبل نفادها بالكامل:</span>
          </div>
          <ul className="max-h-60 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200">
            {lowStockInks.map((ink) => {
              const colorName = inkColors.find((c) => c.id === ink.color)?.name ?? ink.color
              return (
                <li key={ink.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      <bdi>{ink.model}</bdi>
                    </p>
                    <p className="text-xs text-slate-500">
                      {ink.brand} • {colorName}
                    </p>
                  </div>
                  <Pill tone={ink.quantity === 0 ? 'red' : 'amber'}>
                    {ink.quantity === 0 ? 'نفد (0)' : `المتوفر ${ink.quantity} / ${ink.alertThreshold}`}
                  </Pill>
                </li>
              )
            })}
          </ul>
        </div>
      </Modal>

      <ChangePasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={() => {
          setPwdOpen(false)
          setPwdToast('تم تغيير كلمة المرور بنجاح')
        }}
      />

      <Toast message={pwdToast} tone="green" onClose={() => setPwdToast(null)} />
    </div>
  )
}

function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const changePassword = useAuthStore((s) => s.changePassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSaving(false)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 4) {
      setError('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }
    setSaving(true)
    const res = await changePassword(currentPassword, newPassword)
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    onSuccess()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="تغيير كلمة المرور"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" form="change-pwd-form" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
          </Button>
        </>
      }
    >
      <form id="change-pwd-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
        <Field label="كلمة المرور الحالية">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              dir="ltr"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoFocus
            />
          )}
        </Field>
        <Field label="كلمة المرور الجديدة">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          )}
        </Field>
        <Field label="تأكيد كلمة المرور الجديدة">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
