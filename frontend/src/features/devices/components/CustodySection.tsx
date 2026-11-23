import { useCallback, useEffect, useState } from 'react'
import { ArrowLeftRight, History, Printer, Undo2 } from 'lucide-react'
import { Button, IconButton, Pill, Toast } from '../../../shared/components/ui'
import { Skeleton } from '../../../shared/components/Skeleton'
import { CUSTODY_ACTIONS, DEVICE_CONDITIONS, STORAGE_EMPLOYEE } from '../../../shared/data/types'
import type { CustodyRecord, Device } from '../../../shared/data/types'
import { fetchCustodyHistory } from '../devicesStore'
import { CustodyActionModal, type CustodyMode } from './CustodyActionModal'
import { printCustodyForm } from './custodyPrint'

const DOT: Record<CustodyRecord['action'], string> = {
  assigned: 'bg-emerald-600',
  transferred: 'bg-blue-600',
  returned: 'bg-amber-500',
}

function Holder({ employee, department }: { employee?: string | null; department?: string | null }) {
  if (!employee) return <span className="text-slate-500">إدارة الاتصالات وتقنية المعلومات</span>
  return (
    <span>
      <span className="font-semibold text-slate-900">{employee}</span>
      {department && employee !== STORAGE_EMPLOYEE && <span className="text-slate-500"> — {department}</span>}
    </span>
  )
}

export function CustodySection({
  device,
  deviceTypeLabel,
  canManage,
}: {
  device: Device
  deviceTypeLabel: string
  canManage: boolean
}) {
  const [records, setRecords] = useState<CustodyRecord[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<CustodyMode | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      setRecords(await fetchCustodyHistory(device.id))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'تعذر تحميل سجل العهدة.')
      setRecords([])
    }
  }, [device.id])

  // يُعاد التحميل عند تغيّر صاحب العهدة (مثلاً بعد التعديل من نموذج بيانات الجهاز)
  useEffect(() => {
    void load()
  }, [load, device.employee, device.department])

  const inStorage = device.employee === STORAGE_EMPLOYEE

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="custody-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <History className="size-5" />
          </span>
          <div>
            <h2 id="custody-title" className="text-base font-bold text-slate-900">
              سجل العهدة
            </h2>
            <p className="text-xs text-slate-500">كل من استلم الجهاز وسلّمه، مع نموذج قابل للطباعة لكل عملية.</p>
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {!inStorage && (
              <Button variant="secondary" onClick={() => setMode('return')}>
                <Undo2 className="size-4" />
                إرجاع للمخزن
              </Button>
            )}
            <Button variant="primary" onClick={() => setMode('transfer')}>
              <ArrowLeftRight className="size-4" />
              {inStorage ? 'تسليم لموظف' : 'نقل العهدة'}
            </Button>
          </div>
        )}
      </div>

      {records === null ? (
        <div className="space-y-4" role="status" aria-label="جارٍ تحميل سجل العهدة">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="mt-1 size-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      ) : records.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-xs text-slate-500">
          لا توجد حركات مسجلة لهذا الجهاز بعد.
        </p>
      ) : (
        <ol className="relative space-y-1 before:absolute before:top-2 before:bottom-2 before:start-[5px] before:w-px before:bg-slate-200">
          {records.map((r, idx) => {
            const meta = CUSTODY_ACTIONS[r.action]
            return (
              <li key={r.id} className="relative flex gap-3 rounded-xl ps-0 pe-1 py-2.5 hover:bg-slate-50/70">
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white ${DOT[r.action]}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={meta.tone}>{meta.label}</Pill>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums" dir="ltr">
                      {r.date}
                    </span>
                    {idx === 0 && <span className="text-[11px] font-bold text-emerald-700">العهدة الحالية</span>}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">
                    {r.action === 'assigned' ? (
                      <>
                        سُلِّم إلى <Holder employee={r.toEmployee} department={r.toDepartment} />
                      </>
                    ) : (
                      <>
                        من <Holder employee={r.fromEmployee} department={r.fromDepartment} /> إلى{' '}
                        <Holder employee={r.toEmployee} department={r.toDepartment} />
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.condition && <>الحالة: {DEVICE_CONDITIONS[r.condition]} • </>}
                    بواسطة {r.performedByName || 'النظام'} • مرجع <bdi>{r.id}</bdi>
                  </p>
                  {r.notes && <p className="mt-1 text-xs text-slate-600">{r.notes}</p>}
                </div>
                <IconButton
                  label={`طباعة نموذج ${meta.label} (${r.id})`}
                  onClick={() => printCustodyForm(device, r, deviceTypeLabel)}
                >
                  <Printer className="size-4" />
                </IconButton>
              </li>
            )
          })}
        </ol>
      )}

      <CustodyActionModal
        mode={mode}
        device={device}
        onClose={() => setMode(null)}
        onDone={(record) => {
          setMode(null)
          setRecords((prev) => [record, ...(prev ?? [])])
          setToast(
            (record.action === 'returned' ? 'تم إرجاع الجهاز للمخزن' : 'تم نقل العهدة بنجاح') +
              ' — اطبع النموذج من زر الطابعة بجانب القيد.',
          )
        }}
      />

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />
    </section>
  )
}
