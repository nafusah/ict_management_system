import { useMemo, useState } from 'react'
import { Building2, KeyRound, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { DictionaryTabs } from './components/DictionaryTabs'
import { Button, ConfirmDelete, Field, IconButton, Modal, PageHeader, Pill, TextInput } from '../../shared/components/ui'
import { providersStore, servicesStore, useProviders, useSubscriptions, useServices } from '../../shared/data/store'
import type { ServiceItem, ServiceProviderItem } from '../../shared/data/types'

type TargetKind = 'service' | 'provider'
type CatalogEntry = ServiceItem | ServiceProviderItem

export default function ServicesSettings() {
  const services = useServices()
  const providers = useProviders()
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

  return (
    <div>
      <PageHeader
        title="الخدمات والمزودون"
        description="إدارة قوائم أسماء الخدمات ومزودي الخدمة المستخدمة في تسجيل الاشتراكات."
      />

      <DictionaryTabs />

      <div className="grid gap-6 lg:grid-cols-2">
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

      <NameFormModal
        open={modal !== null}
        kind={modal?.kind ?? 'service'}
        item={modal?.item ?? null}
        onClose={() => setModal(null)}
        onSave={({ name, email, phone }) => {
          if (!modal) return
          if (modal.kind === 'service') {
            if (modal.item) servicesStore.update({ id: modal.item.id, name })
            else servicesStore.add({ name })
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
            const store = deleting.kind === 'service' ? servicesStore : providersStore
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
            const used = counts[item.name] ?? 0
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
  item: { id: string; name: string; email?: string; phone?: string } | null
  onClose: () => void
  onSave: (data: { name: string; email?: string; phone?: string }) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [email, setEmail] = useState(item?.email ?? '')
  const [phone, setPhone] = useState(item?.phone ?? '')
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})
  const [lastKey, setLastKey] = useState('')

  const currentKey = open ? `${kind}-${item?.id ?? 'new'}` : 'closed'
  if (currentKey !== lastKey) {
    setLastKey(currentKey)
    if (open) {
      setName(item?.name ?? '')
      setEmail(item?.email ?? '')
      setPhone(item?.phone ?? '')
      setErrors({})
    }
  }

  const isService = kind === 'service'
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { name?: string; email?: string; phone?: string } = {}
    if (!name.trim()) {
      nextErrors.name = isService ? 'يرجى إدخال اسم الخدمة' : 'يرجى إدخال اسم مزود الخدمة'
    }
    if (!isService) {
      if (!email.trim() || !email.includes('@')) nextErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'
      if (!phone.trim()) nextErrors.phone = 'يرجى إدخال رقم الهاتف'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSave({
      name: name.trim(),
      email: isService ? undefined : email.trim(),
      phone: isService ? undefined : phone.trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        item
          ? isService
            ? 'تعديل اسم الخدمة'
            : 'تعديل مزود الخدمة'
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
        <Field label={isService ? 'اسم الخدمة' : 'اسم المزود'} error={errors.name}>
          {(id, desc) => (
            <TextInput
              id={id}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={desc}
              placeholder={isService ? 'مثال: Microsoft 365 Business' : 'مثال: Microsoft'}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((err) => ({ ...err, name: undefined }))
              }}
              autoFocus
            />
          )}
        </Field>

        {!isService && (
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

