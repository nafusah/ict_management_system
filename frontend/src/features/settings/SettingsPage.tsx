import { useState } from 'react'
import { Building2, Check, Database, RotateCcw, ShieldCheck } from 'lucide-react'
import { SettingsTabs } from './components/SettingsTabs'
import { Button, Field, PageHeader, TextInput } from '../../shared/components/ui'
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
  const [savedNotice, setSavedNotice] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
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
              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Check className="size-4" />
                  تم حفظ الإعدادات بنجاح
                </span>
              )}
              <Button type="submit" variant="primary">
                حفظ التغييرات
              </Button>
            </div>
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

            <div className="mt-4">
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

