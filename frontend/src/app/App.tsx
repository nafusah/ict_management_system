import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Layout from './Layout'
import SplashIntro from '../shared/components/SplashIntro'
import LoginPage from '../features/auth/LoginPage'
import Brands from '../features/dictionary/BrandsPage'
import Dashboard from '../features/dashboard/DashboardPage'
import DeviceTypes from '../features/dictionary/DeviceTypesPage'
import Devices from '../features/devices/DevicesPage'
import InkColors from '../features/dictionary/InkColorsPage'
import PrinterTypes from '../features/dictionary/PrinterTypesPage'
import Inks from '../features/inks/InksPage'
import InkVouchersPage from '../features/inks/InkVouchersPage'
import PrintersInksPage from '../features/inks/PrintersInksPage'
import ServicesSettings from '../features/dictionary/ServicesSettingsPage'
import AuditLogs from '../features/settings/AuditLogsPage'
import Employees from '../features/settings/EmployeesPage'
import Settings from '../features/settings/SettingsPage'
import Subscriptions from '../features/subscriptions/SubscriptionsPage'
import SubscriptionsSummaryPage from '../features/subscriptions/SubscriptionsSummaryPage'
import Users from '../features/settings/UsersPage'
import { useAuth, useCurrentPermissions, usePermission } from '../shared/data/auth'
import { DICTIONARY_TABS } from '../features/dictionary/components/DictionaryTabs'
import type { Permission } from '../shared/data/types'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const session = useAuth()
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequirePermission({
  allow,
  children,
}: {
  allow: Permission[]
  children: React.ReactNode
}) {
  const allowed = usePermission(allow)
  if (!allowed) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">غير مصرح بالوصول</h1>
        <p className="mt-2 text-sm text-slate-500">
          ليس لديك الصلاحية المطلوبة لعرض هذه الصفحة. تواصل مع مدير النظام لتعديل صلاحياتك.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    )
  }
  return <>{children}</>
}

function DictionaryIndexRedirect() {
  const userPerms = useCurrentPermissions()
  const firstTab = DICTIONARY_TABS.find((t) => t.permissions.some((p) => userPerms.includes(p)))
  return <Navigate to={firstTab?.to ?? '/'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <SplashIntro />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="devices"
            element={
              <RequirePermission allow={['devices.view', 'devices.manage']}>
                <Devices />
              </RequirePermission>
            }
          />
          <Route
            path="inks"
            element={
              <RequirePermission allow={['inks.view', 'inks.manage']}>
                <Inks />
              </RequirePermission>
            }
          />
          <Route
            path="inks/printers"
            element={
              <RequirePermission allow={['dashboard.inks', 'inks.view', 'inks.manage']}>
                <PrintersInksPage />
              </RequirePermission>
            }
          />
          <Route
            path="inks/vouchers"
            element={
              <RequirePermission allow={['inks.vouchers.view', 'inks.vouchers.create', 'inks.vouchers.approve']}>
                <InkVouchersPage />
              </RequirePermission>
            }
          />
          <Route
            path="subscriptions"
            element={
              <RequirePermission allow={['subscriptions.view', 'subscriptions.manage']}>
                <Subscriptions />
              </RequirePermission>
            }
          />
          <Route
            path="subscriptions/summary"
            element={
              <RequirePermission allow={['dashboard.subscriptions', 'subscriptions.view', 'subscriptions.manage']}>
                <SubscriptionsSummaryPage />
              </RequirePermission>
            }
          />
          <Route path="dictionary" element={<DictionaryIndexRedirect />} />
          <Route
            path="dictionary/device-types"
            element={
              <RequirePermission allow={['dictionary.deviceTypes']}>
                <DeviceTypes />
              </RequirePermission>
            }
          />
          <Route
            path="dictionary/printer-types"
            element={
              <RequirePermission allow={['dictionary.printerTypes', 'dictionary.inkColors']}>
                <PrinterTypes />
              </RequirePermission>
            }
          />
          <Route
            path="dictionary/ink-colors"
            element={
              <RequirePermission allow={['dictionary.inkColors']}>
                <InkColors />
              </RequirePermission>
            }
          />
          <Route
            path="dictionary/brands"
            element={
              <RequirePermission allow={['dictionary.brands']}>
                <Brands />
              </RequirePermission>
            }
          />
          <Route
            path="dictionary/services"
            element={
              <RequirePermission allow={['dictionary.services']}>
                <ServicesSettings />
              </RequirePermission>
            }
          />
          <Route
            path="settings"
            element={
              <RequirePermission allow={['settings.manage']}>
                <Settings />
              </RequirePermission>
            }
          />
          <Route
            path="settings/users"
            element={
              <RequirePermission allow={['settings.manage']}>
                <Users />
              </RequirePermission>
            }
          />
          <Route
            path="settings/employees"
            element={
              <RequirePermission allow={['employees.manage', 'settings.manage']}>
                <Employees />
              </RequirePermission>
            }
          />
          <Route
            path="settings/audit-logs"
            element={
              <RequirePermission allow={['settings.manage']}>
                <AuditLogs />
              </RequirePermission>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
