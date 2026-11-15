import { NavLink } from 'react-router-dom'
import { BookOpen, SlidersHorizontal, Users } from '@phosphor-icons/react'
import { cx } from '../../../shared/components/ui'

const TABS = [
  { to: '/settings', label: 'الإعدادات العامة', icon: SlidersHorizontal, end: true },
  { to: '/settings/users', label: 'المستخدمين', icon: Users, end: false },
  { to: '/dictionary/device-types', label: 'القاموس', icon: BookOpen, end: false },
]

export function SettingsTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cx(
              'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-slate-900 font-semibold text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="size-4" weight={isActive ? 'duotone' : 'regular'} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

