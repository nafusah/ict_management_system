import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange, FolderKanban, Pencil, Plus, Target, Trash2, UserRound, X } from 'lucide-react'
import {
  Button,
  ConfirmDelete,
  Field,
  FilterChip,
  IconButton,
  Modal,
  PageHeader,
  Pill,
  SearchableSelect,
  SelectInput,
  TextInput,
  Toast,
  cx,
} from '../../shared/components/ui'
import { CardGridSkeleton } from '../../shared/components/Skeleton'
import { usePermission } from '../../shared/data/auth'
import { useDataLoading, useEmployees } from '../../shared/data/store'
import {
  OBJECTIVE_STATUSES,
  kpiAchievement,
  objectiveProgress,
  objectivesStore,
  progressTone,
  useObjectives,
  useProjects,
} from './governanceStore'
import type { Kpi, ObjectiveStatus, StrategicObjective } from './governanceStore'

function ProgressBar({ value, tone }: { value: number; tone: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx('h-full rounded-full transition-all', tone)} style={{ width: `${value}%` }} />
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

export default function StrategyPage() {
  const canManage = usePermission('strategy.manage')
  const canViewProjects = usePermission(['projects.view', 'projects.manage'])
  const objectives = useObjectives()
  const projects = useProjects()
  const dataLoading = useDataLoading()

  const [statusFilter, setStatusFilter] = useState<ObjectiveStatus | null>(null)
  const [editing, setEditing] = useState<StrategicObjective | 'new' | null>(null)
  const [deleting, setDeleting] = useState<StrategicObjective | null>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'green' | 'red' } | null>(null)

  const progressMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of objectives) map[o.id] = objectiveProgress(o, projects)
    return map
  }, [objectives, projects])

  const projectCount = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of projects) if (p.objectiveId) map[p.objectiveId] = (map[p.objectiveId] ?? 0) + 1
    return map
  }, [projects])

  const visible = useMemo(
    () =>
      objectives
        .filter((o) => !statusFilter || o.status === statusFilter)
        .sort((a, b) => a.startYear - b.startYear || a.id.localeCompare(b.id)),
    [objectives, statusFilter],
  )

  const active = objectives.filter((o) => o.status !== 'cancelled')
  const avgProgress = active.length
    ? Math.round(active.reduce((s, o) => s + (progressMap[o.id] ?? 0), 0) / active.length)
    : 0
  const allKpis = active.flatMap((o) => o.kpis ?? [])
  const kpisOnTrack = allKpis.filter((k) => kpiAchievement(k) >= 70).length
  const years = active.length
    ? `${Math.min(...active.map((o) => o.startYear))} – ${Math.max(...active.map((o) => o.endYear))}`
    : '—'

  return (
    <>
      <PageHeader
        title="الاستراتيجية التقنية"
        description="الأهداف الاستراتيجية لإدارة الاتصالات وتقنية المعلومات، ومؤشرات قياس أدائها، والمشاريع التي تحققها."
        action={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              إضافة هدف استراتيجي
            </Button>
          ) : undefined
        }
      />

      <section aria-label="ملخص الاستراتيجية" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="الأهداف الاستراتيجية" value={active.length} hint={`الفترة: ${years}`} />
        <StatTile label="متوسط الإنجاز" value={`${avgProgress}%`} hint="محسوب من المشاريع ومؤشرات الأداء" />
        <StatTile label="مؤشرات الأداء" value={allKpis.length} hint={`${kpisOnTrack} منها بنسبة تحقق 70% فأكثر`} />
        <StatTile
          label="المشاريع المرتبطة"
          value={projects.filter((p) => p.objectiveId).length}
          hint={`من أصل ${projects.length} مشروع`}
        />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب الحالة">
        <FilterChip active={!statusFilter} onClick={() => setStatusFilter(null)}>
          الكل ({objectives.length})
        </FilterChip>
        {(Object.keys(OBJECTIVE_STATUSES) as ObjectiveStatus[]).map((st) => (
          <FilterChip key={st} active={statusFilter === st} onClick={() => setStatusFilter(st)}>
            {OBJECTIVE_STATUSES[st].label} ({objectives.filter((o) => o.status === st).length})
          </FilterChip>
        ))}
      </div>

      {dataLoading && objectives.length === 0 ? (
        <CardGridSkeleton count={4} className="lg:grid-cols-2" />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Target className="mx-auto mb-3 size-10 text-slate-300" />
          <p className="font-semibold">
            {objectives.length === 0 ? 'لم تُسجَّل أهداف استراتيجية بعد.' : 'لا توجد أهداف بهذه الحالة.'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {objectives.length === 0
              ? 'ابدأ بإضافة أول هدف، مثل: "رفع جاهزية البنية التحتية" أو "التحول الرقمي للخدمات".'
              : 'اختر حالة أخرى من الفلاتر.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((o) => {
            const pct = progressMap[o.id] ?? 0
            const count = projectCount[o.id] ?? 0
            const kpis = o.kpis ?? []
            return (
              <article key={o.id} className="flex flex-col rounded-xl border border-slate-200 bg-white">
                <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Target className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{o.title}</h2>
                      <Pill tone={OBJECTIVE_STATUSES[o.status].tone}>{OBJECTIVE_STATUSES[o.status].label}</Pill>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {o.pillar && <span>المحور: {o.pillar}</span>}
                      <span className="inline-flex items-center gap-1">
                        <CalendarRange className="size-3.5" />
                        <span dir="ltr">
                          {o.startYear} – {o.endYear}
                        </span>
                      </span>
                      {o.owner && (
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="size-3.5" />
                          {o.owner}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <IconButton label={`تعديل ${o.title}`} onClick={() => setEditing(o)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton
                        label={`حذف ${o.title}`}
                        className="hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleting(o)}
                      >
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  )}
                </header>

                <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                  {o.description && <p className="text-sm leading-6 text-slate-600">{o.description}</p>}

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">نسبة الإنجاز</span>
                      <span className="font-bold tabular-nums">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} tone={progressTone(pct)} />
                  </div>

                  {kpis.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold text-slate-600">مؤشرات الأداء (KPIs)</div>
                      <ul className="flex flex-col gap-2.5">
                        {kpis.map((k, i) => {
                          const ach = kpiAchievement(k)
                          return (
                            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium text-slate-800">{k.name}</span>
                                <span className="shrink-0 text-xs text-slate-500" dir="ltr">
                                  <strong className="text-slate-900">
                                    {k.current ?? '—'}
                                    {k.unit ?? ''}
                                  </strong>{' '}
                                  / {k.target}
                                  {k.unit ?? ''}
                                </span>
                              </div>
                              <div className="mt-1.5">
                                <ProgressBar value={ach} tone={progressTone(ach)} />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FolderKanban className="size-4" />
                    {count === 0 ? 'لا توجد مشاريع مرتبطة' : `${count} مشروع مرتبط`}
                  </span>
                  {canViewProjects && count > 0 && (
                    <Link
                      to={`/governance/projects?objective=${encodeURIComponent(o.id)}`}
                      className="font-semibold text-cobalt hover:underline"
                    >
                      عرض المشاريع
                    </Link>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}

      {editing && (
        <ObjectiveFormModal
          objective={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => setToast({ msg, tone: 'green' })}
        />
      )}

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.title ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const target = deleting
          setDeleting(null)
          if (!target) return
          try {
            await objectivesStore.removeAsync(target.id)
            setToast({ msg: 'تم حذف الهدف الاستراتيجي', tone: 'green' })
          } catch (err) {
            setToast({ msg: err instanceof Error ? err.message : 'تعذر حذف الهدف', tone: 'red' })
          }
        }}
      />

      <Toast message={toast?.msg ?? null} tone={toast?.tone} onClose={() => setToast(null)} duration={toast?.tone === 'red' ? 5000 : 3000} />
    </>
  )
}

/* ============================ نموذج الهدف ============================ */

type KpiDraft = { name: string; unit: string; baseline: string; current: string; target: string }

const toNum = (v: string): number | null => (v.trim() === '' ? null : Number(v))

function ObjectiveFormModal({
  objective,
  onClose,
  onSaved,
}: {
  objective: StrategicObjective | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const employees = useEmployees()
  const year = new Date().getFullYear()
  const [title, setTitle] = useState(objective?.title ?? '')
  const [description, setDescription] = useState(objective?.description ?? '')
  const [pillar, setPillar] = useState(objective?.pillar ?? '')
  const [startYear, setStartYear] = useState(String(objective?.startYear ?? year))
  const [endYear, setEndYear] = useState(String(objective?.endYear ?? year + 2))
  const [owner, setOwner] = useState(objective?.owner ?? '')
  const [status, setStatus] = useState<ObjectiveStatus>(objective?.status ?? 'active')
  const [kpis, setKpis] = useState<KpiDraft[]>(
    (objective?.kpis ?? []).map((k) => ({
      name: k.name,
      unit: k.unit ?? '',
      baseline: k.baseline == null ? '' : String(k.baseline),
      current: k.current == null ? '' : String(k.current),
      target: String(k.target),
    })),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const ownerOptions = useMemo(() => {
    const names = Array.from(new Set(employees.map((e) => e.name))).sort((a, b) => a.localeCompare(b, 'ar'))
    if (owner && !names.includes(owner)) names.unshift(owner)
    return [{ value: '', label: '— بدون تحديد —' }, ...names.map((n) => ({ value: n, label: n }))]
  }, [employees, owner])

  const updateKpi = (i: number, patch: Partial<KpiDraft>) =>
    setKpis((list) => list.map((k, idx) => (idx === i ? { ...k, ...patch } : k)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'يرجى إدخال عنوان الهدف'
    const sy = Number(startYear)
    const ey = Number(endYear)
    if (!Number.isInteger(sy) || sy < 2000 || sy > 2100) next.startYear = 'سنة غير صحيحة'
    if (!Number.isInteger(ey) || ey < 2000 || ey > 2100) next.endYear = 'سنة غير صحيحة'
    else if (ey < sy) next.endYear = 'يجب أن تكون سنة النهاية بعد سنة البداية'
    kpis.forEach((k, i) => {
      if (!k.name.trim()) next[`kpi${i}`] = 'اسم المؤشر مطلوب'
      else if (k.target.trim() === '' || Number.isNaN(Number(k.target))) next[`kpi${i}`] = 'القيمة المستهدفة مطلوبة'
      else if ([k.baseline, k.current].some((v) => v.trim() !== '' && Number.isNaN(Number(v))))
        next[`kpi${i}`] = 'القيم يجب أن تكون أرقاماً'
    })
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const payload: Omit<StrategicObjective, 'id'> = {
      title: title.trim(),
      description: description.trim() || null,
      pillar: pillar.trim() || null,
      startYear: sy,
      endYear: ey,
      owner: owner || null,
      status,
      kpis: kpis.map(
        (k): Kpi => ({
          name: k.name.trim(),
          unit: k.unit.trim() || null,
          baseline: toNum(k.baseline),
          current: toNum(k.current),
          target: Number(k.target),
        }),
      ),
    }

    setSaving(true)
    setServerError(null)
    try {
      if (objective) {
        await objectivesStore.updateAsync({ ...payload, id: objective.id })
        onSaved('تم حفظ تعديلات الهدف')
      } else {
        await objectivesStore.addAsync(payload)
        onSaved('تمت إضافة الهدف الاستراتيجي')
      }
      onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'تعذر حفظ الهدف')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={objective ? `تعديل الهدف: ${objective.title}` : 'إضافة هدف استراتيجي'}
      description="حدّد الهدف وفترته ومؤشرات قياس تحقيقه."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="objective-form" variant="primary" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : objective ? 'حفظ التعديلات' : 'إضافة الهدف'}
          </Button>
        </>
      }
    >
      <form id="objective-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {serverError}
          </p>
        )}

        <Field label="عنوان الهدف" error={errors.title}>
          {(id, d) => (
            <TextInput
              id={id}
              aria-describedby={d}
              aria-invalid={Boolean(errors.title)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رفع جاهزية البنية التحتية التقنية"
              autoFocus
            />
          )}
        </Field>

        <Field label="الوصف">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:ring-2 focus:ring-signal/60 focus:outline-none"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المحور الاستراتيجي" hint="مثل: البنية التحتية، الأمن السيبراني، التحول الرقمي">
            {(id, d) => (
              <TextInput id={id} aria-describedby={d} value={pillar} onChange={(e) => setPillar(e.target.value)} />
            )}
          </Field>
          <Field label="الحالة">
            {(id) => (
              <SelectInput
                id={id}
                value={status}
                onChange={(e) => setStatus(e.target.value as ObjectiveStatus)}
                options={(Object.keys(OBJECTIVE_STATUSES) as ObjectiveStatus[]).map((s) => ({
                  value: s,
                  label: OBJECTIVE_STATUSES[s].label,
                }))}
              />
            )}
          </Field>
          <Field label="سنة البداية" error={errors.startYear}>
            {(id, d) => (
              <TextInput
                id={id}
                type="number"
                dir="ltr"
                aria-describedby={d}
                aria-invalid={Boolean(errors.startYear)}
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
              />
            )}
          </Field>
          <Field label="سنة النهاية" error={errors.endYear}>
            {(id, d) => (
              <TextInput
                id={id}
                type="number"
                dir="ltr"
                aria-describedby={d}
                aria-invalid={Boolean(errors.endYear)}
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="المسؤول عن الهدف">
          {(id) => (
            <SearchableSelect
              id={id}
              value={owner}
              onChange={setOwner}
              options={ownerOptions}
              searchPlaceholder="ابحث عن اسم الموظف..."
            />
          )}
        </Field>

        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-800">مؤشرات الأداء (KPIs)</legend>
          {kpis.length === 0 && (
            <p className="mb-3 text-xs text-slate-500">
              أضف مؤشراً لقياس الهدف، مثل: نسبة توفر الأنظمة (%) أو عدد الخدمات المؤتمتة.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {kpis.map((k, i) => (
              <div key={i} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-6">
                    <TextInput
                      aria-label="اسم المؤشر"
                      placeholder="اسم المؤشر"
                      className="sm:col-span-6"
                      value={k.name}
                      onChange={(e) => updateKpi(i, { name: e.target.value })}
                    />
                    <TextInput
                      aria-label="الوحدة"
                      placeholder="الوحدة (%)"
                      className="sm:col-span-1"
                      value={k.unit}
                      onChange={(e) => updateKpi(i, { unit: e.target.value })}
                    />
                    <TextInput
                      aria-label="خط الأساس"
                      placeholder="خط الأساس"
                      type="number"
                      dir="ltr"
                      className="sm:col-span-5 lg:col-span-5"
                      value={k.baseline}
                      onChange={(e) => updateKpi(i, { baseline: e.target.value })}
                    />
                    <TextInput
                      aria-label="القيمة الحالية"
                      placeholder="الحالية"
                      type="number"
                      dir="ltr"
                      className="sm:col-span-3"
                      value={k.current}
                      onChange={(e) => updateKpi(i, { current: e.target.value })}
                    />
                    <TextInput
                      aria-label="القيمة المستهدفة"
                      placeholder="المستهدفة"
                      type="number"
                      dir="ltr"
                      className="sm:col-span-3"
                      value={k.target}
                      onChange={(e) => updateKpi(i, { target: e.target.value })}
                    />
                  </div>
                  <IconButton
                    label="إزالة المؤشر"
                    className="hover:bg-red-50 hover:text-red-700"
                    onClick={() => setKpis((list) => list.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" />
                  </IconButton>
                </div>
                {errors[`kpi${i}`] && <p className="mt-1.5 text-xs font-medium text-red-700">{errors[`kpi${i}`]}</p>}
              </div>
            ))}
          </div>
          <Button
            className="mt-3 h-9 text-xs"
            onClick={() => setKpis((list) => [...list, { name: '', unit: '', baseline: '', current: '', target: '' }])}
          >
            <Plus className="size-4" />
            إضافة مؤشر
          </Button>
        </fieldset>
      </form>
    </Modal>
  )
}
