import { NavLink } from 'react-router-dom'
import { Briefcase, Palette, Printer, Stack, Tag } from '@phosphor-icons/react'
import { cx } from '../../../shared/components/ui'

const TABS = [
  { to: '/dictionary/device-types', label: 'أنواع الأجهزة', icon: Stack },
  { to: '/dictionary/printer-types', label: 'أنواع الطابعات', icon: Printer },
  { to: '/dictionary/ink-colors', label: 'ألوان الأحبار', icon: Palette },
  { to: '/dictionary/brands', label: 'الماركات', icon: Tag },
  { to: '/dictionary/services', label: 'الخدمات والمزودون', icon: Briefcase },
]

export function DictionaryTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {TABS.map(({ to, label, icon: Icon }) => (
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

