import { useAuthStore } from '../../features/auth/authStore'
import type { AuthSession } from '../../features/auth/authStore'
import { useUsers } from './store'
import type { AuditAction, Permission } from './types'

export type { AuthSession }

export const recordAudit = (
  action: AuditAction,
  entityType: string,
  summary: string,
  entityId?: string,
) => useAuthStore.getState().recordAudit(action, entityType, summary, entityId)

export const loginWithEmail = (email: string, password: string, remember = true) =>
  useAuthStore.getState().login(email, password, remember)

export const quickDemoLogin = (remember = true) =>
  useAuthStore.getState().quickDemoLogin(remember)

export const logout = () => useAuthStore.getState().logout()

export function useAuth(): AuthSession | null {
  return useAuthStore((s) => s.session)
}

export function useCurrentPermissions(): Permission[] {
  const session = useAuth()
  const users = useUsers()
  if (!session) return []
  const liveUser = users.find((u) => u.id === session.userId)
  return liveUser?.permissions ?? session.permissions ?? []
}

export function usePermission(required: Permission | Permission[]): boolean {
  const perms = useCurrentPermissions()
  const list = Array.isArray(required) ? required : [required]
  return list.some((p) => perms.includes(p))
}
