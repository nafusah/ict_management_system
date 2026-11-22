import { useEffect, useState } from 'react'
import { Clock, Mail, Plus, Send, X } from 'lucide-react'
import { SettingsTabs } from './components/SettingsTabs'
import { Button, Field, PageHeader, TextInput, Toast, cx } from '../../shared/components/ui'
import {
  fetchSettingsFromApi,
  saveSettingsToApi,
  sendTestNotificationEmail,
  type GeneralSettingsData,
} from './settingsStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const WEEKDAYS = [
  { id: 'sun', label: 'الأحد' },
  { id: 'mon', label: 'الإثنين' },
  { id: 'tue', label: 'الثلاثاء' },
  { id: 'wed', label: 'الأربعاء' },
  { id: 'thu', label: 'الخميس' },
  { id: 'fri', label: 'الجمعة' },
  { id: 'sat', label: 'السبت' },
] as const

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

export default function NotificationSettingsPage() {
  const [baseSettings, setBaseSettings] = useState<GeneralSettingsData>({
    orgName: 'إدارة الاتصالات وتقنية المعلومات',
    adminName: 'مدير النظام',
    adminEmail: 'it-admin@company.local',
    defaultInkThreshold: 3,
  })
  const [notificationToEmails, setNotificationToEmails] = useState<string[]>([])
  const [notificationCcEmails, setNotificationCcEmails] = useState<string[]>([])
  const [subscriptionToEmails, setSubscriptionToEmails] = useState<string[]>([])
  const [subscriptionCcEmails, setSubscriptionCcEmails] = useState<string[]>([])
  const [subscriptionAlertDays, setSubscriptionAlertDays] = useState<string[]>(['sun', 'mon', 'tue', 'wed', 'thu'])
  const [subscriptionAlertTime, setSubscriptionAlertTime] = useState('09:00')
  const [saving, setSaving] = useState(false)
  const [sendingTestChannel, setSendingTestChannel] = useState<'inks' | 'subscriptions' | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: 'green' | 'red' } | null>(null)

  useEffect(() => {
    void fetchSettingsFromApi().then((remote) => {
      if (!remote) return
      setBaseSettings({
        orgName: remote.orgName,
        adminName: remote.adminName,
        adminEmail: remote.adminEmail,
        defaultInkThreshold: remote.defaultInkThreshold,
      })
      setNotificationToEmails(remote.notificationToEmails ?? [])
      setNotificationCcEmails(remote.notificationCcEmails ?? [])
      setSubscriptionToEmails(remote.subscriptionToEmails ?? [])
      setSubscriptionCcEmails(remote.subscriptionCcEmails ?? [])
      setSubscriptionAlertDays(remote.subscriptionAlertDays ?? ['sun', 'mon', 'tue', 'wed', 'thu'])
      setSubscriptionAlertTime(remote.subscriptionAlertTime ?? '09:00')
    })
  }, [])

  const toggleDay = (dayId: string) => {
    setSubscriptionAlertDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSettingsToApi({
        ...baseSettings,
        notificationToEmails,
        notificationCcEmails,
        subscriptionToEmails,
        subscriptionCcEmails,
        subscriptionAlertDays,
        subscriptionAlertTime,
      })
      setToast({ message: 'تم حفظ إعدادات الإشعارات بنجاح', tone: 'green' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'تعذر حفظ إعدادات الإشعارات.',
        tone: 'red',
      })
    } finally {
      setSaving(false)
    }
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

  return (
    <div>
      <PageHeader
        title="إعدادات الإشعارات"
        description="تحديد مستلمي إشعارات البريد الإلكتروني (To / CC) للأحبار والاشتراكات والتراخيص."
      />

      <SettingsTabs />

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
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

              {group.channel === 'subscriptions' && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Clock className="size-4 text-slate-600" />
                    جدول إرسال تنبيهات الاشتراكات التلقائية
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                    <div>
                      <span className="mb-2 block text-xs font-semibold text-slate-700">أيام الإرسال</span>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAYS.map((day) => {
                          const active = subscriptionAlertDays.includes(day.id)
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleDay(day.id)}
                              className={cx(
                                'cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                                active
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
                              )}
                            >
                              {day.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <Field label="ساعة الإرسال" hint="بتوقيت الخادم">
                      {(id, desc) => (
                        <TextInput
                          id={id}
                          aria-describedby={desc}
                          type="time"
                          dir="ltr"
                          value={subscriptionAlertTime}
                          onChange={(e) => setSubscriptionAlertTime(e.target.value)}
                        />
                      )}
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ إعدادات الإشعارات'}
          </Button>
        </div>

        <Toast message={toast?.message ?? null} tone={toast?.tone ?? 'green'} onClose={() => setToast(null)} />
      </form>
    </div>
  )
}
