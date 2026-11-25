import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Droplets, KeyRound, Lock, MonitorSmartphone, Printer, Target } from 'lucide-react'
import { Button, Field, PageHeader, SelectInput, TextInput, Toast } from '../../shared/components/ui'
import { request } from '../../shared/data/api'
import { useAuth, usePermission } from '../../shared/data/auth'
import {
  useDeviceTypes,
  useDevices,
  useInkColors,
  useInkDispenses,
  useInks,
  useObjectives,
  usePrinterTypes,
  useProjects,
  useSubscriptionCategories,
  useSubscriptions,
} from '../../shared/data/store'
import { CLASSIFICATIONS, DEVICE_KINDS, SUBSCRIPTION_STATUSES } from '../../shared/data/types'
import type { SubscriptionStatus } from '../../shared/data/types'
import { PROJECT_STATUSES, todayIso } from '../governance/governanceStore'
import type { ProjectStatus } from '../governance/governanceStore'
import {
  ALL,
  buildDevicesReport,
  buildGovernanceReport,
  buildInksReport,
  buildSubscriptionsReport,
} from './reportBuilders'
import type { ReportBody, ReportSection } from './reportBuilders'
import { openReportWindow, writeReport } from './reportPrint'

const SECTION_LABELS: Record<ReportSection, string> = {
  devices: 'الأجهزة',
  inks: 'الأحبار',
  subscriptions: 'الاشتراكات',
  governance: 'التخطيط والحوكمة التقنية',
}

const allOpt = (label: string) => ({ value: ALL, label })

function ReportCard({
  icon,
  title,
  description,
  rowCount,
  busy,
  onPrint,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  rowCount: number
  busy: boolean
  onPrint: () => void
  children: ReactNode
}) {
  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</span>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </header>
      <div className="grid flex-1 gap-3 px-5 py-4 sm:grid-cols-2">{children}</div>
      <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <span className="text-xs text-slate-500">
          سيشمل التقرير <strong className="text-slate-900 tabular-nums">{rowCount}</strong> سجل
        </span>
        <Button variant="primary" className="h-9 px-3 text-xs" disabled={busy} onClick={onPrint}>
          <Printer className="size-4" />
          {busy ? 'جارٍ التجهيز...' : 'طباعة التقرير'}
        </Button>
      </footer>
    </section>
  )
}

export default function ReportsPage() {
  const session = useAuth()
  const canDevices = usePermission(['devices.view', 'devices.manage', 'dashboard.devices'])
  const canInks = usePermission(['inks.view', 'inks.manage'])
  const canSubs = usePermission(['subscriptions.view', 'subscriptions.manage', 'dashboard.subscriptions'])
  const canGov = usePermission(['strategy.view', 'strategy.manage', 'projects.view', 'projects.manage'])

  const devices = useDevices()
  const deviceTypes = useDeviceTypes()
  const inks = useInks()
  const dispenses = useInkDispenses()
  const printerTypes = usePrinterTypes()
  const inkColors = useInkColors()
  const subscriptions = useSubscriptions()
  const categories = useSubscriptionCategories()
  const objectives = useObjectives()
  const projects = useProjects()

  const today = todayIso()
  const monthStart = `${today.slice(0, 8)}01`

  const [devF, setDevF] = useState({ department: ALL, kind: ALL, classification: ALL })
  const [inkF, setInkF] = useState({ from: monthStart, to: today, lowOnly: false })
  const [subF, setSubF] = useState({ status: ALL, category: ALL })
  const [govF, setGovF] = useState({ objective: ALL, projectStatus: ALL })
  const [busy, setBusy] = useState<ReportSection | null>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'green' | 'red' } | null>(null)

  const deviceDepts = useMemo(
    () => Array.from(new Set(devices.map((d) => d.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar')),
    [devices],
  )
  const kindOptions = useMemo(() => {
    const ids = Array.from(new Set(devices.map((d) => d.kind)))
    return ids.map((id) => ({
      value: id,
      label: deviceTypes.find((t) => t.id === id)?.label ?? DEVICE_KINDS[id as keyof typeof DEVICE_KINDS]?.label ?? id,
    }))
  }, [devices, deviceTypes])

  const reports = useMemo(
    () => ({
      devices: buildDevicesReport(devices, deviceTypes, devF),
      inks: buildInksReport(inks, dispenses, printerTypes, inkColors, inkF),
      subscriptions: buildSubscriptionsReport(subscriptions, categories, subF),
      governance: buildGovernanceReport(objectives, projects, govF),
    }),
    [devices, deviceTypes, devF, inks, dispenses, printerTypes, inkColors, inkF, subscriptions, categories, subF, objectives, projects, govF],
  )

  const print = async (section: ReportSection, body: ReportBody) => {
    // تُفتح النافذة مباشرة مع الضغط حتى لا يحجبها المتصفح
    const win = openReportWindow()
    if (!win) {
      setToast({ msg: 'تعذر فتح نافذة الطباعة. اسمح للمتصفح بفتح النوافذ المنبثقة ثم حاول مجدداً.', tone: 'red' })
      return
    }
    setBusy(section)
    try {
      // الخادم يتحقق من صلاحية الطباعة ويسجل العملية في سجل التدقيق
      const res = await request.post<{ reference: string }>('/reports/print-log', {
        section,
        filters: body.filters,
        rows: body.rowCount,
      })
      writeReport(win, {
        ...body,
        section: SECTION_LABELS[section],
        reference: res.reference,
        generatedBy: session?.name ?? '—',
      })
    } catch (err) {
      win.close()
      setToast({ msg: err instanceof Error ? err.message : 'تعذر إصدار التقرير', tone: 'red' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="التقارير"
        description="تقارير قابلة للطباعة لكل قسم من أقسام المنظومة، بترويسة الشركة ومساحة للاعتماد. كل عملية طباعة تُسجَّل في سجل التدقيق."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            <Lock className="size-3.5" />
            صلاحية حصرية
          </span>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {canDevices && (
          <ReportCard
            icon={<MonitorSmartphone className="size-5" />}
            title="تقرير الأجهزة"
            description="سجل الأجهزة مع توزيعها حسب النوع والإدارة، والموظف المسؤول عن كل جهاز."
            rowCount={reports.devices.rowCount}
            busy={busy === 'devices'}
            onPrint={() => print('devices', reports.devices)}
          >
            <Field label="الإدارة">
              {(id) => (
                <SelectInput
                  id={id}
                  value={devF.department}
                  onChange={(e) => setDevF({ ...devF, department: e.target.value })}
                  options={[allOpt('كل الإدارات'), ...deviceDepts.map((d) => ({ value: d, label: d }))]}
                />
              )}
            </Field>
            <Field label="نوع الجهاز">
              {(id) => (
                <SelectInput
                  id={id}
                  value={devF.kind}
                  onChange={(e) => setDevF({ ...devF, kind: e.target.value })}
                  options={[allOpt('كل الأنواع'), ...kindOptions]}
                />
              )}
            </Field>
            <Field label="التصنيف">
              {(id) => (
                <SelectInput
                  id={id}
                  value={devF.classification}
                  onChange={(e) => setDevF({ ...devF, classification: e.target.value })}
                  options={[
                    allOpt('شخصي وجماعي'),
                    ...(Object.keys(CLASSIFICATIONS) as (keyof typeof CLASSIFICATIONS)[]).map((c) => ({ value: c, label: CLASSIFICATIONS[c].label })),
                  ]}
                />
              )}
            </Field>
          </ReportCard>
        )}

        {canInks && (
          <ReportCard
            icon={<Droplets className="size-5" />}
            title="تقرير الأحبار"
            description="المخزون الحالي والأصناف المنخفضة، وما صُرف لكل إدارة خلال فترة محددة."
            rowCount={reports.inks.rowCount}
            busy={busy === 'inks'}
            onPrint={() => print('inks', reports.inks)}
          >
            <Field label="صرف من تاريخ">
              {(id) => <TextInput id={id} type="date" dir="ltr" value={inkF.from} max={inkF.to} onChange={(e) => setInkF({ ...inkF, from: e.target.value })} />}
            </Field>
            <Field label="إلى تاريخ">
              {(id) => <TextInput id={id} type="date" dir="ltr" value={inkF.to} min={inkF.from} onChange={(e) => setInkF({ ...inkF, to: e.target.value })} />}
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-slate-900"
                checked={inkF.lowOnly}
                onChange={(e) => setInkF({ ...inkF, lowOnly: e.target.checked })}
              />
              الأصناف منخفضة المخزون فقط
            </label>
          </ReportCard>
        )}

        {canSubs && (
          <ReportCard
            icon={<KeyRound className="size-5" />}
            title="تقرير الاشتراكات والتراخيص"
            description="الاشتراكات مرتبة حسب تاريخ الانتهاء، مع الأيام المتبقية وحالة كل اشتراك."
            rowCount={reports.subscriptions.rowCount}
            busy={busy === 'subscriptions'}
            onPrint={() => print('subscriptions', reports.subscriptions)}
          >
            <Field label="الحالة">
              {(id) => (
                <SelectInput
                  id={id}
                  value={subF.status}
                  onChange={(e) => setSubF({ ...subF, status: e.target.value })}
                  options={[
                    allOpt('كل الحالات'),
                    ...(Object.keys(SUBSCRIPTION_STATUSES) as SubscriptionStatus[]).map((s) => ({ value: s, label: SUBSCRIPTION_STATUSES[s].label })),
                  ]}
                />
              )}
            </Field>
            <Field label="التصنيف">
              {(id) => (
                <SelectInput
                  id={id}
                  value={subF.category}
                  onChange={(e) => setSubF({ ...subF, category: e.target.value })}
                  options={[allOpt('كل التصنيفات'), ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                />
              )}
            </Field>
          </ReportCard>
        )}

        {canGov && (
          <ReportCard
            icon={<Target className="size-5" />}
            title="تقرير التخطيط والحوكمة التقنية"
            description="الأهداف الاستراتيجية ومؤشرات أدائها، والمشاريع ونسب إنجازها، وسجل المخاطر."
            rowCount={reports.governance.rowCount}
            busy={busy === 'governance'}
            onPrint={() => print('governance', reports.governance)}
          >
            <Field label="الهدف الاستراتيجي">
              {(id) => (
                <SelectInput
                  id={id}
                  value={govF.objective}
                  onChange={(e) => setGovF({ ...govF, objective: e.target.value })}
                  options={[allOpt('كل الأهداف'), ...objectives.map((o) => ({ value: o.id, label: o.title }))]}
                />
              )}
            </Field>
            <Field label="حالة المشاريع">
              {(id) => (
                <SelectInput
                  id={id}
                  value={govF.projectStatus}
                  onChange={(e) => setGovF({ ...govF, projectStatus: e.target.value })}
                  options={[
                    allOpt('كل المشاريع'),
                    { value: 'delayed', label: 'المتأخرة فقط' },
                    ...(Object.keys(PROJECT_STATUSES) as ProjectStatus[]).map((s) => ({ value: s, label: PROJECT_STATUSES[s].label })),
                  ]}
                />
              )}
            </Field>
          </ReportCard>
        )}
      </div>

      <Toast message={toast?.msg ?? null} tone={toast?.tone} onClose={() => setToast(null)} duration={5000} />
    </>
  )
}
