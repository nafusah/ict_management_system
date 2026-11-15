import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import LoginPage from '../features/auth/LoginPage'
import Brands from '../features/dictionary/BrandsPage'
import Dashboard from '../features/dashboard/DashboardPage'
import DeviceTypes from '../features/dictionary/DeviceTypesPage'
import Devices from '../features/devices/DevicesPage'
import InkColors from '../features/dictionary/InkColorsPage'
import Inks from '../features/inks/InksPage'
import ServicesSettings from '../features/dictionary/ServicesSettingsPage'
import Settings from '../features/settings/SettingsPage'
import Subscriptions from '../features/subscriptions/SubscriptionsPage'
import Users from '../features/settings/UsersPage'
import { useAuth } from '../shared/data/auth'

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

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="devices" element={<Devices />} />
          <Route path="inks" element={<Inks />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="dictionary" element={<Navigate to="/dictionary/device-types" replace />} />
          <Route path="dictionary/device-types" element={<DeviceTypes />} />
          <Route path="dictionary/ink-colors" element={<InkColors />} />
          <Route path="dictionary/brands" element={<Brands />} />
          <Route path="dictionary/services" element={<ServicesSettings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/users" element={<Users />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
