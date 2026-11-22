import { useMemo, useState } from 'react'
import { Building2, KeyRound, Layers, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { DictionaryTabs } from './components/DictionaryTabs'
import { Button, ConfirmDelete, Field, IconButton, Modal, PageHeader, Pill, SelectInput, TextInput } from '../../shared/components/ui'
import {
  providersStore,
  servicesStore,
  subscriptionCategoriesStore,
  useProviders,
  useServices,
  useSubscriptionCategories,
  useSubscriptions,
} from '../../shared/data/store'
import type { ServiceItem, ServiceProviderItem, SubscriptionCategoryIcon, SubscriptionCategoryItem } from '../../shared/data/types'

type TargetKind = 'service' | 'provider' | 'category'
type CatalogEntry = ServiceItem | ServiceProviderItem | SubscriptionCategoryItem

const CATEGORY_ICON_OPTIONS: { value: SubscriptionCategoryIcon; label: string }[] = [
  { value: 'wifi', label: 'إنترنت / اتصال لاسلكي' },
  { value: 'network', label: 'شبكات واتصالات' },
  { value: 'monitor', label: 'برمجيات وتطبيقات' },
  { value: 'cloud', label: 'خدمات سحابية' },
  { value: 'security', label: 'أمن سيبراني وحماية' },
  { value: 'layers', label: 'تصنيف عام / أخرى' },
]

export default function ServicesSettings() {
  const services = useServices()
  const providers = useProviders()
  const categories = useSubscriptionCategories()
  const subscriptions = useSubscriptions()

  const [modal, setModal] = useState<{ kind: TargetKind; item: CatalogEntry | null } | null>(null)
  const [deleting, setDeleting] = useState<{ kind: TargetKind; item: CatalogEntry } | null>(null)

  const serviceCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of subscriptions) map[s.serviceName] = (map[s.serviceName] ?? 0) + 1
    return map
  }, [subscriptions])

  const providerCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of subscriptions) map[s.provider] = (map[s.provider] ?? 0) + 1
    return map
  }, [subscriptions])

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of subscriptions) map[s.category] = (map[s.category] ?? 0) + 1
    return map
  }, [subscriptions])

  return (
    <div>
      <PageHeader
        title="الخدمات والتصنيفات والمزودون"
        description="إدارة قوائم أسماء الخدمات وتصنيفات الاشتراكات ومزودي الخدمة."
      />

      <DictionaryTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <CatalogCard
          title="تصنيفات الاشتراكات"
          subtitle="التصنيفات المستخدمة لتجميع الاشتراكات (مثل: إنترنت، برمجيات، خدمات سحابية)"
          icon={<Layers className="size-5" />}
          addLabel="إضافة تصنيف"
          items={categories}
          counts={categoryCounts}
          countBy="id"
          onAdd={() => setModal({ kind: 'category', item: null })}
          onEdit={(item) => setModal({ kind: 'category', item })}
          onDelete={(item) => setDeleting({ kind: 'category', item })}
        />

        <CatalogCard
          title="أسماء الخدمات"
          subtitle="البرمجيات والخدمات المتاحة للاختيار عند إضافة اشتراك"
          icon={<KeyRound className="size-5" />}
          addLabel="إضافة خدمة"
          items={services}
          counts={serviceCounts}
          onAdd={() => setModal({ kind: 'service', item: null })}
          onEdit={(item) => setModal({ kind: 'service', item })}
          onDelete={(item) => setDeleting({ kind: 'service', item })}
        />

        <div className="lg:col-span-2">
          <CatalogCard
            title="مزودو الخدمة"
            subtitle="الشركات والموردون المعتمدون للاشتراكات والتراخيص"
            icon={<Building2 className="size-5" />}
            addLabel="إضافة مزود"
            items={providers}
            counts={providerCounts}
            onAdd={() => setModal({ kind: 'provider', item: null })}
            onEdit={(item) => setModal({ kind: 'provider', item })}
            onDelete={(item) => setDeleting({ kind: 'provider', item })}
          />
        </div>
      </div>

      <NameFormModal
        open={modal !== null}
        kind={modal?.kind ?? 'service'}
        item={modal?.item ?? null}
        onClose={() => setModal(null)}
        onSave={({ name, email, phone, icon }) => {
          if (!modal) return
          if (modal.kind === 'service') {
            if (modal.item) servicesStore.update({ id: modal.item.id, name })
            else servicesStore.add({ name })
          } else if (modal.kind === 'category') {
            if (modal.item) {
              subscriptionCategoriesStore.update({ id: modal.item.id, name, icon: icon ?? 'layers' })
            } else {
              subscriptionCategoriesStore.add({ name, icon: icon ?? 'layers' })
            }
          } else {
            if (modal.item) providersStore.update({ id: modal.item.id, name, email, phone })
            else providersStore.add({ name, email, phone })
          }
          setModal(null)
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        itemName={deleting?.item.name ?? ''}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            const store =
              deleting.kind === 'service'
                ? servicesStore
                : deleting.kind === 'category'
                  ? subscriptionCategoriesStore
                  : providersStore
            store.remove(deleting.item.id)
          }
          setDeleting(null)
        }}
      />
    </div>
  )
}

function CatalogCard({
  title,
  subtitle,
  icon,
  addLabel,
  items,
  counts,
  countBy = 'name',
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  addLabel: string
  items: { id: string; name: string; email?: string; phone?: string }[]
  counts: Record<string, number>
  countBy?: 'id' | 'name'
  onAdd: () => void
  onEdit: (item: CatalogEntry) => void
  onDelete: (item: CatalogEntry) => void
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <Button variant="primary" className="h-9 px-3 text-xs" onClick={onAdd}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-slate-500">لا توجد عناصر مسجلة بعد.</li>
        ) : (
          items.map((item) => {
            const used = counts[countBy === 'id' ? item.id : item.name] ?? 0
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/70">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">
                    <bdi>{item.name}</bdi>
                  </div>
                  {(item.email || item.phone) && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      {item.email && (
                        <span dir="ltr" className="inline-flex items-center gap-1">
                          <Mail className="size-3" />
                          {item.email}
                        </span>
                      )}
                      {item.phone && (
                        <span dir="ltr" className="inline-flex items-center gap-1 font-mono">
                          <Phone className="size-3" />
                          {item.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={used > 0 ? 'blue' : 'slate'}>{used} اشتراك</Pill>
                  <IconButton label={`تعديل ${item.name}`} onClick={() => onEdit(item)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label={used > 0 ? 'مستخدم في الاشتراكات' : `حذف ${item.name}`}
                    disabled={used > 0}
                    className="hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}

function NameFormModal({
  open,
  kind,
  item,
  onClose,
  onSave,
}: {
  open: boolean
  kind: TargetKind
  item: { id: string; name: string; email?: string; phone?: string; icon?: SubscriptionCategoryIcon } | null
  onClose: () => void
  onSave: (data: { name: string; email?: string; phone?: string; icon?: SubscriptionCategoryIcon }) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [email, setEmail] = useState(item?.email ?? '')
  const [phone, setPhone] = useState(item?.phone ?? '')
  const [icon, setIcon] = useState<SubscriptionCategoryIcon>(item?.icon ?? 'layers')
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})
  const [lastKey, setLastKey] = useState('')

  const currentKey = open ? `${kind}-${item?.id ?? 'new'}` : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) {
      setName(item?.name ?? '')
      setEmail(item?.email ?? '')
      setPhone(item?.phone ?? '')
      setIcon(item?.icon ?? 'layers')
      setErrors({})
    }
  }

  const isService = kind === 'service'
  const isCategory = kind === 'category'
  const isProvider = kind === 'provider'
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { name?: string; email?: string; phone?: string } = {}
    if (!name.trim()) {
      nextErrors.name = isCategory
        ? 'يرجى إدخال اسم التصنيف'
        : isService
          ? 'يرجى إدخال اسم الخدمة'
          : 'يرجى إدخال اسم مزود الخدمة'
    }
    if (isProvider) {
      if (!email.trim() || !email.includes('@')) nextErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'
      if (!phone.trim()) nextErrors.phone = 'يرجى إدخال رقم الهاتف'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSave({
      name: name.trim(),
      email: isProvider ? email.trim() : undefined,
      phone: isProvider ? phone.trim() : undefined,
      icon: isCategory ? icon : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        item
          ? isCategory
            ? 'تعديل تصنيف الاشتراك'
            : isService
              ? 'تعديل اسم الخدمة'
              : 'تعديل مزود الخدمة'
          : isCategory
            ? 'إضافة تصنيف اشتراك جديد'
            : isService
              ? 'إضافة خدمة جديدة'
              : 'إضافة مزود خدمة جديد'
      }
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="catalog-name-form" variant="primary">
            {item ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </>
      }
    >
      <form id="catalog-name-form" onSubmit={submit} className="space-y-4">
        <Field
          label={isCategory ? 'اسم التصنيف' : isService ? 'اسم الخدمة' : 'اسم المزود'}
          error={errors.name}
        >
          {(id, desc) => (
            <TextInput
              id={id}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={desc}
              placeholder={
                isCategory
                  ? 'مثال: إنترنت'
                  : isService
                    ? 'مثال: Microsoft 365 Business'
                    : 'مثال: Microsoft'
              }
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((err) => ({ ...err, name: undefined }))
              }}
              autoFocus
            />
          )}
        </Field>

        {isCategory && (
          <Field label="الأيقونة">
            {(id) => (
              <SelectInput
                id={id}
                value={icon}
                onChange={(e) => setIcon(e.target.value as SubscriptionCategoryIcon)}
                options={CATEGORY_ICON_OPTIONS}
              />
            )}
          </Field>
        )}

        {isProvider && (
          <>
            <Field label="البريد الإلكتروني" error={errors.email}>
              {(id, desc) => (
                <TextInput
                  id={id}
                  type="email"
                  dir="ltr"
                  className="text-right"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={desc}
                  placeholder="support@provider.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((err) => ({ ...err, email: undefined }))
                  }}
                />
              )}
            </Field>

            <Field label="رقم الهاتف" error={errors.phone}>
              {(id, desc) => (
                <TextInput
                  id={id}
                  dir="ltr"
                  className="text-right font-mono"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={desc}
                  placeholder="+218 91 000 0000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setErrors((err) => ({ ...err, phone: undefined }))
                  }}
                />
              )}
            </Field>
          </>
        )}
      </form>
    </Modal>
  )
}

