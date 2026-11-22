import { useMemo } from 'react'
import { Field, SearchableSelect, TextInput, cx } from '../../../shared/components/ui'
import { OTHER } from '../../../shared/data/options'
import { useDepartments, useEmployees } from '../../../shared/data/store'
import { INK_DISPENSE_SCOPES } from '../../../shared/data/types'
import type { Classification, DepartmentItem, EmployeeItem } from '../../../shared/data/types'

export interface DispenseRecipientValue {
  scope: Classification
  department: string
  customDepartment: string
  employee: string
  customEmployee: string
  sendEmployeeEmail?: boolean
  recipientEmail?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createInitialRecipientState(
  departments: DepartmentItem[],
  employees: EmployeeItem[],
  defaultScope: Classification = 'shared',
  defaultDepartment = '',
): DispenseRecipientValue {
  const firstDept = defaultDepartment || departments[0]?.name || OTHER
  const deptEmps = firstDept === OTHER ? employees : employees.filter((e) => e.department === firstDept)
  return {
    scope: defaultScope,
    department: firstDept,
    customDepartment: '',
    employee: deptEmps[0]?.name ?? OTHER,
    customEmployee: '',
    sendEmployeeEmail: false,
    recipientEmail: '',
  }
}

export function resolveDispenseRecipient(val: DispenseRecipientValue): {
  department: string
  scope: Classification
  recipientName: string | null
  recipientEmail: string | null
  error?: string
} {
  const department = val.department === OTHER ? val.customDepartment.trim() : val.department.trim()
  if (!department) {
    return { department: '', scope: val.scope, recipientName: null, recipientEmail: null, error: 'يرجى تحديد الإدارة المستلمة.' }
  }
  const emailTrimmed = (val.recipientEmail ?? '').trim().toLowerCase()
  if (val.sendEmployeeEmail) {
    if (!emailTrimmed || !EMAIL_RE.test(emailTrimmed)) {
      return {
        department,
        scope: val.scope,
        recipientName: null,
        recipientEmail: null,
        error: 'يرجى إدخال بريد إلكتروني صحيح للموظف.',
      }
    }
  }
  const recipientEmail = val.sendEmployeeEmail ? emailTrimmed : null

  if (val.scope === 'shared') {
    return { department, scope: 'shared', recipientName: null, recipientEmail }
  }
  const recipientName = val.employee === OTHER ? val.customEmployee.trim() : val.employee.trim()
  if (!recipientName) {
    return { department, scope: 'personal', recipientName: null, recipientEmail, error: 'يرجى تحديد اسم الموظف المستلم.' }
  }
  return { department, scope: 'personal', recipientName, recipientEmail }
}

export function DispenseRecipientFields({
  value,
  onChange,
  departmentLabel = 'الإدارة المستلمة',
  radioName = 'dispense-scope',
  allowEmployeeEmail = false,
}: {
  value: DispenseRecipientValue
  onChange: (next: DispenseRecipientValue) => void
  departmentLabel?: string
  radioName?: string
  allowEmployeeEmail?: boolean
}) {
  const departments = useDepartments()
  const employees = useEmployees()

  const departmentOptions = useMemo(
    () => [
      ...departments.map((d) => ({ value: d.name, label: d.name })),
      { value: OTHER, label: 'إدارة / قسم آخر...' },
    ],
    [departments],
  )

  const employeesForDept = useMemo(() => {
    const list =
      value.department && value.department !== OTHER
        ? employees.filter((e) => e.department === value.department)
        : employees
    return [...list.map((e) => e.name), OTHER]
  }, [employees, value.department])

  const isShared = value.scope === 'shared'

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">نوع الصرف</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(['shared', 'personal'] as Classification[]).map((sc) => (
            <label
              key={sc}
              className={cx(
                'flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-slate-900',
                value.scope === sc ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-white hover:border-slate-400',
              )}
            >
              <input
                type="radio"
                name={radioName}
                value={sc}
                checked={value.scope === sc}
                onChange={() => {
                  const firstEmp = employeesForDept[0] ?? OTHER
                  onChange({
                    ...value,
                    scope: sc,
                    employee: value.employee || firstEmp,
                  })
                }}
                className="mt-0.5 accent-slate-900"
              />
              <span>
                <span className="block text-xs font-bold text-slate-900">{INK_DISPENSE_SCOPES[sc].label}</span>
                <span className="block text-[11px] text-slate-500">{INK_DISPENSE_SCOPES[sc].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={departmentLabel}>
          {(id) => (
            <SearchableSelect
              id={id}
              value={value.department}
              onChange={(nextDept) => {
                const list =
                  nextDept && nextDept !== OTHER
                    ? employees.filter((e) => e.department === nextDept)
                    : employees
                onChange({
                  ...value,
                  department: nextDept,
                  customDepartment: nextDept === OTHER ? value.customDepartment : '',
                  employee: list[0]?.name ?? OTHER,
                  customEmployee: '',
                })
              }}
              options={departmentOptions}
              placeholder="اختر الإدارة..."
              searchPlaceholder="ابحث عن إدارة..."
            />
          )}
        </Field>

        <Field label="الموظف المستلم" hint={isShared ? 'مجمّد لأن نوع الصرف جماعي للإدارة' : undefined}>
          {(id, d) => (
            <SearchableSelect
              id={id}
              aria-describedby={d}
              disabled={isShared}
              className={cx(isShared && 'cursor-not-allowed bg-slate-100 text-slate-400')}
              value={isShared ? '__shared__' : value.employee}
              onChange={(emp) =>
                onChange({
                  ...value,
                  employee: emp,
                  customEmployee: emp === OTHER ? value.customEmployee : '',
                })
              }
              options={
                isShared
                  ? [{ value: '__shared__', label: 'مشترك للإدارة (صرف جماعي)' }]
                  : employeesForDept.map((name) => ({ value: name, label: name }))
              }
              placeholder="اختر الموظف..."
              searchPlaceholder="ابحث عن اسم الموظف..."
            />
          )}
        </Field>
      </div>

      {(value.department === OTHER || (!isShared && value.employee === OTHER)) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {value.department === OTHER ? (
            <Field label="اسم الإدارة">
              {(id) => (
                <TextInput
                  id={id}
                  value={value.customDepartment}
                  onChange={(e) => onChange({ ...value, customDepartment: e.target.value })}
                  placeholder="اكتب اسم الإدارة أو القسم..."
                />
              )}
            </Field>
          ) : (
            <div className="hidden sm:block" />
          )}
          {!isShared && value.employee === OTHER && (
            <Field label="اسم الموظف">
              {(id) => (
                <TextInput
                  id={id}
                  value={value.customEmployee}
                  onChange={(e) => onChange({ ...value, customEmployee: e.target.value })}
                  placeholder="اكتب اسم الموظف المستلم..."
                />
              )}
            </Field>
          )}
        </div>
      )}

      {allowEmployeeEmail && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={Boolean(value.sendEmployeeEmail)}
              onChange={(e) =>
                onChange({
                  ...value,
                  sendEmployeeEmail: e.target.checked,
                  recipientEmail: e.target.checked ? value.recipientEmail ?? '' : '',
                })
              }
              className="accent-slate-900"
            />
            إرسال إشعار بريدي لموظف محدد (اختياري)
          </label>
          {value.sendEmployeeEmail && (
            <div className="mt-2.5">
              <Field
                label="البريد الإلكتروني للموظف"
                hint="ستصله رسالة خفيفة تفيد بصرف الحبر وجاري تركيبه للطابعة"
              >
                {(id, desc) => (
                  <TextInput
                    id={id}
                    aria-describedby={desc}
                    type="email"
                    dir="ltr"
                    value={value.recipientEmail ?? ''}
                    onChange={(e) => onChange({ ...value, recipientEmail: e.target.value })}
                    placeholder="employee@nafusah.com"
                  />
                )}
              </Field>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
