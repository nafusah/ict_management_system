import { useEffect, useMemo, useState } from 'react'
import { Building2, Pencil, Plus, Trash2, Users } from 'lucide-react'
import {
  Button,
  ConfirmDelete,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  SearchInput,
  SelectInput,
  TextInput,
  Toast,
  cx,
} from '../../shared/components/ui'
import { SettingsTabs } from './components/SettingsTabs'
import { departmentsStore, employeesStore, useDepartments, useEmployees } from '../../shared/data/store'
import type { DepartmentItem, EmployeeItem } from '../../shared/data/types'

const PAGE_SIZE = 12

export default function Employees() {
  const departments = useDepartments()
  const employees = useEmployees()

  const [query, setQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const [editingDept, setEditingDept] = useState<DepartmentItem | 'new' | null>(null)
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null)

  const [editingEmp, setEditingEmp] = useState<EmployeeItem | 'new' | null>(null)
  const [deletingEmp, setDeletingEmp] = useState<EmployeeItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const deptCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of employees) {
      counts.set(e.department, (counts.get(e.department) ?? 0) + 1)
    }
    return counts
  }, [employees])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter((e) => {
      if (deptFilter !== 'all' && e.department !== deptFilter) return false
      if (!q) return true
      return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
    })
  }, [employees, query, deptFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleDeleteDept = (dept: DepartmentItem) => {
    const count = deptCounts.get(dept.name) ?? 0
    if (count > 0) {
      setToast(`لا يمكن حذف "${dept.name}" لوجود ${count} موظف مرتبط بها.`)
      setDeletingDept(null)
      return
    }
    departmentsStore.remove(dept.id)
    if (deptFilter === dept.name) setDeptFilter('all')
    setDeletingDept(null)
    setToast(`تم حذف إدارة "${dept.name}".`)
  }

  return (
    <div>
      <PageHeader
        title="الموظفين والإدارات"
        description="إدارة قائمة الموظفين والإدارات المعتمدة في النظام (تظهر تلقائياً في نماذج الأجهزة والأحبار والاشتراكات)."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditingDept('new')}>
              <Building2 className="size-4" />
              إضافة إدارة
            </Button>
            <Button variant="primary" onClick={() => setEditingEmp('new')}>
              <Plus className="size-4" />
              إضافة موظف
            </Button>
          </div>
        }
      />

      <SettingsTabs />

      {/* خانة الإدارات */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">الإدارات ({departments.length})</h2>
              <p className="text-xs text-slate-500">اضغط على أي إدارة لتصفية الموظفين التابعين لها</p>
            </div>
          </div>
          {deptFilter !== 'all' && (
            <Button
              variant="ghost"
              className="h-8 px-2.5 text-xs"
              onClick={() => {
                setDeptFilter('all')
                setPage(1)
              }}
            >
              عرض كل الإدارات
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setDeptFilter('all')
              setPage(1)
            }}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors',
              deptFilter === 'all'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
            )}
          >
            الكل
            <span className="opacity-75">({employees.length})</span>
          </button>

          {departments.map((d) => {
            const active = deptFilter === d.name
            const count = deptCounts.get(d.name) ?? 0
            return (
              <div
                key={d.id}
                className={cx(
                  'group inline-flex h-8 items-center gap-1 rounded-lg border ps-3 pe-1.5 text-xs transition-colors',
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDeptFilter(active ? 'all' : d.name)
                    setPage(1)
                  }}
                  className="inline-flex items-center gap-1.5 font-medium"
                >
                  <span dir="auto">{d.name}</span>
                  <span className={cx('text-[11px]', active ? 'text-slate-300' : 'text-slate-400')}>({count})</span>
                </button>
                <button
                  type="button"
                  aria-label={`تعديل ${d.name}`}
                  onClick={() => setEditingDept(d)}
                  className={cx(
                    'rounded p-1 transition-colors',
                    active ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700',
                  )}
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label={`حذف ${d.name}`}
                  onClick={() => setDeletingDept(d)}
                  className={cx(
                    'rounded p-1 transition-colors',
                    active ? 'text-slate-300 hover:bg-red-900/50 hover:text-red-200' : 'text-slate-400 hover:bg-red-50 hover:text-red-600',
                  )}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* شريط البحث والفلترة للموظفين */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث باسم الموظف أو الإدارة..."
        />

        <div className="flex items-center gap-3">
          <div className="w-56">
            <SelectInput
              aria-label="تصفية حسب الإدارة"
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value)
                setPage(1)
              }}
              options={[
                { value: 'all', label: `كل الإدارات (${employees.length})` },
                ...departments.map((d) => ({
                  value: d.name,
                  label: `${d.name} (${deptCounts.get(d.name) ?? 0})`,
                })),
              ]}
            />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Users className="size-4" />
            النتائج: {filtered.length}
          </span>
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">اسم الموظف</th>
                <th className="px-4 py-3">الإدارة</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    لا يوجد موظفون مطابقون للبحث الحالي.
                  </td>
                </tr>
              ) : (
                rows.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                    <td className="px-4 py-3">
                      <Pill tone="slate">{emp.department}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label={`تعديل ${emp.name}`} onClick={() => setEditingEmp(emp)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label={`حذف ${emp.name}`}
                          className="hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeletingEmp(emp)}
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          pageCount={pageCount}
          shown={rows.length}
          total={filtered.length}
          noun="موظف"
          onPage={setPage}
        />
      </div>

      {/* نافذة إضافة/تعديل إدارة */}
      <DepartmentModal
        open={editingDept !== null}
        department={editingDept === 'new' ? null : editingDept}
        existingNames={departments.map((d) => d.name)}
        onClose={() => setEditingDept(null)}
        onSaved={(msg, oldName, newName) => {
          if (oldName && newName && oldName !== newName) {
            for (const emp of employees) {
              if (emp.department === oldName) {
                employeesStore.update({ ...emp, department: newName })
              }
            }
            if (deptFilter === oldName) setDeptFilter(newName)
          }
          setEditingDept(null)
          setToast(msg)
        }}
      />

      {/* نافذة تأكيد حذف إدارة */}
      <ConfirmDelete
        open={deletingDept !== null}
        itemName={deletingDept ? `إدارة "${deletingDept.name}"` : ''}
        onCancel={() => setDeletingDept(null)}
        onConfirm={() => {
          if (deletingDept) handleDeleteDept(deletingDept)
        }}
      />

      {/* نافذة إضافة/تعديل موظف */}
      <EmployeeModal
        open={editingEmp !== null}
        employee={editingEmp === 'new' ? null : editingEmp}
        departments={departments}
        defaultDepartment={deptFilter !== 'all' ? deptFilter : departments[0]?.name ?? ''}
        onClose={() => setEditingEmp(null)}
        onSaved={(msg) => {
          setEditingEmp(null)
          setToast(msg)
        }}
      />

      {/* نافذة تأكيد حذف موظف */}
      <ConfirmDelete
        open={deletingEmp !== null}
        itemName={deletingEmp ? `الموظف "${deletingEmp.name}"` : ''}
        onCancel={() => setDeletingEmp(null)}
        onConfirm={() => {
          if (deletingEmp) {
            employeesStore.remove(deletingEmp.id)
            setToast(`تم حذف "${deletingEmp.name}".`)
            setDeletingEmp(null)
          }
        }}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function DepartmentModal({
  open,
  department,
  existingNames,
  onClose,
  onSaved,
}: {
  open: boolean
  department: DepartmentItem | null
  existingNames: string[]
  onClose: () => void
  onSaved: (message: string, oldName?: string, newName?: string) => void
}) {
  const [name, setName] = useState(department?.name ?? '')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(department?.name ?? '')
    setSubmitted(false)
  }, [open, department])

  const trimmed = name.trim()
  const duplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase() && n !== department?.name,
  )
  const error = !trimmed
    ? 'اكتب اسم الإدارة.'
    : duplicate
      ? 'هذه الإدارة موجودة مسبقاً.'
      : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (error) return

    if (department) {
      departmentsStore.update({ ...department, name: trimmed })
      onSaved(`تم تحديث إدارة "${trimmed}".`, department.name, trimmed)
    } else {
      departmentsStore.add({ name: trimmed })
      onSaved(`تمت إضافة إدارة "${trimmed}".`)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? 'تعديل اسم الإدارة' : 'إضافة إدارة جديدة'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" form="department-form">
            {department ? 'حفظ التعديل' : 'إضافة'}
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="اسم الإدارة" error={submitted ? error : undefined}>
          {(id, desc) => (
            <TextInput
              id={id}
              aria-describedby={desc}
              aria-invalid={submitted && !!error}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: I C T"
              autoFocus
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}

function EmployeeModal({
  open,
  employee,
  departments,
  defaultDepartment,
  onClose,
  onSaved,
}: {
  open: boolean
  employee: EmployeeItem | null
  departments: DepartmentItem[]
  defaultDepartment: string
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [name, setName] = useState(employee?.name ?? '')
  const [department, setDepartment] = useState(employee?.department ?? defaultDepartment)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(employee?.name ?? '')
    setDepartment(employee?.department ?? defaultDepartment)
    setSubmitted(false)
  }, [open, employee, defaultDepartment])

  const trimmedName = name.trim()
  const nameError = !trimmedName ? 'اكتب اسم الموظف.' : undefined
  const deptError = !department ? 'اختر الإدارة.' : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (nameError || deptError) return

    if (employee) {
      employeesStore.update({ ...employee, name: trimmedName, department })
      onSaved(`تم تحديث بيانات "${trimmedName}".`)
    } else {
      employeesStore.add({ name: trimmedName, department })
      onSaved(`تمت إضافة "${trimmedName}".`)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" form="employee-form">
            {employee ? 'حفظ التعديلات' : 'إضافة الموظف'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="الاسم الكامل" error={submitted ? nameError : undefined}>
          {(id, desc) => (
            <TextInput
              id={id}
              aria-describedby={desc}
              aria-invalid={submitted && !!nameError}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل للموظف"
              autoFocus
            />
          )}
        </Field>

        <Field label="الإدارة" error={submitted ? deptError : undefined}>
          {(id, desc) => (
            <SelectInput
              id={id}
              aria-describedby={desc}
              aria-invalid={submitted && !!deptError}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={departments.map((d) => ({ value: d.name, label: d.name }))}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
