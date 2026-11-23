import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeftRight, Undo2 } from 'lucide-react'
import { Button, Field, Modal, SearchableSelect, SelectInput, TextInput } from '../../../shared/components/ui'
import { useDepartments, useEmployees } from '../../../shared/data/store'
import { OTHER } from '../../../shared/data/options'
import { DEVICE_CONDITIONS, SHARED_EMPLOYEE, STORAGE_EMPLOYEE } from '../../../shared/data/types'
import type { Classification, CustodyRecord, Device, DeviceCondition } from '../../../shared/data/types'
import { returnDeviceToStorage, transferDeviceCustody } from '../devicesStore'

export type CustodyMode = 'transfer' | 'return'

const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const conditionOptions = [
  { value: '', label: 'غير محدد' },
  ...Object.entries(DEVICE_CONDITIONS).map(([value, label]) => ({ value, label })),
]

export function CustodyActionModal({
  mode,
  device,
  onClose,
  onDone,
}: {
  mode: CustodyMode | null
  device: Device
  onClose: () => void
  onDone: (record: CustodyRecord) => void
}) {
  const departments = useDepartments()
  const allEmployees = useEmployees()
  const open = mode !== null
  const isReturn = mode === 'return'

  const [dept, setDept] = useState('')
  const [customDept, setCustomDept] = useState('')
  const [classification, setClassification] = useState<Classification>('personal')
  const [employee, setEmployee] = useState('')
  const [customEmployee, setCustomEmployee] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [condition, setCondition] = useState<DeviceCondition | ''>('good')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDept('')
    setCustomDept('')
    setClassification(device.classification === 'shared' && device.employee !== STORAGE_EMPLOYEE ? 'shared' : 'personal')
    setEmployee('')
    setCustomEmployee('')
    setDate(todayLocal())
    setCondition('good')
    setNotes('')
    setSubmitted(false)
    setError(null)
  }, [open, device])

  const deptOptions = useMemo(
    () => [...departments.map((d) => ({ value: d.name, label: d.name })), { value: OTHER, label: OTHER }],
    [departments],
  )
  const resolvedDept = dept === OTHER ? customDept.trim() : dept
  const employeeOptions = useMemo(
    () => [
      ...allEmployees.filter((e) => e.department === dept).map((e) => ({ value: e.name, label: e.name })),
      { value: OTHER, label: OTHER },
    ],
    [allEmployees, dept],
  )
  const resolvedEmployee =
    classification === 'shared' ? SHARED_EMPLOYEE : employee === OTHER ? customEmployee.trim() : employee

  const errors = isReturn
    ? {}
    : {
        dept: !resolvedDept ? 'اختر الإدارة المستلمة.' : undefined,
        employee: classification === 'personal' && !resolvedEmployee ? 'اختر الموظف المستلم.' : undefined,
        same:
          resolvedEmployee === device.employee && resolvedDept === device.department
            ? 'الجهاز في عهدة نفس الموظف والإدارة حالياً.'
            : undefined,
      }
  const show = (e?: string) => (submitted ? e : undefined)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (Object.values(errors).some(Boolean) || saving || !mode) return
    setSaving(true)
    try {
      const common = { date, condition: condition || null, notes: notes.trim() || null }
      const record = isReturn
        ? await returnDeviceToStorage(device.id, common)
        : await transferDeviceCustody(device.id, {
            ...common,
            toEmployee: resolvedEmployee,
            toDepartment: resolvedDept,
            classification,
          })
      onDone(record)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ العملية على الخادم.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReturn ? 'إرجاع الجهاز للمخزن' : 'نقل عهدة الجهاز'}
      description={
        isReturn
          ? `سيُسجَّل إرجاع «${device.name}» من ${device.employee} إلى ${STORAGE_EMPLOYEE}.`
          : `العهدة الحالية: ${device.employee} — ${device.department}`
      }
      footer={
        <>
          <Button type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" form="custody-form" variant="primary" disabled={saving}>
            {isReturn ? <Undo2 className="size-4" /> : <ArrowLeftRight className="size-4" />}
            {saving ? 'جارٍ الحفظ...' : isReturn ? 'تأكيد الإرجاع' : 'تأكيد النقل'}
          </Button>
        </>
      }
    >
      <form id="custody-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {!isReturn && (
          <>
            <div className="sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">نوع العهدة</span>
              <div className="mt-1.5 flex gap-2" role="radiogroup" aria-label="نوع العهدة">
                {(['personal', 'shared'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={classification === c}
                    onClick={() => setClassification(c)}
                    className={
                      'h-9 flex-1 rounded-md border text-sm font-semibold transition-colors ' +
                      (classification === c
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')
                    }
                  >
                    {c === 'personal' ? 'شخصية (لموظف)' : 'جماعية (للإدارة)'}
                  </button>
                ))}
              </div>
            </div>

            <Field label="الإدارة المستلمة" error={show(errors.dept)}>
              {(id, desc) => (
                <SearchableSelect
                  id={id}
                  aria-describedby={desc}
                  aria-invalid={!!show(errors.dept)}
                  value={dept}
                  onChange={(v) => {
                    setDept(v)
                    setEmployee('')
                  }}
                  options={deptOptions}
                  placeholder="اختر الإدارة"
                />
              )}
            </Field>
            {dept === OTHER ? (
              <Field label="اسم الإدارة">
                {(id) => <TextInput id={id} value={customDept} onChange={(e) => setCustomDept(e.target.value)} />}
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}

            {classification === 'personal' && (
              <>
                <Field label="الموظف المستلم" error={show(errors.employee)}>
                  {(id, desc) => (
                    <SearchableSelect
                      id={id}
                      aria-describedby={desc}
                      aria-invalid={!!show(errors.employee)}
                      value={employee}
                      onChange={setEmployee}
                      options={employeeOptions}
                      disabled={!dept}
                      placeholder={dept ? 'اختر الموظف' : 'اختر الإدارة أولاً'}
                    />
                  )}
                </Field>
                {employee === OTHER ? (
                  <Field label="اسم الموظف">
                    {(id) => (
                      <TextInput id={id} value={customEmployee} onChange={(e) => setCustomEmployee(e.target.value)} />
                    )}
                  </Field>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </>
            )}
          </>
        )}

        <Field label={isReturn ? 'تاريخ الإرجاع' : 'تاريخ الاستلام'}>
          {(id) => (
            <TextInput
              id={id}
              type="date"
              dir="ltr"
              max={todayLocal()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </Field>
        <Field label="حالة الجهاز">
          {(id) => (
            <SelectInput
              id={id}
              value={condition}
              onChange={(e) => setCondition(e.target.value as DeviceCondition | '')}
              options={conditionOptions}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field label="ملاحظات (اختياري)">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                value={notes}
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-signal/60 focus:outline-none"
                placeholder={isReturn ? 'مثال: انتهاء خدمة الموظف، الجهاز بحاجة لتهيئة...' : 'مثال: انتقال الموظف لإدارة أخرى...'}
              />
            )}
          </Field>
        </div>

        {(show(errors.same) || error) && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 sm:col-span-2">
            {show(errors.same) ?? error}
          </p>
        )}
      </form>
    </Modal>
  )
}
