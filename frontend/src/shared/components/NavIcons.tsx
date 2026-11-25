import type { ReactNode } from 'react'

/**
 * أيقونات القائمة الجانبية بستايل "البطاقات المكدّسة" (Isometric stacked cards):
 * بطاقتين خلفيتين بإطار، وبطاقة أمامية بيضاء مائلة عليها رمز القسم.
 * الألوان مأخوذة من هوية النظام: cobalt للوضع العادي و signal (الأصفر) للعنصر النشط.
 */

export type NavIconProps = {
  className?: string
  active?: boolean
}

const COLORS = {
  glyph: '#4059aa', // cobalt
  glyphSoft: '#c7d2f4',
  glyphDeep: '#1e3a8a', // cobalt-deep
  outline: '#6f8ff0',
  outlineActive: '#fcc41a', // signal
  edge: '#1e3a8a',
  edgeActive: '#d99f00',
  backFill: '#0f172a', // slate-900 (خلفية القائمة)
}

// ميلان البطاقات: y' = y - 0.25x + 6
const SKEW = 'matrix(1 -0.25 0 1 0 6)'

function StackedCard({ active, className, children }: NavIconProps & { children: ReactNode }) {
  const outline = active ? COLORS.outlineActive : COLORS.outline
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={active ? { filter: 'drop-shadow(0 0 6px rgba(252,196,26,0.45))' } : undefined}
    >
      <g transform={SKEW}>
        {/* البطاقة الخلفية البعيدة */}
        <rect x="5" y="11" width="22" height="28" rx="3" stroke={outline} strokeOpacity="0.5" strokeWidth="1.4" />
        {/* البطاقة الخلفية القريبة */}
        <rect
          x="9.5"
          y="10"
          width="22"
          height="28"
          rx="3"
          fill={COLORS.backFill}
          stroke={outline}
          strokeOpacity="1"
          strokeWidth="1.3"
        />
        {/* سُمك البطاقة الأمامية */}
        <rect x="15.6" y="9" width="22" height="28" rx="3" fill={active ? COLORS.edgeActive : COLORS.edge} />
        {/* البطاقة الأمامية */}
        <rect x="14" y="9" width="22" height="28" rx="3" fill="#ffffff" />
        {/* الرمز — إحداثيات داخل البطاقة 22×28 */}
        <g transform="translate(14 9) translate(11 14) scale(0.86) translate(-11 -14)">{children}</g>
      </g>
    </svg>
  )
}

const { glyph: A, glyphSoft: S, glyphDeep: D } = COLORS

export function DashboardNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="4" y="6" width="6" height="6" rx="1.2" fill={A} />
      <rect x="12" y="6" width="6" height="6" rx="1.2" fill={S} />
      <rect x="4" y="14" width="6" height="8" rx="1.2" fill={S} />
      <rect x="12" y="14" width="6" height="8" rx="1.2" fill={A} />
    </StackedCard>
  )
}

export function DevicesNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="3" y="6.5" width="16" height="11.5" rx="1.6" fill={A} />
      <rect x="5" y="8.5" width="12" height="7.5" rx="0.8" fill={S} />
      <rect x="9.2" y="18" width="3.6" height="3" fill={A} />
      <rect x="6.5" y="21" width="9" height="1.9" rx="0.9" fill={A} />
    </StackedCard>
  )
}

export function InksNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <path d="M11 4.5C11 4.5 4 12.6 4 17.3a7 7 0 0 0 14 0C18 12.6 11 4.5 11 4.5Z" fill={A} />
      <ellipse cx="8.4" cy="17.6" rx="1.3" ry="2.4" fill="#fff" fillOpacity="0.75" />
    </StackedCard>
  )
}

export function PrintersNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="6" y="4.5" width="10" height="6.5" rx="0.8" fill={S} />
      <rect x="3" y="10" width="16" height="9" rx="2" fill={A} />
      <circle cx="16" cy="13" r="0.9" fill={S} />
      <rect x="6" y="15.5" width="10" height="8" rx="0.8" fill="#fff" stroke={A} strokeWidth="1.2" />
      <rect x="8" y="18" width="6" height="1.2" rx="0.6" fill={S} />
      <rect x="8" y="20.4" width="4" height="1.2" rx="0.6" fill={S} />
    </StackedCard>
  )
}

export function VouchersNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="4" y="5" width="14" height="19" rx="2" fill={A} />
      <rect x="6.3" y="8.5" width="9.4" height="13" rx="0.8" fill="#fff" />
      <rect x="8" y="3.4" width="6" height="3.6" rx="1" fill={S} stroke={A} strokeWidth="1" />
      <path d="m8 15.2 2 2 3.8-4" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="10.4" width="6" height="1.2" rx="0.6" fill={S} />
    </StackedCard>
  )
}

export function SubscriptionsNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <circle cx="11" cy="8.5" r="5" fill={A} />
      <circle cx="11" cy="8.5" r="1.8" fill="#fff" />
      <rect x="9.8" y="12.5" width="2.4" height="11.5" rx="1" fill={A} />
      <rect x="12" y="18" width="3.2" height="2" rx="0.6" fill={A} />
      <rect x="12" y="21.4" width="2.4" height="2" rx="0.6" fill={A} />
    </StackedCard>
  )
}

export function CategoriesNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <path d="M5 7.5h5l1.6 1.8H18a1 1 0 0 1 1 1V18H5Z" fill={S} />
      <path d="M3 10h5.5l1.8 2H18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" fill={A} />
      <rect x="6" y="17" width="7" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.8" />
    </StackedCard>
  )
}

export function SettingsNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <circle cx="11" cy="14" r="6.6" stroke={A} strokeWidth="2.6" strokeDasharray="2.6 2.58" />
      <circle cx="11" cy="14" r="5.4" fill={A} />
      <circle cx="11" cy="14" r="2.1" fill="#fff" />
    </StackedCard>
  )
}

export function UsersNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <circle cx="14.5" cy="10" r="2.8" fill={S} />
      <path d="M10 21a4.5 4.5 0 0 1 9 0v1h-9Z" fill={S} />
      <circle cx="8.5" cy="11" r="3.2" fill={A} />
      <path d="M3 22.5a5.5 5.5 0 0 1 11 0v1H3Z" fill={A} />
    </StackedCard>
  )
}

export function EmployeesNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="9.5" y="3.5" width="3" height="4.5" rx="1" fill={S} />
      <rect x="2.5" y="7" width="17" height="13.5" rx="2" fill={A} />
      <circle cx="7.4" cy="12" r="2" fill="#fff" />
      <path d="M4.6 17.4a2.8 2.8 0 0 1 5.6 0Z" fill="#fff" />
      <rect x="11.5" y="11" width="6" height="1.4" rx="0.7" fill="#fff" />
      <rect x="11.5" y="14" width="4.2" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.7" />
    </StackedCard>
  )
}

export function AuditNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <circle cx="11" cy="14" r="7.5" fill={A} />
      <circle cx="11" cy="14" r="5.6" fill={S} fillOpacity="0.35" />
      <path d="M11 9.6V14l3 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </StackedCard>
  )
}

export function DictionaryNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="4" y="5" width="14" height="19" rx="1.6" fill={A} />
      <rect x="4" y="5" width="3" height="19" rx="1" fill={D} />
      <rect x="7" y="21" width="11" height="1.8" fill="#fff" />
      <rect x="9.2" y="9" width="6.5" height="1.5" rx="0.75" fill="#fff" />
      <rect x="9.2" y="12" width="4.5" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.7" />
    </StackedCard>
  )
}

export function StrategyNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <circle cx="11" cy="15" r="7.5" fill={A} />
      <circle cx="11" cy="15" r="5" fill="#fff" />
      <circle cx="11" cy="15" r="2.6" fill={S} stroke={A} strokeWidth="1.2" />
      <path d="M11 15 17.6 6.4" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
      <path d="m15.6 6.2 2.4-.6.4 2.6" stroke={D} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </StackedCard>
  )
}

export function ProjectsNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="3.5" y="5" width="1.4" height="19" rx="0.7" fill={D} />
      <rect x="6" y="6.5" width="9" height="3.2" rx="1.2" fill={A} />
      <rect x="9" y="11.6" width="9.5" height="3.2" rx="1.2" fill={S} stroke={A} strokeWidth="0.8" />
      <rect x="6.5" y="16.7" width="7" height="3.2" rx="1.2" fill={A} />
      <path d="m15.2 21.6 1.6 1.5 2.6-3" stroke={A} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </StackedCard>
  )
}

export function ReportsNavIcon(props: NavIconProps) {
  return (
    <StackedCard {...props}>
      <rect x="4" y="4.5" width="14" height="19" rx="1.8" fill={A} />
      <rect x="6.2" y="7.2" width="9.6" height="13.8" rx="0.8" fill="#fff" />
      <rect x="7.6" y="15.2" width="1.8" height="4" rx="0.4" fill={A} />
      <rect x="10.1" y="12.4" width="1.8" height="6.8" rx="0.4" fill={S} stroke={A} strokeWidth="0.6" />
      <rect x="12.6" y="10" width="1.8" height="9.2" rx="0.4" fill={D} />
      <rect x="7.6" y="8.8" width="4" height="1.1" rx="0.55" fill={S} />
    </StackedCard>
  )
}
