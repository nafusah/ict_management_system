import type { InkColorItem } from '../../../shared/data/types'

export function Swatch({ meta }: { meta: InkColorItem }) {
  return (
    <span
      aria-hidden
      className="inline-block size-3 shrink-0 rounded-full"
      style={{ background: meta.primary }}
    />
  )
}
