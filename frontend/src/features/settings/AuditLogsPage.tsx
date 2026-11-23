import { useMemo, useState } from 'react'
import { TableRowsSkeleton } from '../../shared/components/Skeleton'
import { History } from 'lucide-react'
import {
  PageHeader,
  Pagination,
  Pill,
  SearchInput,
  SelectInput,
} from '../../shared/components/ui'
import { SettingsTabs } from './components/SettingsTabs'
import { useAuditLogs, useDataLoading } from '../../shared/data/store'
import type { AuditAction } from '../../shared/data/types'

const PAGE_SIZE = 15

const ACTION_META: Record<AuditAction, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate' }> = {
  created: { label: 'إضافة', tone: 'green' },
  updated: { label: 'تعديل', tone: 'blue' },
  deleted: { label: 'حذف', tone: 'red' },
  dispensed: { label: 'صرف حبر', tone: 'amber' },
  restocked: { label: 'توريد مخزون', tone: 'green' },
  login: { label: 'تسجيل دخول', tone: 'slate' },
  logout: { label: 'تسجيل خروج', tone: 'slate' },
}

const ENTITY_LABELS: Record<string, string> = {
  device: 'الأجهزة',
  ink: 'الأحبار',
  subscription: 'الاشتراكات',
  app_user: 'المستخدمين',
  employee: 'الموظفين',
  department: 'الإدارات',
  auth: 'الجلسات',
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-LY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function AuditLogs() {
  const dataLoading = useDataLoading()
  const logs = useAuditLogs()
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false
      if (!q) return true
      return (
        log.summary.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.entityId ?? '').toLowerCase().includes(q)
      )
    })
  }, [logs, query, actionFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="سجل التدقيق والعمليات"
        description="متابعة كافة العمليات الحساسة في النظام: من قام بالعملية، نوعها، وتوقيتها."
      />

      <SettingsTabs />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث في الوصف أو اسم المستخدم أو المعرّف..."
        />

        <div className="flex items-center gap-3">
          <div className="w-48">
            <SelectInput
              aria-label="تصفية حسب نوع العملية"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              options={[
                { value: 'all', label: `كل العمليات (${logs.length})` },
                ...(Object.keys(ACTION_META) as AuditAction[]).map((a) => ({
                  value: a,
                  label: ACTION_META[a].label,
                })),
              ]}
            />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <History className="size-4" />
            السجلات: {filtered.length}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">التاريخ والوقت</th>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">العملية</th>
                <th className="px-4 py-3">القسم</th>
                <th className="px-4 py-3">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataLoading && logs.length === 0 ? (
                <TableRowsSkeleton cols={5} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    لا توجد عمليات مسجلة بعد.
                  </td>
                </tr>
              ) : (
                rows.map((log) => {
                  const meta = ACTION_META[log.action] ?? { label: log.action, tone: 'slate' as const }
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500" dir="ltr">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{log.userName}</td>
                      <td className="px-4 py-3">
                        <Pill tone={meta.tone}>{meta.label}</Pill>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {ENTITY_LABELS[log.entityType] ?? log.entityType}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.summary}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          pageCount={pageCount}
          shown={rows.length}
          total={filtered.length}
          noun="سجل"
          onPage={setPage}
        />
      </div>
    </div>
  )
}
