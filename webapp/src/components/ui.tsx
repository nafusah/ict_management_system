import { useEffect, useId, useRef } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-signal text-slate-900 hover:bg-signal-hover font-bold',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium',
  ghost: 'text-slate-600 hover:bg-slate-100 font-medium',
  danger: 'bg-red-700 text-white hover:bg-red-800 font-bold',
}

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        buttonStyles[variant],
        className,
      )}
    />
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        'inline-flex size-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900',
        className,
      )}
    >
      {children}
    </button>
  )
}

const fieldBase =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-signal/60 aria-[invalid=true]:border-red-600'

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: (id: string, describedBy?: string) => ReactNode
}) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, className)} />
}

export function SelectInput({
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select {...props} className={cx(fieldBase, 'cursor-pointer', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(fieldBase, 'pr-9')}
      />
    </div>
  )
}

/** زر اختيار ضمن مجموعة فلاتر. */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900',
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
      )}
    >
      {children}
    </button>
  )
}

type PillTone = 'green' | 'blue' | 'amber' | 'red' | 'slate'

const pillTones: Record<PillTone, string> = {
  green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  amber: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  red: 'bg-red-50 border-red-200 text-red-800',
  slate: 'bg-slate-100 border-slate-200 text-slate-700',
}

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        pillTones[tone],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

/** نافذة حوار مبنية على عنصر dialog الأصلي (يحبس التركيز ويُغلق بـ Esc). */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer: ReactNode
  size?: 'sm' | 'md'
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx(
        'm-auto w-[calc(100%-2rem)] rounded-xl bg-white p-0 text-slate-900 shadow-2xl',
        size === 'sm' ? 'max-w-md' : 'max-w-2xl',
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5">
            <div className="flex-1">
              <h2 className="text-lg font-bold">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <IconButton label="إغلاق" onClick={onClose}>
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            {footer}
          </div>
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDelete({
  open,
  itemName,
  onCancel,
  onConfirm,
}: {
  open: boolean
  itemName: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title="حذف من السجل"
      footer={
        <>
          <Button onClick={onCancel}>إلغاء</Button>
          <Button variant="danger" onClick={onConfirm}>
            حذف
          </Button>
        </>
      }
    >
      <p className="text-sm leading-7 text-slate-700">
        سيُحذف <strong className="font-bold text-slate-900">{itemName}</strong> نهائيًا من السجل.
      </p>
    </Modal>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-prose text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function Pagination({
  page,
  pageCount,
  shown,
  total,
  noun,
  onPage,
}: {
  page: number
  pageCount: number
  shown: number
  total: number
  noun: string
  onPage: (p: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
      <span>
        عرض {shown} من أصل {total} {noun}
      </span>
      <div className="flex gap-2">
        <Button className="h-8 px-3" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          السابق
        </Button>
        <Button className="h-8 px-3" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          التالي
        </Button>
      </div>
    </div>
  )
}

export { cx }
