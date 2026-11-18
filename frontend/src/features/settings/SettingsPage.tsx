import { useEffect, useState } from 'react'
import { Building2, Database, Download, Mail, Plus, RotateCcw, Send, ShieldCheck, X } from 'lucide-react'
import { SettingsTabs } from './components/SettingsTabs'
import { Button, Field, PageHeader, TextInput, Toast } from '../../shared/components/ui'
import { downloadDatabaseBackup, fetchSettingsFromApi, saveSettingsToApi, sendTestNotificationEmail } from './settingsStore'
import { useDevices, useInks, useSubscriptions, useUsers } from '../../shared/data/store'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EmailListInput({
  label,
  hint,
  placeholder,
  emails,
  onChange,
}: {
  label: string
  hint: string
  placeholder: string
  emails: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const addEmail = () => {
    const normalized = draft.trim().toLowerCase()
    if (!normalized) return
    if (!EMAIL_RE.test(normalized)) {
      setError('يرجى إدخال بريد إلكتروني صحيح.')
      return
    }
    if (!emails.includes(normalized)) {
      onChange([...emails, normalized])
    }
    setDraft('')
    setError(null)
  }

  return (
    <Field label={label} hint={hint} error={error ?? undefined}>
      {(id, desc) => (
        <div className="space-y-2">
          <div className="flex gap-2">
            <TextInput
              id={id}
              aria-describedby={desc}
              type="email"
              dir="ltr"
              placeholder={placeholder}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addEmail()
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addEmail}>
              <Plus className="size-4" />
              إضافة
            </Button>
          </div>
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {emails.map((email) => (
                <span
                  key={email}
                  dir="ltr"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {email}
                  <button
                    type="button"
                    aria-label={`حذف ${email}`}
                    onClick={() => onChange(emails.filter((item) => item !== email))}
                    className="cursor-pointer rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  )
}

export default function Settings() {
  const devices = useDevices()
  const inks = useInks()
  const subscriptions = useSubscriptions()
  const users = useUsers()

  const [orgName, setOrgName] = useState('إدارة الاتصالات وتقنية المعلومات')
  const [adminName, setAdminName] = useState('مدير النظام')
  const [adminEmail, setAdminEmail] = useState('it-admin@company.local')
  const [defaultInkThreshold, setDefaultInkThreshold] = useState('3')
  const [notificationToEmails, setNotificationToEmails] = useState<string[]>([])
  const [notificationCcEmails, setNotificationCcEmails] = useState<string[]>([])
  const [subscriptionToEmails, setSubscriptionToEmails] = useState<string[]>([])
  const [subscriptionCcEmails, setSubscriptionCcEmails] = useState<string[]>([])
  const [sendingTestChannel, setSendingTestChannel] = useState<'inks' | 'subscriptions' | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: 'green' | 'red' } | null>(null)
  const [backingUp, setBackingUp] = useState(false)

  useEffect(() => {
    void fetchSettingsFromApi().then((remote) => {
      if (!remote) return
      setOrgName(remote.orgName)
      setAdminName(remote.adminName)
      setAdminEmail(remote.adminEmail)
      setDefaultInkThreshold(String(remote.defaultInkThreshold))
      setNotificationToEmails(remote.notificationToEmails ?? [])
      setNotificationCcEmails(remote.notificationCcEmails ?? [])
      setSubscriptionToEmails(remote.subscriptionToEmails ?? [])
      setSubscriptionCcEmails(remote.subscriptionCcEmails ?? [])
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveSettingsToApi({
      orgName: orgName.trim(),
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      defaultInkThreshold: Math.max(0, Number(defaultInkThreshold) || 0),
      notificationToEmails,
      notificationCcEmails,
      subscriptionToEmails,
      subscriptionCcEmails,
    }).catch(() => {})
    setToast({ message: 'تم حفظ الإعدادات بنجاح', tone: 'green' })
  }

  const handleSendTestEmail = async (channel: 'inks' | 'subscriptions') => {
    const to = channel === 'subscriptions' ? subscriptionToEmails : notificationToEmails
    const cc = channel === 'subscriptions' ? subscriptionCcEmails : notificationCcEmails
    if (to.length === 0) {
      setToast({ message: 'يرجى إضافة بريد واحد على الأقل في المستلمين (To) أولاً.', tone: 'red' })
      return
    }
    setSendingTestChannel(channel)
    const res = await sendTestNotificationEmail({ channel, to, cc })
    setSendingTestChannel(null)
    if (res.ok) {
      setToast({ message: res.message, tone: 'green' })
    } else {
      setToast({ message: res.error, tone: 'red' })
    }
  }

  const handleBackup = async () => {
    setBackingUp(true)
    const res = await downloadDatabaseBackup()
    setBackingUp(false)
    if (res.ok) {
      setToast({ message: 'تم تحميل النسخة الاحتياطية بنجاح', tone: 'green' })
    } else {
      setToast({ message: res.error, tone: 'red' })
    }
  }

  const handleResetStorage = () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط البيانات التجريبية إلى الوضع الافتراضي؟')) {
      localStorage.removeItem('it-management:devices')
      localStorage.removeItem('it-management:device-types')
      localStorage.removeItem('it-management:inks')
      localStorage.removeItem('it-management:ink-colors')
      localStorage.removeItem('it-management:brands')
      localStorage.removeItem('it-management:services')
      localStorage.removeItem('it-management:providers')
      localStorage.removeItem('it-management:subscriptions')
      localStorage.removeItem('it-management:users')
      localStorage.removeItem('it-management:departments')
      localStorage.removeItem('it-management:employees')
      localStorage.removeItem('it-management:audit-logs')
      window.location.reload()
    }
  }

  return (
    <div>
      <PageHeader
        title="الإعدادات"
        description="إعدادات النظام العامة وتفضيلات التنبيهات وإدارة البيانات المحلية."
      />

      <SettingsTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">بيانات الجهة والمسؤول</h2>
                <p className="text-xs text-slate-500">المعلومات الأساسية التي تظهر في النظام والتقارير</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="اسم الإدارة / الجهة">
                  {(id) => (
                    <TextInput
                      id={id}
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  )}
                </Field>
              </div>

              <Field label="اسم المسؤول">
                {(id) => (
                  <TextInput
                    id={id}
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                )}
              </Field>

              <Field label="البريد الإلكتروني">
                {(id) => (
                  <TextInput
                    id={id}
                    type="email"
                    dir="ltr"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                )}
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">تفضيلات المخزون والتنبيهات</h2>
                <p className="text-xs text-slate-500">القيم الافتراضية عند إضافة أصناف جديدة</p>
              </div>
            </div>

            <div className="max-w-xs">
              <Field
                label="حد التنبيه الافتراضي للأحبار"
                hint="الكمية الافتراضية التي يظهر عندها تنبيه انخفاض المخزون"
              >
                {(id, desc) => (
                  <TextInput
                    id={id}
                    aria-describedby={desc}
                    type="number"
                    min={0}
                    dir="ltr"
                    value={defaultInkThreshold}
                    onChange={(e) => setDefaultInkThreshold(e.target.value)}
                  />
                )}
              </Field>
            </div>
          </section>

          {[
            {
              channel: 'inks' as const,
              title: 'مستلمو إشعارات الأحبار (To / CC)',
              subtitle: 'تصلهم إشعارات صرف الأحبار وتوريد المخزون ونقص المخزون',
              to: notificationToEmails,
              setTo: setNotificationToEmails,
              cc: notificationCcEmails,
              setCc: setNotificationCcEmails,
            },
            {
              channel: 'subscriptions' as const,
              title: 'مستلمو إشعارات الاشتراكات والتراخيص (To / CC)',
              subtitle: 'تصلهم إشعارات الاشتراكات الجديدة والتجديدات والتنبيهات بقرب الانتهاء أو الانتهاء',
              to: subscriptionToEmails,
              setTo: setSubscriptionToEmails,
              cc: subscriptionCcEmails,
              setCc: setSubscriptionCcEmails,
            },
          ].map((group) => (
            <section key={group.channel} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{group.title}</h2>
                    <p className="text-xs text-slate-500">{group.subtitle}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={sendingTestChannel === group.channel}
                  onClick={() => void handleSendTestEmail(group.channel)}
                >
                  <Send className="size-4" />
                  {sendingTestChannel === group.channel ? 'جارٍ الإرسال...' : 'إرسال بريد تجريبي'}
                </Button>
              </div>

              <div className="grid gap-4">
                <EmailListInput
                  label="المستلمون الأساسيون (To)"
                  hint="أضف عناوين البريد الإلكتروني التي تصلها الرسالة مباشرة"
                  placeholder="example@nafusah.com"
                  emails={group.to}
                  onChange={group.setTo}
                />

                <EmailListInput
                  label="نسخة إلى (CC)"
                  hint="عناوين البريد الإلكتروني التي تصلها نسخة من الإشعارات"
                  placeholder="cc@nafusah.com"
                  emails={group.cc}
                  onChange={group.setCc}
                />
              </div>
            </section>
          ))}

          <div className="flex items-center justify-end gap-3">
            <Button type="submit" variant="primary">
              حفظ التغييرات
            </Button>
          </div>
          <Toast message={toast?.message ?? null} tone={toast?.tone ?? 'green'} onClose={() => setToast(null)} />
        </form>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Database className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">ملخص البيانات</h2>
                <p className="text-xs text-slate-500">البيانات المخزنة حاليًا في المتصفح</p>
              </div>
            </div>

            <dl className="space-y-3 border-y border-slate-100 py-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">إجمالي الأجهزة المسجلة</dt>
                <dd className="font-mono font-bold text-slate-900">{devices.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">أصناف الأحبار المسجلة</dt>
                <dd className="font-mono font-bold text-slate-900">{inks.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">الاشتراكات والتراخيص</dt>
                <dd className="font-mono font-bold text-slate-900">{subscriptions.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">المستخدمون المسجلون</dt>
                <dd className="font-mono font-bold text-slate-900">{users.length}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2.5">
              <Button
                variant="secondary"
                className="w-full"
                disabled={backingUp}
                onClick={() => void handleBackup()}
              >
                <Download className="size-4" />
                {backingUp ? 'جارٍ تجهيز النسخة...' : 'تحميل نسخة احتياطية (.sql)'}
              </Button>
              <Button className="w-full" onClick={handleResetStorage}>
                <RotateCcw className="size-4" />
                إعادة ضبط البيانات الافتراضية
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

