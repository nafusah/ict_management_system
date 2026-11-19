import { cx, TextInput } from '../../../shared/components/ui'
import type { InkColor, InkColorItem } from '../../../shared/data/types'

export interface ColorInkRow {
  color: InkColor
  model: string
  quantity: string
}

export function findColorIdsByPreset(
  inkColors: InkColorItem[],
  preset: 'mono' | 'cmyk',
): InkColor[] {
  const matchOne = (needles: string[]) =>
    inkColors.find((c) => {
      const hay = `${c.id} ${c.code ?? ''} ${c.name}`.toLowerCase()
      return needles.some((n) => hay.includes(n))
    })?.id

  const black = matchOne(['black', 'أسود', 'اسود', 'clr-001', 'k']) ?? inkColors[0]?.id
  if (preset === 'mono') {
    return black ? [black] : []
  }

  const cyan = matchOne(['cyan', 'أزرق', 'ازرق', 'سماوي', 'clr-002', 'c'])
  const magenta = matchOne(['magenta', 'أحمر', 'احمر', 'وردي', 'قرمزي', 'clr-003', 'm'])
  const yellow = matchOne(['yellow', 'أصفر', 'اصفر', 'clr-004', 'y'])

  const list = [black, cyan, magenta, yellow].filter((id): id is InkColor => Boolean(id))
  const unique = Array.from(new Set(list))
  return unique.length > 0 ? unique : inkColors.slice(0, 4).map((c) => c.id)
}

export function InkColorSetSelector({
  inkColors,
  rows,
  baseModel,
  baseQuantity,
  onChange,
  error,
}: {
  inkColors: InkColorItem[]
  rows: ColorInkRow[]
  baseModel: string
  baseQuantity: string
  onChange: (next: ColorInkRow[]) => void
  error?: string
}) {
  const selectedIds = new Set(rows.map((r) => r.color))

  const applyPreset = (preset: 'mono' | 'cmyk') => {
    const ids = findColorIdsByPreset(inkColors, preset)
    const existing = new Map(rows.map((r) => [r.color, r]))
    onChange(
      ids.map(
        (id) =>
          existing.get(id) ?? {
            color: id,
            model: baseModel,
            quantity: baseQuantity || '1',
          },
      ),
    )
  }

  const toggleColor = (colorId: InkColor) => {
    if (selectedIds.has(colorId)) {
      if (rows.length <= 1) return
      onChange(rows.filter((r) => r.color !== colorId))
    } else {
      onChange([
        ...rows,
        {
          color: colorId,
          model: baseModel,
          quantity: baseQuantity || '1',
        },
      ])
    }
  }

  const updateRow = (colorId: InkColor, patch: Partial<ColorInkRow>) => {
    onChange(rows.map((r) => (r.color === colorId ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          الألوان {rows.length > 1 && <span className="text-xs text-slate-500">({rows.length} ألوان محددة)</span>}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('mono')}
            className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            أحادي (أسود)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('cmyk')}
            className="cursor-pointer rounded-md border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
          >
            طقم ملون (CMYK)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {inkColors.map((c) => {
          const active = selectedIds.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleColor(c.id)}
              className={cx(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
              )}
            >
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full ring-1 ring-black/15"
                style={{ backgroundColor: c.primary }}
              />
              <span className="truncate">{c.name}</span>
            </button>
          )
        })}
      </div>

      {rows.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            تخصيص الموديل والكمية لكل لون (يُترك نفس الموديل أو يُعدّل لكل لون):
          </p>
          <div className="space-y-2">
            {rows.map((row) => {
              const colorMeta = inkColors.find((c) => c.id === row.color)
              return (
                <div key={row.color} className="grid grid-cols-[100px_1fr_84px] items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full ring-1 ring-black/15"
                      style={{ backgroundColor: colorMeta?.primary ?? '#334155' }}
                    />
                    <span className="truncate">{colorMeta?.name ?? row.color}</span>
                  </div>
                  <TextInput
                    dir="ltr"
                    className="h-9 text-right text-xs"
                    placeholder={baseModel || 'مثال: 222A'}
                    value={row.model}
                    onChange={(e) => updateRow(row.color, { model: e.target.value })}
                    aria-label={`موديل اللون ${colorMeta?.name ?? row.color}`}
                  />
                  <TextInput
                    type="number"
                    min={0}
                    dir="ltr"
                    className="h-9 text-center text-xs font-bold tabular-nums"
                    placeholder="الكمية"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.color, { quantity: e.target.value })}
                    aria-label={`كمية اللون ${colorMeta?.name ?? row.color}`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  )
}
