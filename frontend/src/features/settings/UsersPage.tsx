import { useMemo, useState } from 'react'
import { TableRowsSkeleton } from '../../shared/components/Skeleton'
import { Check, Pencil, Plus, Shield, Trash2, UserCheck, UserX } from 'lucide-react'
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
  SelectInput,
  TextInput,
  Toast,
  cx,
} from '../../shared/components/ui'
import { SettingsTabs } from './components/SettingsTabs'
import { useAuthStore } from '../auth/authStore'
import { recordAudit, useCurrentPermissions } from '../../shared/data/auth'
import { usersStore, useUsers, useDataLoading } from '../../shared/data/store'
import { EXCLUSIVE_PERMISSIONS, PERMISSIONS } from '../../shared/data/types'
import type { AppUser, Permission } from '../../shared/data/types'

const IT_DEPARTMENT = 'إدارة الاتصالات وتقنية المعلومات'

const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]
const PERMISSION_GROUPS = Array.from(new Set(ALL_PERMISSIONS.map((p) => PERMISSIONS[p].group))).map((group) => ({
  group,
  items: ALL_PERMISSIONS.filter((p) => PERMISSIONS[p].group === group),
}))

const PERMISSION_PRESETS: { label: string; permissions: Permission[] }[] = [
  { label: 'مدير نظام (الكل)', permissions: ALL_PERMISSIONS.filter((p) => !EXCLUSIVE_PERMISSIONS.includes(p)) },
  {
    label: 'فني دعم',
    permissions: [
      'dashboard.devices',
      'dashboard.inks',
      'dashboard.subscriptions',
      'devices.view',
      'devices.manage',
      'inks.view',
      'inks.manage',
      'inks.vouchers.view',
      'inks.vouchers.create',
      'subscriptions.view',
      'dictionary.printerTypes',
      'dictionary.inkColors',
      'dictionary.brands',
    ],
  },
  {
    label: 'مسؤول أجهزة',
    permissions: ['dashboard.devices', 'devices.view', 'devices.manage', 'dictionary.deviceTypes', 'dictionary.brands'],
  },
  {
    label: 'مسؤول أحبار',
    permissions: [
      'dashboard.inks',
      'inks.view',
      'inks.manage',
      'inks.vouchers.view',
      'inks.vouchers.create',
      'inks.vouchers.approve',
      'dictionary.printerTypes',
      'dictionary.inkColors',
    ],
  },
  {
    label: 'طالب صرف أحبار',
    permissions: ['inks.vouchers.view', 'inks.vouchers.create'],
  },
  {
    label: 'مسؤول اشتراكات',
    permissions: ['dashboard.subscriptions', 'subscriptions.view', 'subscriptions.manage', 'dictionary.services'],
  },
  {
    label: 'مشاهد فقط',
    permissions: [
      'dashboard.devices',
      'dashboard.inks',
      'dashboard.subscriptions',
      'devices.view',
      'inks.view',
      'subscriptions.view',
    ],
  },
]

const PAGE_SIZE = 6

export default function Users() {
  const dataLoading = useDataLoading()
  const users = useUsers()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AppUser | 'new' | null>(null)
  const [deleting, setDeleting] = useState<AppUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (statusFilter === 'active' && !u.active) return false
      if (statusFilter === 'inactive' && u.active) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      )
    })
  }, [users, query, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const activeCount = users.filter((u) => u.active).length

  return (
    <div>
      <PageHeader
        title="المستخدمين"
        description="إضافة المستخدمين وحذفهم وإدارة صلاحيات الوصول إلى أقسام النظام."
        action={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" />
            إضافة مستخدم
          </Button>
        }
      />

      <SettingsTabs />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث بالاسم أو البريد أو الإدارة..."
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={statusFilter === 'all'}
            onClick={() => {
              setStatusFilter('all')
              setPage(1)
            }}
          >
            الكل ({users.length})
          </FilterChip>
          <FilterChip
            active={statusFilter === 'active'}
            onClick={() => {
              setStatusFilter('active')
              setPage(1)
            }}
          >
            نشط ({activeCount})
          </FilterChip>
          <FilterChip
            active={statusFilter === 'inactive'}
            onClick={() => {
              setStatusFilter('inactive')
              setPage(1)
            }}
          >
            معطّل ({users.length - activeCount})
          </FilterChip>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">الإدارة</th>
                <th className="px-4 py-3">الصلاحيات</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataLoading && users.length === 0 ? (
                <TableRowsSkeleton cols={5} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    لا يوجد مستخدمون مطابقون لنتائج البحث.
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-signal">
                          {u.name.trim().slice(0, 2)}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div dir="ltr" className="text-left text-xs text-slate-500">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.department}</td>
                    <td className="px-4 py-3">
                      {ALL_PERMISSIONS.every((p) => EXCLUSIVE_PERMISSIONS.includes(p) || u.permissions.includes(p)) ? (
                        <Pill tone="amber">
                          كامل الصلاحيات
                          {u.permissions.some((p) => EXCLUSIVE_PERMISSIONS.includes(p)) ? ' + طباعة التقارير' : ''}
                        </Pill>
                      ) : u.permissions.length === 0 ? (
                        <span className="text-xs text-slate-400">بدون صلاحيات</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.permissions.slice(0, 3).map((perm) => (
                            <span
                              key={perm}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {PERMISSIONS[perm]?.label ?? perm}
                            </span>
                          ))}
                          {u.permissions.length > 3 && (
                            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              +{u.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={u.active ? 'green' : 'slate'}>{u.active ? 'نشط' : 'معطّل'}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label={u.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          onClick={() => usersStore.update({ ...u, active: !u.active })}
                        >
                          {u.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                        </IconButton>
                        <IconButton label="تعديل المستخدم والصلاحيات" onClick={() => setEditing(u)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label="حذف المستخدم"
                          className="hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleting(u)}
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
          noun="مستخدم"
          onPage={setPage}
        />
      </div>

      <UserFormModal
        user={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          try {
            if (editing && editing !== 'new') {
              const updatedUser = { ...data, id: editing.id }
              await usersStore.updateAsync(updatedUser)
              useAuthStore.getState().syncSessionProfile(updatedUser)
              recordAudit('updated', 'app_user', `تعديل بيانات وصلاحيات المستخدم: ${data.name}`, editing.id)
              setToast(`تم تحديث بيانات "${data.name}" بنجاح`)
            } else {
              await usersStore.addAsync(data)
              recordAudit('created', 'app_user', `إضافة مستخدم: ${data.name} (${data.email})`)
              setToast(`تمت إضافة المستخدم "${data.name}" بنجاح`)
            }
            setEditing(null)
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'تعذر حفظ بيانات المستخدم على الخادم.'
            window.dispatchEvent(new CustomEvent('app:sync-error', { detail: msg }))
          }
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            usersStore.remove(deleting.id)
            recordAudit('deleted', 'app_user', `حذف المستخدم: ${deleting.name}`, deleting.id)
            setToast(`تم حذف "${deleting.name}" بنجاح`)
          }
          setDeleting(null)
        }}
      />

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />
    </div>
  )
}

function UserFormModal({
  user,
  open,
  onClose,
  onSave,
}: {
  user: AppUser | null
  open: boolean
  onClose: () => void
  onSave: (data: Omit<AppUser, 'id'>) => void
}) {
  const toUsername = (val?: string) => (val ?? '').trim().replace(/@nafusah\.com$/i, '')

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(toUsername(user?.email))
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(user?.active ?? true)
  const [permissions, setPermissions] = useState<Permission[]>(user?.permissions ?? ['dashboard.devices'])
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; permissions?: string }>({})

  const resetFor = (target: AppUser | null) => {
    setName(target?.name ?? '')
    setEmail(toUsername(target?.email))
    setPassword('')
    setActive(target?.active ?? true)
    setPermissions(target?.permissions ?? ['dashboard.devices'])
    setErrors({})
  }

  // Sync state whenever modal opens for a different user
  const [lastKey, setLastKey] = useState<string>('')
  const currentKey = open ? (user?.id ?? 'new') : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) resetFor(user)
  }

  const myPermissions = useCurrentPermissions()
  // الصلاحية الحصرية لا يغيّرها إلا من يملكها
  const canChange = (perm: Permission) => !EXCLUSIVE_PERMISSIONS.includes(perm) || myPermissions.includes(perm)

  const togglePermission = (perm: Permission) => {
    if (!canChange(perm)) return
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
    setErrors((e) => ({ ...e, permissions: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { name?: string; email?: string; password?: string; permissions?: string } = {}
    const username = email.trim().replace(/@nafusah\.com$/i, '')
    if (!name.trim()) nextErrors.name = 'يرجى إدخال اسم المستخدم'
    if (!username || /\s|@/.test(username)) {
      nextErrors.email = 'يرجى إدخال اسم المستخدم فقط بدون مسافات (يُضاف @nafusah.com تلقائياً)'
    }
    if (!user && !password.trim()) nextErrors.password = 'يرجى إدخال كلمة مرور للمستخدم الجديد'
    else if (password && password.length < 4) nextErrors.password = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل'
    if (permissions.length === 0) nextErrors.permissions = 'يرجى اختيار صلاحية واحدة على الأقل'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    // كلمة المرور تُرسل فقط إذا كُتبت؛ في التعديل تركها فارغة يبقي كلمة المرور الحالية
    const newPassword = password.trim()
    onSave({
      name: name.trim(),
      email: `${username.toLowerCase()}@nafusah.com`,
      ...(newPassword ? { password: newPassword } : {}),
      department: IT_DEPARTMENT,
      active,
      permissions,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? `تعديل المستخدم: ${user.name}` : 'إضافة مستخدم جديد'}
      description="حدد بيانات المستخدم واختر الصلاحيات المسموح له بها في النظام."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="user-form" variant="primary">
            {user ? 'حفظ التعديلات' : 'إضافة المستخدم'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الكامل" error={errors.name}>
            {(id, desc) => (
              <TextInput
                id={id}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={desc}
                placeholder="مثال: خالد العتيبي"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((err) => ({ ...err, name: undefined }))
                }}
              />
            )}
          </Field>

          <Field label="البريد الإلكتروني" error={errors.email}>
            {(id, desc) => (
              <div
                dir="ltr"
                className={cx(
                  'flex h-10 w-full items-center overflow-hidden rounded-md border bg-white focus-within:ring-1',
                  errors.email
                    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-red-600'
                    : 'border-slate-300 focus-within:border-slate-900 focus-within:ring-slate-900',
                )}
              >
                <input
                  id={id}
                  type="text"
                  inputMode="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={desc}
                  placeholder="k.alotaibi"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.replace(/@nafusah\.com$/i, ''))
                    setErrors((err) => ({ ...err, email: undefined }))
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-left text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <span className="flex h-full shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 select-none">
                  @nafusah.com
                </span>
              </div>
            )}
          </Field>

          <Field label="الإدارة">
            {(id) => <TextInput id={id} value={IT_DEPARTMENT} disabled className="bg-slate-100 text-slate-600" />}
          </Field>

          <Field label="حالة الحساب">
            {(id) => (
              <SelectInput
                id={id}
                value={active ? 'active' : 'inactive'}
                onChange={(e) => setActive(e.target.value === 'active')}
                options={[
                  { value: 'active', label: 'نشط' },
                  { value: 'inactive', label: 'معطّل' },
                ]}
              />
            )}
          </Field>

          <Field
            label={user ? 'كلمة المرور (اختياري للتغيير)' : 'كلمة المرور'}
            hint={user ? 'اتركها فارغة للإبقاء على كلمة المرور الحالية' : undefined}
            error={errors.password}
          >
            {(id, desc) => (
              <TextInput
                id={id}
                type="password"
                dir="ltr"
                aria-describedby={desc}
                aria-invalid={!!errors.password}
                value={password}
                placeholder="••••••"
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((err) => ({ ...err, password: undefined }))
                }}
              />
            )}
          </Field>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-slate-700" />
              <span className="text-sm font-bold text-slate-900">الصلاحيات</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PERMISSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    // القوالب لا تمس الصلاحيات الحصرية: تبقى كما هي
                    setPermissions((prev) => [
                      ...preset.permissions.filter((p) => !EXCLUSIVE_PERMISSIONS.includes(p)),
                      ...prev.filter((p) => EXCLUSIVE_PERMISSIONS.includes(p)),
                    ])
                    setErrors((err) => ({ ...err, permissions: undefined }))
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {PERMISSION_GROUPS.map(({ group, items }) => (
              <div key={group}>
                <div className="mb-2 text-xs font-bold text-slate-500">{group}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((perm) => {
                    const checked = permissions.includes(perm)
                    const locked = !canChange(perm)
                    return (
                      <label
                        key={perm}
                        title={locked ? 'صلاحية حصرية: لا يمنحها أو يسحبها إلا من يملكها' : undefined}
                        className={cx(
                          'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                          locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                          checked
                            ? 'border-slate-900 bg-white font-semibold text-slate-900'
                            : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() => togglePermission(perm)}
                          className="sr-only"
                        />
                        <span
                          className={cx(
                            'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                            checked ? 'border-slate-900 bg-slate-900 text-signal' : 'border-slate-300 bg-white',
                          )}
                        >
                          {checked && <Check className="size-3.5 stroke-[3]" />}
                        </span>
                        <span className="leading-snug">
                          {PERMISSIONS[perm].label}
                          {locked && <span className="block text-[11px] font-normal text-slate-500">يمنحها مالك الصلاحية فقط</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {errors.permissions && <p className="mt-2 text-xs font-medium text-red-700">{errors.permissions}</p>}
        </div>
      </form>
    </Modal>
  )
}

