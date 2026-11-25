import {
  CLASSIFICATIONS,
  DEVICE_KINDS,
  DEVICE_LOCATIONS,
  INK_COLORS,
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  daysUntilExpiry,
  getSubscriptionStatus,
  isLowStock,
} from '../../shared/data/types'
import type {
  Device,
  DeviceTypeItem,
  Ink,
  InkColorItem,
  InkDispense,
  PrinterTypeItem,
  Subscription,
  SubscriptionCategoryItem,
  SubscriptionStatus,
} from '../../shared/data/types'
import {
  OBJECTIVE_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  RISK_LEVELS,
  formatMoney,
  isProjectDelayed,
  kpiAchievement,
  objectiveProgress,
  riskSeverity,
  todayIso,
} from '../governance/governanceStore'
import type { ItProject, ProjectStatus, StrategicObjective } from '../governance/governanceStore'
import type { CellTone, ReportCell, ReportDoc } from './reportPrint'

export type ReportSection = 'devices' | 'inks' | 'subscriptions' | 'governance'

/** جزء التقرير الذي يُبنى من البيانات (الترويسة والمرجع يضيفهما الصفحة). */
export type ReportBody = Omit<ReportDoc, 'reference' | 'generatedBy' | 'section'> & { rowCount: number }

const ALL = '__all__'
export { ALL }

const pct = (n: number) => `${n}%`
const countBy = <T,>(items: T[], key: (t: T) => string) => {
  const map = new Map<string, number>()
  for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + 1)
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

/* ============================ الأجهزة ============================ */

export interface DeviceFilters {
  department: string
  kind: string
  classification: string
}

export function buildDevicesReport(devices: Device[], types: DeviceTypeItem[], f: DeviceFilters): ReportBody {
  const typeLabel = (k: string) =>
    types.find((t) => t.id === k)?.label ?? DEVICE_KINDS[k as keyof typeof DEVICE_KINDS]?.label ?? k
  const list = devices
    .filter(
      (d) =>
        (f.department === ALL || d.department === f.department) &&
        (f.kind === ALL || d.kind === f.kind) &&
        (f.classification === ALL || d.classification === f.classification),
    )
    .sort((a, b) => a.department.localeCompare(b.department, 'ar') || typeLabel(a.kind).localeCompare(typeLabel(b.kind), 'ar'))

  const filters = [
    f.department === ALL ? 'كل الإدارات' : f.department,
    f.kind === ALL ? 'كل الأنواع' : typeLabel(f.kind),
    f.classification === ALL ? 'شخصي وجماعي' : CLASSIFICATIONS[f.classification as keyof typeof CLASSIFICATIONS].label,
  ].join(' • ')

  return {
    title: 'تقرير الأجهزة',
    filters,
    landscape: true,
    rowCount: list.length,
    summary: [
      { label: 'إجمالي الأجهزة', value: list.length },
      { label: 'عهدة شخصية', value: list.filter((d) => d.classification === 'personal').length },
      { label: 'أجهزة جماعية', value: list.filter((d) => d.classification === 'shared').length },
      { label: 'عدد الإدارات', value: new Set(list.map((d) => d.department)).size },
    ],
    tables: [
      {
        title: 'توزيع الأجهزة حسب النوع',
        columns: [{ label: 'النوع' }, { label: 'العدد' }],
        rows: countBy(list, (d) => typeLabel(d.kind)).map(([k, n]) => [k, n]),
      },
      {
        title: 'توزيع الأجهزة حسب الإدارة',
        columns: [{ label: 'الإدارة' }, { label: 'العدد' }],
        rows: countBy(list, (d) => d.department || '—').map(([k, n]) => [k, n]),
      },
      {
        title: 'سجل الأجهزة',
        columns: [
          { label: 'رقم الجهاز', ltr: true },
          { label: 'اسم الجهاز' },
          { label: 'النوع' },
          { label: 'الماركة' },
          { label: 'الرقم التسلسلي', ltr: true },
          { label: 'الإدارة' },
          { label: 'الموظف' },
          { label: 'التصنيف' },
          { label: 'الموقع' },
        ],
        rows: list.map((d) => [
          d.id,
          { text: d.name, bold: true },
          typeLabel(d.kind),
          d.brand,
          d.serialNumber,
          d.department,
          d.employee,
          CLASSIFICATIONS[d.classification]?.label ?? d.classification,
          d.location ? DEVICE_LOCATIONS[d.location].label : '—',
        ]),
        empty: 'لا توجد أجهزة مطابقة',
      },
    ],
  }
}

/* ============================ الأحبار ============================ */

export interface InkFilters {
  from: string
  to: string
  lowOnly: boolean
}

export function buildInksReport(
  inks: Ink[],
  dispenses: InkDispense[],
  printerTypes: PrinterTypeItem[],
  colors: InkColorItem[],
  f: InkFilters,
): ReportBody {
  const colorName = (c: string) => colors.find((x) => x.id === c)?.name ?? INK_COLORS[c]?.name ?? c
  const printerName = (id?: string | null) => printerTypes.find((p) => p.id === id)?.name ?? '—'
  const inkMap = new Map(inks.map((i) => [i.id, i]))

  const stock = inks
    .filter((i) => !f.lowOnly || isLowStock(i))
    .sort((a, b) => Number(isLowStock(b)) - Number(isLowStock(a)) || a.model.localeCompare(b.model))
  const period = dispenses.filter((d) => d.date.slice(0, 10) >= f.from && d.date.slice(0, 10) <= f.to)
  const dispensedQty = period.reduce((s, d) => s + d.quantity, 0)

  const byDept = new Map<string, { ops: number; qty: number }>()
  for (const d of period) {
    const cur = byDept.get(d.department) ?? { ops: 0, qty: 0 }
    byDept.set(d.department, { ops: cur.ops + 1, qty: cur.qty + d.quantity })
  }
  const byInk = new Map<string, number>()
  for (const d of period) byInk.set(d.inkId, (byInk.get(d.inkId) ?? 0) + d.quantity)

  return {
    title: 'تقرير الأحبار',
    filters: `فترة الصرف: ${f.from} إلى ${f.to}${f.lowOnly ? ' • الأصناف المنخفضة فقط' : ''}`,
    rowCount: stock.length + period.length,
    summary: [
      { label: 'أصناف الأحبار', value: stock.length },
      { label: 'الخراطيش في المخزون', value: stock.reduce((s, i) => s + i.quantity, 0) },
      { label: 'أصناف منخفضة المخزون', value: stock.filter(isLowStock).length, tone: stock.some(isLowStock) ? 'red' : undefined },
      { label: 'خراطيش مصروفة في الفترة', value: dispensedQty },
    ],
    tables: [
      {
        title: 'مخزون الأحبار',
        columns: [{ label: 'الموديل', ltr: true }, { label: 'الماركة' }, { label: 'اللون' }, { label: 'الطابعة' }, { label: 'الكمية' }, { label: 'حد التنبيه' }, { label: 'الحالة' }],
        rows: stock.map((i) => [
          { text: i.model, bold: true, ltr: true },
          i.brand,
          colorName(i.color),
          printerName(i.printerTypeId),
          { text: i.quantity, bold: true },
          i.alertThreshold,
          isLowStock(i) ? { text: 'منخفض', tone: 'red' } : { text: 'متوفر', tone: 'green' },
        ]),
        empty: 'لا توجد أصناف',
      },
      {
        title: 'الصرف حسب الإدارة خلال الفترة',
        columns: [{ label: 'الإدارة' }, { label: 'عدد عمليات الصرف' }, { label: 'عدد الخراطيش' }],
        rows: [...byDept.entries()].sort((a, b) => b[1].qty - a[1].qty).map(([dep, v]) => [dep, v.ops, { text: v.qty, bold: true }]),
        footer: ['الإجمالي', period.length, dispensedQty],
        empty: 'لا توجد عمليات صرف في هذه الفترة',
      },
      {
        title: 'الأصناف الأكثر صرفاً خلال الفترة',
        columns: [{ label: 'الموديل', ltr: true }, { label: 'اللون' }, { label: 'الكمية المصروفة' }, { label: 'المتبقي في المخزون' }],
        rows: [...byInk.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([id, qty]) => {
            const ink = inkMap.get(id)
            return [ink?.model ?? id, ink ? colorName(ink.color) : '—', { text: qty, bold: true }, ink?.quantity ?? '—']
          }),
        empty: 'لا توجد عمليات صرف في هذه الفترة',
      },
    ],
  }
}

/* ============================ الاشتراكات ============================ */

export interface SubscriptionFilters {
  status: string
  category: string
}

const SUB_TONE: Record<SubscriptionStatus, CellTone> = { active: 'green', expiring: 'amber', expired: 'red', cancelled: 'slate' }

export function buildSubscriptionsReport(subs: Subscription[], categories: SubscriptionCategoryItem[], f: SubscriptionFilters): ReportBody {
  const catName = (c: string) => categories.find((x) => x.id === c)?.name ?? SUBSCRIPTION_CATEGORIES[c]?.label ?? c
  const list = subs
    .filter((s) => (f.status === ALL || getSubscriptionStatus(s) === f.status) && (f.category === ALL || s.category === f.category))
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
  const statusCount = (st: SubscriptionStatus) => list.filter((s) => getSubscriptionStatus(s) === st).length

  return {
    title: 'تقرير الاشتراكات والتراخيص',
    filters: [
      f.status === ALL ? 'كل الحالات' : SUBSCRIPTION_STATUSES[f.status as SubscriptionStatus].label,
      f.category === ALL ? 'كل التصنيفات' : catName(f.category),
    ].join(' • '),
    landscape: true,
    rowCount: list.length,
    summary: [
      { label: 'إجمالي الاشتراكات', value: list.length },
      { label: 'نشط', value: statusCount('active'), tone: 'green' },
      { label: 'قارب الانتهاء', value: statusCount('expiring'), tone: statusCount('expiring') ? 'amber' : undefined },
      { label: 'منتهي', value: statusCount('expired'), tone: statusCount('expired') ? 'red' : undefined },
      { label: 'ملغي', value: statusCount('cancelled') },
    ],
    tables: [
      {
        title: 'الاشتراكات حسب التصنيف',
        columns: [{ label: 'التصنيف' }, { label: 'العدد' }],
        rows: countBy(list, (s) => catName(s.category)).map(([k, n]) => [k, n]),
      },
      {
        title: 'سجل الاشتراكات والتراخيص',
        columns: [
          { label: 'الخدمة' },
          { label: 'المزود' },
          { label: 'التصنيف' },
          { label: 'الإدارة / الموقع' },
          { label: 'أمر الشراء', ltr: true },
          { label: 'تاريخ البداية', ltr: true },
          { label: 'تاريخ الانتهاء', ltr: true },
          { label: 'المتبقي' },
          { label: 'الحالة' },
        ],
        rows: list.map((s): ReportCell[] => {
          const st = getSubscriptionStatus(s)
          const days = daysUntilExpiry(s.endDate)
          return [
            { text: s.serviceName, bold: true },
            s.provider,
            catName(s.category),
            [s.department, s.serviceLocation].filter(Boolean).join(' / '),
            s.poNumber,
            s.startDate ?? '—',
            s.endDate,
            st === 'cancelled' ? '—' : days < 0 ? { text: `منتهي منذ ${-days} يوم`, tone: 'red' } : `${days} يوم`,
            { text: SUBSCRIPTION_STATUSES[st].label, tone: SUB_TONE[st] },
          ]
        }),
        empty: 'لا توجد اشتراكات مطابقة',
      },
    ],
  }
}

/* ============================ التخطيط والحوكمة ============================ */

export interface GovernanceFilters {
  objective: string
  projectStatus: string
}

export function buildGovernanceReport(objectives: StrategicObjective[], projects: ItProject[], f: GovernanceFilters): ReportBody {
  const today = todayIso()
  const objs = objectives.filter((o) => f.objective === ALL || o.id === f.objective)
  const objIds = new Set(objs.map((o) => o.id))
  const prjs = projects
    .filter((p) => f.objective === ALL || (p.objectiveId && objIds.has(p.objectiveId)))
    .filter((p) => f.projectStatus === ALL || (f.projectStatus === 'delayed' ? isProjectDelayed(p, today) : p.status === f.projectStatus))
    .sort((a, b) => (a.endDate ?? '9999').localeCompare(b.endDate ?? '9999'))
  const objTitle = (id?: string | null) => objectives.find((o) => o.id === id)?.title ?? 'غير مرتبط'
  const activeObjs = objs.filter((o) => o.status !== 'cancelled')
  const avg = activeObjs.length ? Math.round(activeObjs.reduce((s, o) => s + objectiveProgress(o, projects), 0) / activeObjs.length) : 0
  const delayed = prjs.filter((p) => isProjectDelayed(p, today)).length
  const risks = prjs.flatMap((p) => (p.risks ?? []).map((r) => ({ p, r, sev: riskSeverity(r) }))).sort((a, b) => b.sev.score - a.sev.score)

  const statusLabel =
    f.projectStatus === ALL ? 'كل المشاريع' : f.projectStatus === 'delayed' ? 'المشاريع المتأخرة' : PROJECT_STATUSES[f.projectStatus as ProjectStatus].label

  return {
    title: 'تقرير التخطيط والحوكمة التقنية',
    filters: `${f.objective === ALL ? 'كل الأهداف' : objTitle(f.objective)} • ${statusLabel}`,
    landscape: true,
    rowCount: objs.length + prjs.length,
    summary: [
      { label: 'الأهداف الاستراتيجية', value: activeObjs.length },
      { label: 'متوسط إنجاز الأهداف', value: pct(avg) },
      { label: 'المشاريع', value: prjs.length },
      { label: 'المشاريع المتأخرة', value: delayed, tone: delayed ? 'red' : undefined },
      { label: 'إجمالي الميزانيات', value: formatMoney(prjs.filter((p) => p.status !== 'cancelled').reduce((s, p) => s + (p.budget ?? 0), 0)) },
    ],
    tables: [
      {
        title: 'الأهداف الاستراتيجية',
        columns: [{ label: 'الهدف' }, { label: 'المحور' }, { label: 'الفترة', ltr: true }, { label: 'المسؤول' }, { label: 'الحالة' }, { label: 'عدد المشاريع' }, { label: 'الإنجاز' }],
        rows: objs.map((o) => [
          { text: o.title, bold: true },
          o.pillar,
          `${o.startYear} - ${o.endYear}`,
          o.owner,
          OBJECTIVE_STATUSES[o.status].label,
          projects.filter((p) => p.objectiveId === o.id).length,
          { text: pct(objectiveProgress(o, projects)), bold: true },
        ]),
        empty: 'لا توجد أهداف',
      },
      {
        title: 'مؤشرات الأداء (KPIs)',
        columns: [{ label: 'الهدف' }, { label: 'المؤشر' }, { label: 'خط الأساس' }, { label: 'الحالية' }, { label: 'المستهدفة' }, { label: 'نسبة التحقق' }],
        rows: objs.flatMap((o) =>
          (o.kpis ?? []).map((k): ReportCell[] => {
            const a = kpiAchievement(k)
            const u = k.unit ?? ''
            return [
              o.title,
              { text: k.name, bold: true },
              k.baseline == null ? '—' : `${k.baseline}${u}`,
              k.current == null ? '—' : `${k.current}${u}`,
              `${k.target}${u}`,
              { text: pct(a), tone: a >= 70 ? 'green' : a >= 40 ? 'amber' : 'red' },
            ]
          }),
        ),
        empty: 'لا توجد مؤشرات أداء مسجلة',
      },
      {
        title: 'المشاريع',
        columns: [
          { label: 'المشروع' },
          { label: 'الهدف' },
          { label: 'المدير' },
          { label: 'البداية', ltr: true },
          { label: 'الانتهاء', ltr: true },
          { label: 'الميزانية' },
          { label: 'الأولوية' },
          { label: 'الحالة' },
          { label: 'الإنجاز' },
          { label: 'المراحل' },
        ],
        rows: prjs.map((p): ReportCell[] => {
          const late = isProjectDelayed(p, today)
          const ms = p.milestones ?? []
          return [
            { text: p.name, bold: true },
            objTitle(p.objectiveId),
            p.manager,
            p.startDate ?? '—',
            late ? { text: `${p.endDate ?? '—'} (متأخر)`, tone: 'red' } : (p.endDate ?? '—'),
            formatMoney(p.budget),
            PROJECT_PRIORITIES[p.priority].label,
            PROJECT_STATUSES[p.status].label,
            { text: pct(p.progress), bold: true },
            ms.length ? `${ms.filter((m) => m.done).length} / ${ms.length}` : '—',
          ]
        }),
        empty: 'لا توجد مشاريع مطابقة',
      },
      {
        title: 'سجل المخاطر',
        columns: [{ label: 'المشروع' }, { label: 'الخطر' }, { label: 'الاحتمالية' }, { label: 'الأثر' }, { label: 'المستوى' }, { label: 'خطة المعالجة' }],
        rows: risks.map(({ p, r, sev }) => [
          p.name,
          { text: r.description, bold: true },
          RISK_LEVELS[r.likelihood],
          RISK_LEVELS[r.impact],
          { text: sev.label, tone: sev.tone === 'green' ? 'green' : sev.tone === 'amber' ? 'amber' : 'red' },
          r.mitigation,
        ]),
        empty: 'لا توجد مخاطر مسجلة',
      },
    ],
  }
}
