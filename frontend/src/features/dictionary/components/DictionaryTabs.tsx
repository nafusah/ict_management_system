import { NavLink } from 'react-router-dom'
import { Briefcase, Palette, Printer, Stack, Tag } from '@phosphor-icons/react'
import { cx } from '../../../shared/components/ui'
import { useCurrentPermissions } from '../../../shared/data/auth'
import type { Permission } from '../../../shared/data/types'

export const DICTIONARY_TABS: {
  to: string
  label: string
  icon: typeof Stack
  permissions: Permission[]
}[] = [
    { to: '/dictionary/device-types', label: 'أنواع الأجهزة', icon: Stack, permissions: ['dictionary.deviceTypes'] },
    { to: '/dictionary/printer-types', label: 'أنواع الطابعات', icon: Printer, permissions: ['dictionary.printerTypes', 'dictionary.inkColors'] },
    { to: '/dictionary/ink-colors', label: 'ألوان الأحبار', icon: Palette, permissions: ['dictionary.inkColors'] },
    { to: '/dictionary/brands', label: 'الماركات', icon: Tag, permissions: ['dictionary.brands'] },
    { to: '/dictionary/services', label: 'الخدمات والمزودون', icon: Briefcase, permissions: ['dictionary.services'] },
  ]

export function DictionaryTabs() {
  const userPerms = useCurrentPermissions()
  const visibleTabs = DICTIONARY_TABS.filter((tab) =>
    tab.permissions.some((p) => userPerms.includes(p)),
  )

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {visibleTabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
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
