import { useEffect, useState } from 'react'
import { Building2, Database, Download, RotateCcw, ShieldCheck } from 'lucide-react'
import { SettingsTabs } from './components/SettingsTabs'
import { Button, Field, PageHeader, TextInput, Toast } from '../../shared/components/ui'
import { downloadDatabaseBackup, fetchSettingsFromApi, saveSettingsToApi } from './settingsStore'
import { useDevices, useInks, useSubscriptions, useUsers } from '../../shared/data/store'

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
  const [subscriptionAlertDays, setSubscriptionAlertDays] = useState<string[]>(['sun', 'mon', 'tue', 'wed', 'thu'])
  const [subscriptionAlertTime, setSubscriptionAlertTime] = useState('09:00')
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
      setSubscriptionAlertDays(remote.subscriptionAlertDays ?? ['sun', 'mon', 'tue', 'wed', 'thu'])
      setSubscriptionAlertTime(remote.subscriptionAlertTime ?? '09:00')
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
      subscriptionAlertDays,
      subscriptionAlertTime,
    }).catch(() => { })
    setToast({ message: 'تم حفظ الإعدادات بنجاح', tone: 'green' })
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

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button type="submit" variant="primary">
                حفظ التغييرات
              </Button>
            </div>
            <Toast message={toast?.message ?? null} tone={toast?.tone ?? 'green'} onClose={() => setToast(null)} />
          </section>
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

