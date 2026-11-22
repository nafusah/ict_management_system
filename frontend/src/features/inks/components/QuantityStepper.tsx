import { Minus, Plus } from 'lucide-react'
import { cx } from '../../../shared/components/ui'

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  size = 'md',
  label = 'الكمية',
  className,
}: {
  value: string
  onChange: (next: string) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  label?: string
  className?: string
}) {
  const parsed = Number.parseInt(value, 10)
  const current = Number.isFinite(parsed) ? parsed : min
  const canDec = current > min
  const canInc = max === undefined || current < max

  const step = (delta: number) => {
    let next = current + delta
    if (next < min) next = min
    if (max !== undefined && next > max) next = max
    onChange(String(next))
  }

  const h = size === 'sm' ? 'h-8' : 'h-10'
  const btn = size === 'sm' ? 'w-7' : 'w-9'

  return (
    <div
      dir="ltr"
      className={cx(
        'inline-flex shrink-0 items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white',
        h,
        className,
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={!canDec}
        aria-label={`إنقاص ${label}`}
        className={cx(
          'flex cursor-pointer items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35',
          btn,
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <input
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={() => {
          if (!Number.isFinite(parsed)) onChange(String(min))
          else if (max !== undefined && parsed > max) onChange(String(max))
        }}
        className={cx(
          'w-10 border-x border-slate-200 text-center font-bold tabular-nums text-slate-900 outline-none focus:bg-slate-50',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={!canInc}
        aria-label={`زيادة ${label}`}
        className={cx(
          'flex cursor-pointer items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35',
          btn,
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
