import { NavLink } from 'react-router-dom'
import { BookOpen, ClockCounterClockwise, IdentificationCard, SlidersHorizontal, Users } from '@phosphor-icons/react'
import { cx } from '../../../shared/components/ui'
import { useCurrentPermissions } from '../../../shared/data/auth'
import type { Permission } from '../../../shared/data/types'

const TABS: {
  to: string
  label: string
  icon: typeof SlidersHorizontal
  end: boolean
  permissions: Permission[]
}[] = [
  { to: '/settings', label: 'الإعدادات العامة', icon: SlidersHorizontal, end: true, permissions: ['settings.manage'] },
  { to: '/settings/users', label: 'المستخدمين', icon: Users, end: false, permissions: ['settings.manage'] },
  {
    to: '/settings/employees',
    label: 'الموظفين',
    icon: IdentificationCard,
    end: false,
    permissions: ['employees.manage', 'settings.manage'],
  },
  {
    to: '/settings/audit-logs',
    label: 'سجل التدقيق',
    icon: ClockCounterClockwise,
    end: false,
    permissions: ['settings.manage'],
  },
  {
    to: '/dictionary/device-types',
    label: 'القاموس',
    icon: BookOpen,
    end: false,
    permissions: ['dictionary.deviceTypes', 'dictionary.inkColors', 'dictionary.brands', 'dictionary.services'],
  },
]

export function SettingsTabs() {
  const userPerms = useCurrentPermissions()
  const visibleTabs = TABS.filter((t) => t.permissions.some((p) => userPerms.includes(p)))

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {visibleTabs.map(({ to, label, icon: Icon, end }) => (
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
