import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Droplets, LayoutDashboard, Menu, MonitorSmartphone, Settings, X, Zap } from 'lucide-react'
import { cx } from './ui'

const NAV = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/devices', label: 'الأجهزة', icon: MonitorSmartphone },
  { to: '/inks', label: 'مخزون الأحبار', icon: Droplets },
]

const BOTTOM_NAV = [{ to: '/settings', label: 'الإعدادات', icon: Settings }]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="القائمة الرئيسية" className="flex h-full flex-col bg-slate-900 text-slate-400">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <span className="flex size-8 items-center justify-center rounded bg-signal text-slate-900">
          <Zap className="size-5" />
        </span>
        <span className="font-bold tracking-wide text-white">KINETIC AMBER</span>
      </div>
      <ul className="flex flex-1 flex-col gap-1 p-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cx(
                  'relative flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-signal',
                  isActive ? 'bg-slate-800 font-semibold text-white' : 'hover:bg-slate-800/60 hover:text-slate-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cx('absolute top-2.5 right-0 h-6 w-[3px] rounded-sm', isActive && 'bg-signal')}
                  />
                  <Icon className="size-5" />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-800 p-2">
        <ul className="flex flex-col gap-1">
          {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    'relative flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-signal',
                    isActive ? 'bg-slate-800 font-semibold text-white' : 'hover:bg-slate-800/60 hover:text-slate-200',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={cx('absolute top-2.5 right-0 h-6 w-[3px] rounded-sm', isActive && 'bg-signal')}
                    />
                    <Icon className="size-5" />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const allNav = [...NAV, ...BOTTOM_NAV]
  const current = allNav.find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)))

  useEffect(() => {
    document.title = `${current?.label ?? 'إدارة أصول IT'} | إدارة أصول IT`
  }, [current])

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
            <Menu className="size-5" />
          </button>
          <div className="ms-auto flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 ps-1 pe-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-signal">
              IT
            </span>
            <span className="text-xs font-bold">مدير النظام</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
