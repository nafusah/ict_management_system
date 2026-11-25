import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Circle, FolderKanban, Pencil, Plus, Target, Trash2, X } from 'lucide-react'
import {
  Button,
  ConfirmDelete,
  Field,
  FilterChip,
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  SearchInput,
  SearchableSelect,
  SelectInput,
  TextInput,
  Toast,
  cx,
} from '../../shared/components/ui'
import { ListSkeleton } from '../../shared/components/Skeleton'
import { usePermission } from '../../shared/data/auth'
import { useDataLoading, useDepartments, useEmployees } from '../../shared/data/store'
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  RISK_LEVELS,
  formatMoney,
  isProjectDelayed,
  progressTone,
  projectsStore,
  riskSeverity,
  todayIso,
  useObjectives,
  useProjects,
} from './governanceStore'
import type { ItProject, Milestone, ProjectPriority, ProjectStatus, Risk, RiskLevel } from './governanceStore'

const PAGE_SIZE = 10
type StatusFilter = ProjectStatus | 'delayed'

const textareaCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:ring-2 focus:ring-signal/60 focus:outline-none'

function MiniProgress({ value, delayed }: { value: number; delayed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx('h-full rounded-full', progressTone(value, delayed))} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-700">{value}%</span>
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: 'red' }) {
  return (
    <div className={cx('rounded-xl border bg-white px-5 py-4', tone === 'red' && value > 0 ? 'border-red-200' : 'border-slate-200')}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cx('mt-1 text-3xl font-extrabold tabular-nums', tone === 'red' && value > 0 && 'text-red-700')}>{value}</div>
    </div>
  )
}

export default function ProjectsPage() {
  const canManage = usePermission('projects.manage')
  const projects = useProjects()
  const objectives = useObjectives()
  const dataLoading = useDataLoading()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ItProject | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ItProject | null>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'green' | 'red' } | null>(null)

  const today = todayIso()
  const objectiveMap = useMemo(() => Object.fromEntries(objectives.map((o) => [o.id, o])), [objectives])
  const viewing = projects.find((p) => p.id === viewingId) ?? null

  const statusParam = params.get('status') as StatusFilter | null
  const statusFilter = statusParam && (statusParam === 'delayed' || statusParam in PROJECT_STATUSES) ? statusParam : null
  const objectiveFilter = params.get('objective')

  const setFilter = (key: 'status' | 'objective', value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { planned: 0, in_progress: 0, on_hold: 0, completed: 0, cancelled: 0, delayed: 0 }
    for (const p of projects) {
      c[p.status] += 1
      if (isProjectDelayed(p, today)) c.delayed += 1
    }
    return c
  }, [projects, today])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects
      .filter((p) => {
        if (statusFilter === 'delayed' ? !isProjectDelayed(p, today) : statusFilter && p.status !== statusFilter) return false
        if (objectiveFilter && p.objectiveId !== objectiveFilter) return false
        if (!q) return true
        return [p.name, p.id, p.manager ?? '', p.department ?? '', objectiveMap[p.objectiveId ?? '']?.title ?? ''].some((v) =>
          v.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => (a.endDate ?? '9999').localeCompare(b.endDate ?? '9999'))
  }, [projects, query, statusFilter, objectiveFilter, objectiveMap, today])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const totalBudget = projects.filter((p) => p.status !== 'cancelled').reduce((s, p) => s + (p.budget ?? 0), 0)

  const toggleMilestone = async (project: ItProject, index: number) => {
    const milestones = (project.milestones ?? []).map((m, i) => (i === index ? { ...m, done: !m.done } : m))
    try {
      await projectsStore.updateAsync({ ...project, milestones })
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'تعذر تحديث المرحلة', tone: 'red' })
    }
  }

  return (
    <>
      <PageHeader
        title="إدارة المشاريع"
        description="متابعة المشاريع التقنية: الجدول الزمني، نسبة الإنجاز، المراحل، المخاطر، وارتباطها بالأهداف الاستراتيجية."
        action={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              إضافة مشروع
            </Button>
          ) : undefined
        }
      />

      <section aria-label="ملخص المشاريع" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="إجمالي المشاريع" value={projects.length} />
        <StatTile label="قيد التنفيذ" value={counts.in_progress} />
        <StatTile label="متأخرة" value={counts.delayed} tone="red" />
        <StatTile label="مكتملة" value={counts.completed} />
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="text-xs font-semibold text-slate-500">إجمالي الميزانيات</div>
          <div className="mt-2 text-xl font-extrabold tabular-nums">{formatMoney(totalBudget)}</div>
        </div>
      </section>

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث باسم المشروع أو مديره أو الإدارة"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب الحالة">
          <FilterChip active={!statusFilter} onClick={() => setFilter('status', null)}>
            الكل ({projects.length})
          </FilterChip>
          {(Object.keys(PROJECT_STATUSES) as ProjectStatus[]).map((st) => (
            <FilterChip key={st} active={statusFilter === st} onClick={() => setFilter('status', st)}>
              {PROJECT_STATUSES[st].label} ({counts[st]})
            </FilterChip>
          ))}
          <FilterChip active={statusFilter === 'delayed'} onClick={() => setFilter('status', 'delayed')}>
            <AlertTriangle className="size-3.5" />
            متأخرة ({counts.delayed})
          </FilterChip>
        </div>
        {objectiveFilter && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3 py-1 font-semibold text-cobalt-deep">
              <Target className="size-4" />
              الهدف: {objectiveMap[objectiveFilter]?.title ?? objectiveFilter}
              <button
                type="button"
                aria-label="إزالة فلتر الهدف"
                className="ms-1 rounded-full hover:bg-cobalt/20"
                onClick={() => setFilter('objective', null)}
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">المشروع والهدف</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">المدير والإدارة</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold whitespace-nowrap">تاريخ الانتهاء</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الإنجاز</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الحالة والأولوية</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  <span className="sr-only">الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => {
                const delayed = isProjectDelayed(p, today)
                const obj = p.objectiveId ? objectiveMap[p.objectiveId] : undefined
                return (
                  <tr key={p.id} onClick={() => setViewingId(p.id)} className="cursor-pointer transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <FolderKanban className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="truncate text-xs text-slate-500">
                            <span className="font-mono">{p.id}</span>
                            {obj ? ` • ${obj.title}` : ' • غير مرتبط بهدف'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.manager || '—'}</div>
                      <div className="text-xs text-slate-500">{p.department || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div dir="ltr" className="text-right font-mono text-xs font-semibold whitespace-nowrap text-slate-800">
                        {p.endDate || '—'}
                      </div>
                      {delayed && <div className="text-xs font-semibold text-red-700">متأخر</div>}
                    </td>
                    <td className="px-4 py-3">
                      <MiniProgress value={p.progress} delayed={delayed} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Pill tone={PROJECT_STATUSES[p.status].tone}>{PROJECT_STATUSES[p.status].label}</Pill>
                        <Pill tone={PROJECT_PRIORITIES[p.priority].tone}>{PROJECT_PRIORITIES[p.priority].label}</Pill>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => setViewingId(p.id)}>
                          التفاصيل
                        </Button>
                        {canManage && (
                          <>
                            <IconButton label={`تعديل ${p.name}`} onClick={() => setEditing(p)}>
                              <Pencil className="size-4" />
                            </IconButton>
                            <IconButton
                              label={`حذف ${p.name}`}
                              className="hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleting(p)}
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {dataLoading && projects.length === 0 ? (
          <ListSkeleton />
        ) : (
          filtered.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold">{projects.length === 0 ? 'لا توجد مشاريع مسجلة بعد.' : 'لا توجد مشاريع تطابق البحث.'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {projects.length === 0 ? 'أضف أول مشروع تقني واربطه بهدف استراتيجي.' : 'غيّر كلمة البحث أو أزل الفلاتر.'}
              </p>
            </div>
          )
        )}

        <Pagination page={current} pageCount={pageCount} shown={rows.length} total={filtered.length} noun="مشروع" onPage={setPage} />
      </div>

      {viewing && (
        <ProjectDetailsModal
          project={viewing}
          objectiveTitle={viewing.objectiveId ? objectiveMap[viewing.objectiveId]?.title : undefined}
          canManage={canManage}
          onClose={() => setViewingId(null)}
          onToggleMilestone={(i) => toggleMilestone(viewing, i)}
          onEdit={() => {
            const target = viewing
            setViewingId(null)
            setEditing(target)
          }}
        />
      )}

      {editing && (
        <ProjectFormModal
          project={editing === 'new' ? null : editing}
          defaultObjectiveId={objectiveFilter}
          onClose={() => setEditing(null)}
          onSaved={(msg) => setToast({ msg, tone: 'green' })}
        />
      )}

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const target = deleting
          setDeleting(null)
          if (!target) return
          try {
            await projectsStore.removeAsync(target.id)
            setToast({ msg: 'تم حذف المشروع', tone: 'green' })
          } catch (err) {
            setToast({ msg: err instanceof Error ? err.message : 'تعذر حذف المشروع', tone: 'red' })
          }
        }}
      />

      <Toast message={toast?.msg ?? null} tone={toast?.tone} onClose={() => setToast(null)} />
    </>
  )
}

/* ============================ تفاصيل المشروع ============================ */

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  )
}

function ProjectDetailsModal({
  project: p,
  objectiveTitle,
  canManage,
  onClose,
  onEdit,
  onToggleMilestone,
}: {
  project: ItProject
  objectiveTitle?: string
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onToggleMilestone: (index: number) => void
}) {
  const today = todayIso()
  const delayed = isProjectDelayed(p, today)
  const milestones = p.milestones ?? []
  const risks = p.risks ?? []
  const doneCount = milestones.filter((m) => m.done).length

  return (
    <Modal
      open
      onClose={onClose}
      title={p.name}
      description={`${p.id}${objectiveTitle ? ` • الهدف: ${objectiveTitle}` : ''}`}
      footer={
        <>
          <Button onClick={onClose}>إغلاق</Button>
          {canManage && (
            <Button variant="primary" onClick={onEdit}>
              <Pencil className="size-4" />
              تعديل المشروع
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={PROJECT_STATUSES[p.status].tone}>{PROJECT_STATUSES[p.status].label}</Pill>
          <Pill tone={PROJECT_PRIORITIES[p.priority].tone}>أولوية {PROJECT_PRIORITIES[p.priority].label}</Pill>
          {delayed && <Pill tone="red">متأخر</Pill>}
        </div>

        {p.description && <p className="text-sm leading-6 text-slate-600">{p.description}</p>}

        <dl className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
          <InfoRow label="مدير المشروع">{p.manager || '—'}</InfoRow>
          <InfoRow label="الإدارة المستفيدة">{p.department || '—'}</InfoRow>
          <InfoRow label="الميزانية">{formatMoney(p.budget)}</InfoRow>
          <InfoRow label="تاريخ البداية">
            <span dir="ltr" className="font-mono">{p.startDate || '—'}</span>
          </InfoRow>
          <InfoRow label="تاريخ الانتهاء">
            <span dir="ltr" className="font-mono">{p.endDate || '—'}</span>
          </InfoRow>
          <InfoRow label="نسبة الإنجاز">
            <MiniProgress value={p.progress} delayed={delayed} />
          </InfoRow>
        </dl>

        <section>
          <h3 className="mb-2 text-sm font-bold">
            المراحل {milestones.length > 0 && <span className="font-normal text-slate-500">({doneCount} من {milestones.length})</span>}
          </h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد مراحل مسجلة.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {milestones.map((m, i) => {
                const late = !m.done && m.dueDate && m.dueDate < today
                return (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => onToggleMilestone(i)}
                      aria-label={m.done ? `إلغاء إنجاز ${m.title}` : `تعليم ${m.title} كمنجزة`}
                      className="shrink-0 rounded-full disabled:cursor-default"
                    >
                      {m.done ? (
                        <CheckCircle2 className="size-5 text-emerald-600" />
                      ) : (
                        <Circle className={cx('size-5', late ? 'text-red-500' : 'text-slate-300')} />
                      )}
                    </button>
                    <span className={cx('flex-1 text-sm', m.done && 'text-slate-400 line-through')}>{m.title}</span>
                    <span dir="ltr" className={cx('font-mono text-xs', late ? 'font-semibold text-red-700' : 'text-slate-500')}>
                      {m.dueDate || '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold">سجل المخاطر</h3>
          {risks.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد مخاطر مسجلة.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {risks.map((r, i) => {
                const sev = riskSeverity(r)
                return (
                  <li key={i} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{r.description}</p>
                      <Pill tone={sev.tone}>{sev.label}</Pill>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      الاحتمالية: {RISK_LEVELS[r.likelihood]} • الأثر: {RISK_LEVELS[r.impact]}
                    </div>
                    {r.mitigation && <p className="mt-1.5 text-xs text-slate-600">خطة المعالجة: {r.mitigation}</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {p.notes && (
          <section>
            <h3 className="mb-1 text-sm font-bold">ملاحظات</h3>
            <p className="whitespace-pre-line text-sm text-slate-600">{p.notes}</p>
          </section>
        )}
      </div>
    </Modal>
  )
}

/* ============================ نموذج المشروع ============================ */

const LEVEL_OPTIONS = (Object.keys(RISK_LEVELS) as RiskLevel[]).map((l) => ({ value: l, label: RISK_LEVELS[l] }))

function ProjectFormModal({
  project,
  defaultObjectiveId,
  onClose,
  onSaved,
}: {
  project: ItProject | null
  defaultObjectiveId: string | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const objectives = useObjectives()
  const employees = useEmployees()
  const departments = useDepartments()

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [objectiveId, setObjectiveId] = useState(project?.objectiveId ?? defaultObjectiveId ?? '')
  const [manager, setManager] = useState(project?.manager ?? '')
  const [department, setDepartment] = useState(project?.department ?? '')
  const [startDate, setStartDate] = useState(project?.startDate ?? '')
  const [endDate, setEndDate] = useState(project?.endDate ?? '')
  const [budget, setBudget] = useState(project?.budget == null ? '' : String(project.budget))
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? 'medium')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'planned')
  const [progress, setProgress] = useState(String(project?.progress ?? 0))
  const [milestones, setMilestones] = useState<Milestone[]>(project?.milestones ?? [])
  const [risks, setRisks] = useState<Risk[]>(project?.risks ?? [])
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const withCurrent = (names: string[], current: string) => {
    const list = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'ar'))
    if (current && !list.includes(current)) list.unshift(current)
    return [{ value: '', label: '— بدون تحديد —' }, ...list.map((n) => ({ value: n, label: n }))]
  }
  const managerOptions = useMemo(() => withCurrent(employees.map((e) => e.name), manager), [employees, manager])
  const departmentOptions = useMemo(() => withCurrent(departments.map((d) => d.name), department), [departments, department])
  const objectiveOptions = useMemo(
    () => [
      { value: '', label: '— غير مرتبط بهدف —' },
      ...objectives.filter((o) => o.status !== 'cancelled' || o.id === objectiveId).map((o) => ({ value: o.id, label: o.title })),
    ],
    [objectives, objectiveId],
  )

  const updateMilestone = (i: number, patch: Partial<Milestone>) =>
    setMilestones((list) => list.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  const updateRisk = (i: number, patch: Partial<Risk>) => setRisks((list) => list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'يرجى إدخال اسم المشروع'
    if (startDate && endDate && endDate < startDate) next.endDate = 'تاريخ الانتهاء قبل تاريخ البداية'
    const prog = Number(progress)
    if (!Number.isInteger(prog) || prog < 0 || prog > 100) next.progress = 'أدخل رقماً من 0 إلى 100'
    if (budget.trim() !== '' && (Number.isNaN(Number(budget)) || Number(budget) < 0)) next.budget = 'قيمة غير صحيحة'
    milestones.forEach((m, i) => {
      if (!m.title.trim()) next[`ms${i}`] = 'اسم المرحلة مطلوب'
    })
    risks.forEach((r, i) => {
      if (!r.description.trim()) next[`rk${i}`] = 'وصف الخطر مطلوب'
    })
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const payload: Omit<ItProject, 'id'> = {
      name: name.trim(),
      description: description.trim() || null,
      objectiveId: objectiveId || null,
      manager: manager || null,
      department: department || null,
      startDate: startDate || null,
      endDate: endDate || null,
      budget: budget.trim() === '' ? null : Number(budget),
      priority,
      status,
      progress: status === 'completed' ? 100 : prog,
      milestones: milestones.map((m) => ({ title: m.title.trim(), dueDate: m.dueDate || null, done: Boolean(m.done) })),
      risks: risks.map((r) => ({ ...r, description: r.description.trim(), mitigation: r.mitigation?.trim() || null })),
      notes: notes.trim() || null,
    }

    setSaving(true)
    setServerError(null)
    try {
      if (project) {
        await projectsStore.updateAsync({ ...payload, id: project.id })
        onSaved('تم حفظ تعديلات المشروع')
      } else {
        await projectsStore.addAsync(payload)
        onSaved('تمت إضافة المشروع')
      }
      onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'تعذر حفظ المشروع')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={project ? `تعديل المشروع: ${project.name}` : 'إضافة مشروع تقني'}
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="project-form" variant="primary" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : project ? 'حفظ التعديلات' : 'إضافة المشروع'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {serverError}
          </p>
        )}

        <Field label="اسم المشروع" error={errors.name}>
          {(id, d) => (
            <TextInput
              id={id}
              aria-describedby={d}
              aria-invalid={Boolean(errors.name)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ترقية الجدار الناري لمقر الشركة"
              autoFocus
            />
          )}
        </Field>

        <Field label="الوصف">
          {(id) => <textarea id={id} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={textareaCls} />}
        </Field>

        <Field label="الهدف الاستراتيجي المرتبط">
          {(id) => (
            <SearchableSelect id={id} value={objectiveId} onChange={setObjectiveId} options={objectiveOptions} searchPlaceholder="ابحث عن هدف..." />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="مدير المشروع">
            {(id) => (
              <SearchableSelect id={id} value={manager} onChange={setManager} options={managerOptions} searchPlaceholder="ابحث عن اسم الموظف..." />
            )}
          </Field>
          <Field label="الإدارة المستفيدة">
            {(id) => (
              <SearchableSelect id={id} value={department} onChange={setDepartment} options={departmentOptions} searchPlaceholder="ابحث عن إدارة..." />
            )}
          </Field>
          <Field label="تاريخ البداية">
            {(id) => <TextInput id={id} type="date" dir="ltr" value={startDate} onChange={(e) => setStartDate(e.target.value)} />}
          </Field>
          <Field label="تاريخ الانتهاء" error={errors.endDate}>
            {(id, d) => (
              <TextInput
                id={id}
                type="date"
                dir="ltr"
                aria-describedby={d}
                aria-invalid={Boolean(errors.endDate)}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            )}
          </Field>
          <Field label="الحالة">
            {(id) => (
              <SelectInput
                id={id}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                options={(Object.keys(PROJECT_STATUSES) as ProjectStatus[]).map((s) => ({ value: s, label: PROJECT_STATUSES[s].label }))}
              />
            )}
          </Field>
          <Field label="الأولوية">
            {(id) => (
              <SelectInput
                id={id}
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                options={(Object.keys(PROJECT_PRIORITIES) as ProjectPriority[]).map((s) => ({ value: s, label: PROJECT_PRIORITIES[s].label }))}
              />
            )}
          </Field>
          <Field label="نسبة الإنجاز (%)" error={errors.progress} hint={status === 'completed' ? 'تُحفظ 100% تلقائياً للمشروع المكتمل' : undefined}>
            {(id, d) => (
              <TextInput
                id={id}
                type="number"
                min={0}
                max={100}
                dir="ltr"
                aria-describedby={d}
                aria-invalid={Boolean(errors.progress)}
                value={status === 'completed' ? '100' : progress}
                disabled={status === 'completed'}
                onChange={(e) => setProgress(e.target.value)}
              />
            )}
          </Field>
          <Field label="الميزانية (د.ل)" error={errors.budget}>
            {(id, d) => (
              <TextInput
                id={id}
                type="number"
                min={0}
                dir="ltr"
                aria-describedby={d}
                aria-invalid={Boolean(errors.budget)}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            )}
          </Field>
        </div>

        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-800">المراحل (Milestones)</legend>
          <div className="flex flex-col gap-2">
            {milestones.map((m, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label="منجزة"
                    checked={Boolean(m.done)}
                    onChange={(e) => updateMilestone(i, { done: e.target.checked })}
                    className="size-4 shrink-0 accent-emerald-600"
                  />
                  <TextInput
                    aria-label="اسم المرحلة"
                    placeholder="اسم المرحلة"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, { title: e.target.value })}
                  />
                  <TextInput
                    aria-label="تاريخ الاستحقاق"
                    type="date"
                    dir="ltr"
                    className="w-40 shrink-0"
                    value={m.dueDate ?? ''}
                    onChange={(e) => updateMilestone(i, { dueDate: e.target.value })}
                  />
                  <IconButton
                    label="إزالة المرحلة"
                    className="hover:bg-red-50 hover:text-red-700"
                    onClick={() => setMilestones((list) => list.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" />
                  </IconButton>
                </div>
                {errors[`ms${i}`] && <p className="mt-1 text-xs font-medium text-red-700">{errors[`ms${i}`]}</p>}
              </div>
            ))}
          </div>
          <Button className="mt-3 h-9 text-xs" onClick={() => setMilestones((list) => [...list, { title: '', dueDate: '', done: false }])}>
            <Plus className="size-4" />
            إضافة مرحلة
          </Button>
        </fieldset>

        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-800">المخاطر</legend>
          <div className="flex flex-col gap-3">
            {risks.map((r, i) => (
              <div key={i} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <TextInput
                      aria-label="وصف الخطر"
                      placeholder="وصف الخطر"
                      className="sm:col-span-2"
                      value={r.description}
                      onChange={(e) => updateRisk(i, { description: e.target.value })}
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      الاحتمالية
                      <SelectInput value={r.likelihood} onChange={(e) => updateRisk(i, { likelihood: e.target.value as RiskLevel })} options={LEVEL_OPTIONS} />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      الأثر
                      <SelectInput value={r.impact} onChange={(e) => updateRisk(i, { impact: e.target.value as RiskLevel })} options={LEVEL_OPTIONS} />
                    </label>
                    <TextInput
                      aria-label="خطة المعالجة"
                      placeholder="خطة المعالجة (اختياري)"
                      className="sm:col-span-2"
                      value={r.mitigation ?? ''}
                      onChange={(e) => updateRisk(i, { mitigation: e.target.value })}
                    />
                  </div>
                  <IconButton
                    label="إزالة الخطر"
                    className="hover:bg-red-50 hover:text-red-700"
                    onClick={() => setRisks((list) => list.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" />
                  </IconButton>
                </div>
                {errors[`rk${i}`] && <p className="mt-1 text-xs font-medium text-red-700">{errors[`rk${i}`]}</p>}
              </div>
            ))}
          </div>
          <Button
            className="mt-3 h-9 text-xs"
            onClick={() => setRisks((list) => [...list, { description: '', likelihood: 'medium', impact: 'medium', mitigation: '' }])}
          >
            <Plus className="size-4" />
            إضافة خطر
          </Button>
        </fieldset>

        <Field label="ملاحظات">
          {(id) => <textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />}
        </Field>
      </form>
    </Modal>
  )
}
