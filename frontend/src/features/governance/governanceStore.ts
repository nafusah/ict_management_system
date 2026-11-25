import { createCollection } from '../../shared/data/createCollection'

/* ============================ الأنواع ============================ */

export type ObjectiveStatus = 'active' | 'achieved' | 'on_hold' | 'cancelled'
export type ProjectStatus = 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export type RiskLevel = 'low' | 'medium' | 'high'
export type PillTone = 'green' | 'blue' | 'amber' | 'red' | 'slate'

export interface Kpi {
  name: string
  unit?: string | null
  baseline?: number | null
  current?: number | null
  target: number
}

export interface StrategicObjective {
  id: string
  title: string
  description?: string | null
  pillar?: string | null
  startYear: number
  endYear: number
  owner?: string | null
  status: ObjectiveStatus
  kpis: Kpi[] | null
}

export interface Milestone {
  title: string
  dueDate?: string | null
  done?: boolean
}

export interface Risk {
  description: string
  likelihood: RiskLevel
  impact: RiskLevel
  mitigation?: string | null
}

export interface ItProject {
  id: string
  name: string
  description?: string | null
  objectiveId?: string | null
  manager?: string | null
  department?: string | null
  startDate?: string | null
  endDate?: string | null
  budget?: number | null
  priority: ProjectPriority
  status: ProjectStatus
  progress: number
  milestones: Milestone[] | null
  risks: Risk[] | null
  notes?: string | null
}

/* ============================ المسميات ============================ */

export const OBJECTIVE_STATUSES: Record<ObjectiveStatus, { label: string; tone: PillTone }> = {
  active: { label: 'قيد التنفيذ', tone: 'blue' },
  achieved: { label: 'متحقق', tone: 'green' },
  on_hold: { label: 'معلّق', tone: 'amber' },
  cancelled: { label: 'ملغى', tone: 'slate' },
}

export const PROJECT_STATUSES: Record<ProjectStatus, { label: string; tone: PillTone }> = {
  planned: { label: 'مخطط', tone: 'slate' },
  in_progress: { label: 'قيد التنفيذ', tone: 'blue' },
  on_hold: { label: 'متوقف', tone: 'amber' },
  completed: { label: 'مكتمل', tone: 'green' },
  cancelled: { label: 'ملغى', tone: 'slate' },
}

export const PROJECT_PRIORITIES: Record<ProjectPriority, { label: string; tone: PillTone }> = {
  low: { label: 'منخفضة', tone: 'slate' },
  medium: { label: 'متوسطة', tone: 'blue' },
  high: { label: 'عالية', tone: 'amber' },
  critical: { label: 'حرجة', tone: 'red' },
}

export const RISK_LEVELS: Record<RiskLevel, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالٍ',
}

/* ============================ المتاجر ============================ */

export const objectivesStore = createCollection<StrategicObjective>('strategic-objectives', 'OBJ', '/strategic-objectives')
export const projectsStore = createCollection<ItProject>('it-projects', 'PRJ', '/it-projects')

export const useObjectives = () => objectivesStore.useStore((s) => s.items)
export const useProjects = () => projectsStore.useStore((s) => s.items)

/* ============================ الحسابات ============================ */

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** نسبة تحقق مؤشر أداء (0–100) قياساً من خط الأساس إلى المستهدف. */
export function kpiAchievement(kpi: Kpi): number {
  const current = kpi.current ?? kpi.baseline ?? 0
  const base = kpi.baseline ?? 0
  if (kpi.target === base) return current >= kpi.target ? 100 : 0
  return clamp(((current - base) / (kpi.target - base)) * 100)
}

/**
 * نسبة إنجاز الهدف: متوسط إنجاز مشاريعه (غير الملغاة)،
 * وإن لم توجد مشاريع فمتوسط تحقق مؤشرات الأداء.
 */
export function objectiveProgress(objective: StrategicObjective, projects: ItProject[]): number {
  if (objective.status === 'achieved') return 100
  const linked = projects.filter((p) => p.objectiveId === objective.id && p.status !== 'cancelled')
  if (linked.length > 0) return clamp(linked.reduce((s, p) => s + p.progress, 0) / linked.length)
  const kpis = objective.kpis ?? []
  if (kpis.length > 0) return clamp(kpis.reduce((s, k) => s + kpiAchievement(k), 0) / kpis.length)
  return 0
}

export function todayIso(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** المشروع متأخر إذا تجاوز تاريخ نهايته أو فاتت إحدى مراحله دون إنجاز. */
export function isProjectDelayed(p: ItProject, today = todayIso()): boolean {
  if (p.status === 'completed' || p.status === 'cancelled') return false
  if (p.endDate && p.endDate < today) return true
  return (p.milestones ?? []).some((m) => !m.done && m.dueDate && m.dueDate < today)
}

const RISK_SCORE: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }

/** مستوى الخطر = الاحتمالية × الأثر (1–9). */
export function riskSeverity(r: Risk): { score: number; label: string; tone: PillTone } {
  const score = RISK_SCORE[r.likelihood] * RISK_SCORE[r.impact]
  if (score >= 6) return { score, label: 'مرتفع', tone: 'red' }
  if (score >= 3) return { score, label: 'متوسط', tone: 'amber' }
  return { score, label: 'منخفض', tone: 'green' }
}

export function formatMoney(n?: number | null): string {
  if (n == null) return '—'
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} د.ل`
}

/** شريط تقدم بسيط تُشارك فيه الصفحتان. */
export function progressTone(pct: number, delayed = false): string {
  if (delayed) return 'bg-red-600'
  if (pct >= 100) return 'bg-emerald-600'
  if (pct >= 50) return 'bg-cobalt'
  return 'bg-amber-500'
}
