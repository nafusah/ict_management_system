import type { InkColorItem } from '../../../shared/data/types'

export const DEFAULT_COLOR: InkColorItem = {
  id: 'black',
  name: 'أسود',
  code: 'K',
  primary: '#182230',
  light: '#f2f4f7',
  border: '#d0d5dd',
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  try {
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return value
    return dt.toLocaleString('ar-LY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}
