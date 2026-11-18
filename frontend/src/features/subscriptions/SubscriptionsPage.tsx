import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, KeyRound, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
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
import { recordAudit, usePermission } from '../../shared/data/auth'
import {
  subscriptionsStore,
  useDepartments,
  useProviders,
  useServices,
  useSubscriptionCategories,
  useSubscriptions,
} from '../../shared/data/store'
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  daysUntilExpiry,
  getSubscriptionStatus,
} from '../../shared/data/types'
import type { Subscription, SubscriptionCategory, SubscriptionStatus } from '../../shared/data/types'

const PAGE_SIZE = 10

const STATUS_TONE: Record<SubscriptionStatus, 'green' | 'amber' | 'red' | 'slate'> = {
  active: 'green',
  expiring: 'amber',
  expired: 'red',
  cancelled: 'slate',
}

function formatDaysNote(days: number, cancelled: boolean) {
  if (cancelled) return 'تم إلغاء الاشتراك'
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`
  if (days === 0) return 'ينتهي اليوم'
  if (days === 1) return 'ينتهي غداً'
  return `متبقي ${days} يوم`
}

function addOneYear(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Subscriptions() {
  const canManage = usePermission('subscriptions.manage')
  const subscriptions = useSubscriptions()
  const categories = useSubscriptionCategories()
  const providers = useProviders()
  const providerMap = useMemo(
    () => Object.fromEntries(providers.map((p) => [p.name, p])),
    [providers],
  )
  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const k of Object.keys(SUBSCRIPTION_CATEGORIES)) map[k] = SUBSCRIPTION_CATEGORIES[k].label
    for (const c of categories) map[c.id] = c.name
    return map
  }, [categories])
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Subscription | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Subscription | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const viewing = useMemo(
    () => subscriptions.find((s) => s.id === viewingId) ?? null,
    [subscriptions, viewingId],
  )

  const statusParam = params.get('status')
  const statusFilter =
    statusParam && statusParam in SUBSCRIPTION_STATUSES ? (statusParam as SubscriptionStatus) : null
  const categoryParam = params.get('category')
  const categoryFilter = categoryParam ? categoryParam : null

  const setFilter = (key: 'status' | 'category', value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const statusCounts = useMemo(() => {
    const counts: Record<SubscriptionStatus, number> = { active: 0, expiring: 0, expired: 0, cancelled: 0 }
    for (const s of subscriptions) counts[getSubscriptionStatus(s)] += 1
    return counts
  }, [subscriptions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return subscriptions
      .filter((s) => {
        const st = getSubscriptionStatus(s)
        if (statusFilter && st !== statusFilter) return false
        if (categoryFilter && s.category !== categoryFilter) return false
        if (!q) return true
        return [
          s.serviceName,
          s.provider,
          s.poNumber,
          s.department ?? '',
          s.serviceLocation ?? '',
          providerMap[s.provider]?.phone ?? '',
          providerMap[s.provider]?.email ?? '',
          categoryLabelMap[s.category] ?? s.category,
        ].some((v) => v.toLowerCase().includes(q))
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate))
  }, [subscriptions, query, statusFilter, categoryFilter, categoryLabelMap, providerMap])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="الاشتراكات والتراخيص"
        description="متابعة تراخيص البرمجيات والخدمات السحابية وتواريخ الانتهاء وأوامر الشراء."
        action={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              إضافة اشتراك
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ابحث باسم الخدمة أو المزود أو رقم أمر الشراء"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب الحالة">
          <FilterChip active={!statusFilter} onClick={() => setFilter('status', null)}>
            الكل ({subscriptions.length})
          </FilterChip>
          {(Object.keys(SUBSCRIPTION_STATUSES) as SubscriptionStatus[]).map((st) => (
            <FilterChip key={st} active={statusFilter === st} onClick={() => setFilter('status', st)}>
              {SUBSCRIPTION_STATUSES[st].label} ({statusCounts[st]})
            </FilterChip>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب التصنيف">
            <FilterChip active={!categoryFilter} onClick={() => setFilter('category', null)}>
              كل التصنيفات
            </FilterChip>
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                active={categoryFilter === cat.id}
                onClick={() => setFilter('category', cat.id)}
              >
                <bdi>{cat.name}</bdi>
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الخدمة والمزود</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الإدارة وأمر الشراء</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">تاريخ الانتهاء</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  <span className="sr-only">الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((sub) => {
                const status = getSubscriptionStatus(sub)
                const days = daysUntilExpiry(sub.endDate)
                return (
                  <tr
                    key={sub.id}
                    onClick={() => setViewingId(sub.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <KeyRound className="size-5" />
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">
                            <bdi>{sub.serviceName}</bdi>
                          </div>
                          <div className="text-xs text-slate-500">
                            <bdi>{sub.provider}</bdi> • {categoryLabelMap[sub.category] ?? sub.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {sub.serviceLocation || sub.department || '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {sub.serviceLocation && sub.department ? `${sub.department} • ` : ''}
                        <span className="font-mono"><bdi>{sub.poNumber || '—'}</bdi></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div dir="ltr" className="text-right font-mono text-xs font-semibold text-slate-800">
                        {sub.endDate}
                      </div>
                      <div
                        className={cx(
                          'text-xs',
                          status === 'expired'
                            ? 'font-semibold text-red-700'
                            : status === 'expiring'
                              ? 'font-semibold text-yellow-800'
                              : 'text-slate-500',
                        )}
                      >
                        {formatDaysNote(days, sub.cancelled)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={STATUS_TONE[status]}>{SUBSCRIPTION_STATUSES[status].label}</Pill>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="secondary"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => setViewingId(sub.id)}
                        >
                          التفاصيل
                        </Button>
                        {canManage && (
                          <>
                            <IconButton label={`تعديل ${sub.serviceName}`} onClick={() => setEditing(sub)}>
                              <Pencil className="size-4" />
                            </IconButton>
                            <IconButton
                              label={`حذف ${sub.serviceName}`}
                              className="hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleting(sub)}
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

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold">
              {subscriptions.length === 0 ? 'لا توجد اشتراكات مسجلة بعد.' : 'لا توجد اشتراكات تطابق البحث.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {subscriptions.length === 0 ? 'أضف أول اشتراك أو ترخيص ليظهر هنا.' : 'غيّر كلمة البحث أو أزل الفلاتر.'}
            </p>
          </div>
        )}

        <Pagination
          page={current}
          pageCount={pageCount}
          shown={rows.length}
          total={filtered.length}
          noun="اشتراك"
          onPage={setPage}
        />
      </div>

      {viewing && (
        <SubscriptionDetailsModal
          subscription={viewing}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            const target = viewing
            setViewingId(null)
            setEditing(target)
          }}
        />
      )}

      {editing && (
        <SubscriptionFormModal
          subscription={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSuccess={(msg) => setToast(msg)}
        />
      )}

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.serviceName ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            subscriptionsStore.remove(deleting.id)
            recordAudit('deleted', 'subscription', `حذف اشتراك: ${deleting.serviceName}`, deleting.id)
            setToast(`تم حذف اشتراك "${deleting.serviceName}" بنجاح`)
          }
          setDeleting(null)
        }}
      />

      <Toast message={toast} tone="green" onClose={() => setToast(null)} />
    </>
  )
}

function SubscriptionDetailsModal({
  subscription,
  onClose,
  onEdit,
}: {
  subscription: Subscription
  onClose: () => void
  onEdit: () => void
}) {
  const providers = useProviders()
  const providerMeta = providers.find((p) => p.name === subscription.provider)
  const categories = useSubscriptionCategories()
  const categoryName =
    categories.find((c) => c.id === subscription.category)?.name ??
    SUBSCRIPTION_CATEGORIES[subscription.category]?.label ??
    subscription.category
  const [notice, setNotice] = useState<string | null>(null)
  const status = getSubscriptionStatus(subscription)
  const days = daysUntilExpiry(subscription.endDate)

  const handleRenewYear = () => {
    const baseDate = days < 0 ? new Date().toISOString().slice(0, 10) : subscription.endDate
    const nextEnd = addOneYear(baseDate)
    subscriptionsStore.update({
      ...subscription,
      endDate: nextEnd,
      cancelled: false,
    })
    setNotice(`تم تجديد الاشتراك لمدة سنة إضافية حتى ${nextEnd}.`)
  }

  const handleToggleCancel = () => {
    const nextCancelled = !subscription.cancelled
    subscriptionsStore.update({
      ...subscription,
      cancelled: nextCancelled,
    })
    setNotice(nextCancelled ? 'تم إلغاء الاشتراك.' : 'تمت إعادة تفعيل الاشتراك.')
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="تفاصيل الاشتراك والترخيص"
      description="مراجعة تفاصيل العقد وتاريخ الانتهاء والتجديد."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button onClick={onEdit}>
            <Pencil className="size-4" />
            تعديل البيانات
          </Button>
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                <bdi>{subscription.serviceName}</bdi>
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">
                <bdi>{subscription.provider}</bdi> • {categoryName}
              </p>
            </div>
            <Pill tone={STATUS_TONE[status]}>{SUBSCRIPTION_STATUSES[status].label}</Pill>
          </div>

          <dl className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">موقع الخدمة</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{subscription.serviceLocation || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">الإدارة المستفيدة</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{subscription.department || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">رقم أمر الشراء (PO)</dt>
              <dd className="mt-0.5 font-mono font-semibold text-slate-900">{subscription.poNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">تاريخ البدء</dt>
              <dd dir="ltr" className="mt-0.5 text-right font-mono font-semibold text-slate-900">
                {subscription.startDate || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">تاريخ الانتهاء</dt>
              <dd dir="ltr" className="mt-0.5 text-right font-mono font-semibold text-slate-900">
                {subscription.endDate}{' '}
                <span className="font-sans text-xs font-normal text-slate-500">
                  ({formatDaysNote(days, subscription.cancelled)})
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">التنبيه قبل الانتهاء</dt>
              <dd className="mt-0.5 font-medium text-slate-800">قبل {subscription.alertDaysBefore} يوم</dd>
            </div>
            {(providerMeta?.email || providerMeta?.phone) && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">بيانات التواصل مع المزود</dt>
                <dd className="mt-0.5 flex flex-wrap gap-4 font-mono text-xs text-slate-800">
                  {providerMeta.email && <span dir="ltr">{providerMeta.email}</span>}
                  {providerMeta.phone && <span dir="ltr">{providerMeta.phone}</span>}
                </dd>
              </div>
            )}
          </dl>

          {subscription.notes && (
            <div className="mt-4 border-t border-slate-200 pt-3 text-xs leading-6 text-slate-600">
              <strong className="text-slate-800">ملاحظات: </strong>
              {subscription.notes}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <CalendarClock className="size-4 text-slate-700" />
            إجراءات سريعة على الاشتراك
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={handleRenewYear}>
              <RefreshCw className="size-4" />
              تجديد لمدة سنة إضافية
            </Button>
            <Button variant="secondary" onClick={handleToggleCancel}>
              {subscription.cancelled ? 'إعادة تفعيل الاشتراك' : 'إلغاء الاشتراك'}
            </Button>
          </div>
          {notice && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              {notice}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

function SubscriptionFormModal({
  subscription,
  onClose,
  onSuccess,
}: {
  subscription: Subscription | null
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const services = useServices()
  const providers = useProviders()
  const categories = useSubscriptionCategories()
  const isEdit = subscription !== null
  const todayStr = new Date().toISOString().slice(0, 10)

  const serviceOptions = useMemo(() => {
    const names = services.map((s) => s.name)
    if (subscription?.serviceName && !names.includes(subscription.serviceName)) {
      names.unshift(subscription.serviceName)
    }
    return names
  }, [services, subscription])

  const providerOptions = useMemo(() => {
    const names = providers.map((p) => p.name)
    if (subscription?.provider && !names.includes(subscription.provider)) {
      names.unshift(subscription.provider)
    }
    return names
  }, [providers, subscription])

  const departments = useDepartments()
  const deptNames = useMemo(() => {
    const names = departments.map((d) => d.name)
    if (subscription?.department && !names.includes(subscription.department)) {
      return [subscription.department, ...names]
    }
    return names
  }, [departments, subscription])

  const [serviceName, setServiceName] = useState(subscription?.serviceName ?? serviceOptions[0] ?? '')
  const [provider, setProvider] = useState(subscription?.provider ?? providerOptions[0] ?? '')
  const [category, setCategory] = useState<SubscriptionCategory>(
    subscription?.category ?? categories[0]?.id ?? 'software',
  )
  const [poNumber, setPoNumber] = useState(subscription?.poNumber ?? '')
  const [department, setDepartment] = useState(subscription?.department ?? '')
  const [serviceLocation, setServiceLocation] = useState(subscription?.serviceLocation ?? '')
  const [startDate, setStartDate] = useState(subscription?.startDate ?? '')
  const [endDate, setEndDate] = useState(subscription?.endDate ?? addOneYear(todayStr))
  const [alertDaysBefore, setAlertDaysBefore] = useState(String(subscription?.alertDaysBefore ?? 30))
  const [notes, setNotes] = useState(subscription?.notes ?? '')
  const [submitted, setSubmitted] = useState(false)

  const selectedProviderMeta = useMemo(
    () => providers.find((p) => p.name === provider),
    [providers, provider],
  )

  const parsedAlert = Number(alertDaysBefore)

  const errors = {
    serviceName: !serviceName.trim() ? 'اختر اسم الخدمة من الإعدادات.' : undefined,
    provider: !provider.trim() ? 'اختر مزود الخدمة من الإعدادات.' : undefined,
    endDate:
      !endDate || (startDate && endDate < startDate)
        ? 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.'
        : undefined,
    alertDaysBefore:
      alertDaysBefore.trim() === '' || Number.isNaN(parsedAlert) || parsedAlert < 0
        ? 'أدخل عدد أيام تنبيه صحيح.'
        : undefined,
  }
  const show = (e?: string) => (submitted ? e : undefined)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return

    const data: Omit<Subscription, 'id'> = {
      serviceName: serviceName.trim(),
      provider: provider.trim(),
      category,
      poNumber: poNumber.trim(),
      department: department.trim() || undefined,
      serviceLocation: serviceLocation.trim() || undefined,
      startDate: startDate || undefined,
      endDate,
      alertDaysBefore: Math.floor(parsedAlert),
      cancelled: subscription?.cancelled ?? false,
      notes: notes.trim(),
    }

    if (isEdit) {
      subscriptionsStore.update({ ...data, id: subscription.id })
      recordAudit('updated', 'subscription', `تعديل اشتراك: ${data.serviceName}`, subscription.id)
      onSuccess('تم حفظ تعديلات الاشتراك بنجاح')
    } else {
      subscriptionsStore.add(data)
      recordAudit(
        'created',
        'subscription',
        `إضافة اشتراك: ${data.serviceName}${data.serviceLocation ? ` (${data.serviceLocation})` : data.department ? ` (${data.department})` : ''}`,
      )
      onSuccess('تمت إضافة الاشتراك بنجاح')
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'تعديل الاشتراك' : 'إضافة اشتراك أو ترخيص جديد'}
      description="سجّل تفاصيل الاشتراك وتاريخ انتهائه لتصلك تنبيهات قبل الانتهاء."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button variant="primary" type="submit" form="subscription-form">
            {isEdit ? 'حفظ التعديلات' : 'إضافة الاشتراك'}
          </Button>
        </>
      }
    >
      <form id="subscription-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم الخدمة / الترخيص" error={show(errors.serviceName)}>
          {(id, d) => (
            <SelectInput
              id={id}
              aria-describedby={d}
              aria-invalid={!!show(errors.serviceName)}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              options={
                serviceOptions.length > 0
                  ? serviceOptions.map((n) => ({ value: n, label: n }))
                  : [{ value: '', label: 'أضف خدمات من الإعدادات أولاً' }]
              }
            />
          )}
        </Field>

        <Field
          label="مزود الخدمة"
          error={show(errors.provider)}
          hint={
            selectedProviderMeta && (selectedProviderMeta.phone || selectedProviderMeta.email)
              ? [selectedProviderMeta.phone, selectedProviderMeta.email].filter(Boolean).join(' • ')
              : undefined
          }
        >
          {(id, d) => (
            <SelectInput
              id={id}
              aria-describedby={d}
              aria-invalid={!!show(errors.provider)}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              options={
                providerOptions.length > 0
                  ? providerOptions.map((n) => ({ value: n, label: n }))
                  : [{ value: '', label: 'أضف مزودين من الإعدادات أولاً' }]
              }
            />
          )}
        </Field>

        <Field label="التصنيف">
          {(id) => (
            <SelectInput
              id={id}
              value={category}
              onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
              options={
                categories.length > 0
                  ? categories.map((c) => ({ value: c.id, label: c.name }))
                  : Object.keys(SUBSCRIPTION_CATEGORIES).map((k) => ({
                    value: k,
                    label: SUBSCRIPTION_CATEGORIES[k].label,
                  }))
              }
            />
          )}
        </Field>

        <Field label="موقع الخدمة" hint="مثل: Field أو Tripoli Office">
          {(id) => (
            <TextInput
              id={id}
              placeholder="Field / Tripoli Office"
              value={serviceLocation}
              onChange={(e) => setServiceLocation(e.target.value)}
            />
          )}
        </Field>

        <Field label="الإدارة المستفيدة (اختياري)">
          {(id) => (
            <SearchableSelect
              id={id}
              value={department}
              onChange={setDepartment}
              options={[
                { value: '', label: '— غير محدد —' },
                ...deptNames.map((d) => ({ value: d, label: d })),
              ]}
              searchPlaceholder="ابحث عن إدارة..."
            />
          )}
        </Field>

        <Field label="تاريخ البدء (اختياري)">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              dir="ltr"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          )}
        </Field>

        <Field label="تاريخ الانتهاء" error={show(errors.endDate)}>
          {(id, d) => (
            <TextInput
              id={id}
              type="date"
              dir="ltr"
              aria-describedby={d}
              aria-invalid={!!show(errors.endDate)}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          )}
        </Field>

        <Field label="رقم أمر الشراء (PO)">
          {(id) => (
            <TextInput
              id={id}
              dir="ltr"
              placeholder="PO-2026-104"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          )}
        </Field>

        <Field label="التنبيه قبل الانتهاء (أيام)" error={show(errors.alertDaysBefore)}>
          {(id, d) => (
            <TextInput
              id={id}
              type="number"
              min={0}
              dir="ltr"
              aria-describedby={d}
              aria-invalid={!!show(errors.alertDaysBefore)}
              value={alertDaysBefore}
              onChange={(e) => setAlertDaysBefore(e.target.value)}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field label="ملاحظات">
            {(id) => (
              <TextInput
                id={id}
                placeholder="عدد الرخص أو تفاصيل إضافية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </Field>
        </div>
      </form>
    </Modal>
  )
}

