import { getStoredToken, notifyUnauthorized, request } from '../../shared/data/api'
import { createCollection } from '../../shared/data/createCollection'
import type { AppUser, AuditLogItem, DepartmentItem, EmployeeItem } from '../../shared/data/types'

export const usersStore = createCollection<AppUser>('users', 'USR', '/users')
export const departmentsStore = createCollection<DepartmentItem>('departments', 'DPT', '/departments')
export const employeesStore = createCollection<EmployeeItem>('employees', 'EMP', '/employees')
export const auditLogsStore = createCollection<AuditLogItem>('audit-logs', 'LOG', '/audit-logs')

export const useUsers = () => usersStore.useStore((s) => s.items)
export const useDepartments = () => departmentsStore.useStore((s) => s.items)
export const useEmployees = () => employeesStore.useStore((s) => s.items)
export const useAuditLogs = () => auditLogsStore.useStore((s) => s.items)

export interface GeneralSettingsData {
  orgName: string
  adminName: string
  adminEmail: string
  defaultInkThreshold: number
  notificationToEmails?: string[]
  notificationCcEmails?: string[]
  subscriptionToEmails?: string[]
  subscriptionCcEmails?: string[]
  subscriptionAlertDays?: string[]
  subscriptionAlertTime?: string
}

export async function fetchSettingsFromApi(): Promise<GeneralSettingsData | null> {
  if (!getStoredToken()) return null
  try {
    return await request.get<GeneralSettingsData>('/settings')
  } catch {
    return null
  }
}

export async function saveSettingsToApi(data: GeneralSettingsData): Promise<GeneralSettingsData | null> {
  if (!getStoredToken()) return null
  return await request.put<GeneralSettingsData>('/settings', data)
}

export async function sendTestNotificationEmail(payload: {
  channel?: 'inks' | 'subscriptions'
  to: string[]
  cc: string[]
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await request.post<{ message?: string }>('/settings/test-email', payload)
    return { ok: true, message: res.message ?? 'تم إرسال البريد التجريبي بنجاح.' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'تعذر إرسال البريد التجريبي.'
    return { ok: false, error: msg }
  }
}

export async function downloadDatabaseBackup(): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getStoredToken()
  if (!token) {
    return { ok: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً.' }
  }

  try {
    const res = await fetch('/api/settings/backup', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/octet-stream, application/json',
      },
    })

    if (!res.ok) {
      if (res.status === 401) {
        notifyUnauthorized()
        return { ok: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً.' }
      }
      return { ok: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً.' }
    }

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename="?([^"]+)"?/i)
    const filename = match?.[1] ?? `ict-backup-${new Date().toISOString().slice(0, 10)}.sql`

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return { ok: true }
  } catch {
    return { ok: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً.' }
  }
}
