import { create } from 'zustand'
import { ApiError, request } from '../../shared/data/api'
import { auditLogsStore, hydrateAllFromApi, usersStore } from '../../shared/data/store'
import type { AppUser, AuditAction, Permission } from '../../shared/data/types'

const AUTH_KEY = 'it-management:session'

export interface AuthSession {
  userId: string
  name: string
  email: string
  department: string
  permissions?: Permission[]
  token?: string
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw) as AuthSession
  } catch {
    // التخزين غير متاح
  }
  return null
}

function writeSession(session: AuthSession | null, remember: boolean) {
  try {
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    if (session) {
      const storage = remember ? localStorage : sessionStorage
      storage.setItem(AUTH_KEY, JSON.stringify(session))
    }
  } catch {
    // نكتفي بالذاكرة عند تعذر التخزين
  }
}

export interface AuthState {
  session: AuthSession | null
  loading: boolean
  hydrating: boolean
  justLoggedIn: boolean
  clearJustLoggedIn: () => void
  setSession: (session: AuthSession | null, remember: boolean) => void
  login: (
    email: string,
    password: string,
    remember?: boolean,
  ) => Promise<{ ok: true; session: AuthSession } | { ok: false; error: string; isConnectionError?: boolean }>
  quickDemoLogin: (remember?: boolean) => void
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
  recordAudit: (action: AuditAction, entityType: string, summary: string, entityId?: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: readSession(),
  loading: false,
  hydrating: false,
  justLoggedIn: false,

  clearJustLoggedIn: () => set({ justLoggedIn: false }),

  setSession: (session, remember) => {
    writeSession(session, remember)
    set({ session })
  },

  recordAudit: (action, entityType, summary, entityId) => {
    const session = get().session
    if (session?.token) return
    auditLogsStore.add({
      userId: session?.userId,
      userName: session?.name ?? 'النظام',
      action,
      entityType,
      entityId,
      summary,
      createdAt: new Date().toISOString(),
    })
  },

  login: async (email, password, remember = true) => {
    const rawEmail = email.trim().toLowerCase()
    const cleanEmail = rawEmail && !rawEmail.includes('@') ? `${rawEmail}@nafusah.com` : rawEmail

    if (!cleanEmail) {
      return { ok: false, error: 'يرجى إدخال البريد الإلكتروني.' }
    }
    if (!password || password.length < 4) {
      return { ok: false, error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل.' }
    }

    set({ loading: true })
    try {
      const res = await request.post<{ token: string; user: AppUser }>('/auth/login', {
        email: cleanEmail,
        password,
      })

      const session: AuthSession = {
        userId: res.user.id,
        name: res.user.name,
        email: res.user.email,
        department: res.user.department,
        permissions: res.user.permissions,
        token: res.token,
      }
      set({ justLoggedIn: true, hydrating: true })
      get().setSession(session, remember)
      try {
        await hydrateAllFromApi()
      } finally {
        set({ loading: false, hydrating: false })
      }
      return { ok: true, session }
    } catch (err) {
      set({ loading: false })
      if (err instanceof ApiError) {
        if (err.status >= 500) {
          return {
            ok: false,
            isConnectionError: true,
            error: 'حدث خطأ، يرجى المحاولة لاحقاً.',
          }
        }
        return { ok: false, error: err.message }
      }
      return {
        ok: false,
        isConnectionError: true,
        error: 'حدث خطأ، يرجى المحاولة لاحقاً.',
      }
    }
  },

  quickDemoLogin: (remember = true) => {
    const users = usersStore.getAll()
    const admin = users.find((u) => u.active) ?? users[0]
    if (!admin) return
    set({ justLoggedIn: true })
    get().setSession(
      {
        userId: admin.id,
        name: admin.name,
        email: admin.email,
        department: admin.department,
        permissions: admin.permissions,
      },
      remember,
    )
    get().recordAudit('login', 'auth', `دخول تجريبي: ${admin.name}`, admin.id)
  },

  changePassword: async (currentPassword, newPassword) => {
    const session = get().session
    if (!session) {
      return { ok: false, error: 'يجب تسجيل الدخول أولاً.' }
    }
    if (!currentPassword || currentPassword.length < 4) {
      return { ok: false, error: 'أدخل كلمة المرور الحالية.' }
    }
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.' }
    }

    if (session.token) {
      try {
        await request.post('/auth/change-password', { currentPassword, newPassword })
        return { ok: true }
      } catch (err) {
        if (err instanceof ApiError && err.status < 500) {
          return { ok: false, error: err.message }
        }
        return { ok: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً.' }
      }
    }

    const users = usersStore.getAll()
    const current = users.find((u) => u.id === session.userId)
    if (!current) return { ok: false, error: 'المستخدم غير موجود.' }
    const expected = current.password ?? '123456'
    if (currentPassword !== expected) {
      return { ok: false, error: 'كلمة المرور الحالية غير صحيحة.' }
    }
    usersStore.update({ ...current, password: newPassword })
    return { ok: true }
  },

  logout: () => {
    const session = get().session
    if (session?.token) {
      void request.post('/auth/logout').catch(() => {})
    } else if (session) {
      get().recordAudit('logout', 'auth', `تسجيل خروج: ${session.name}`, session.userId)
    }
    set({ justLoggedIn: false, hydrating: false })
    get().setSession(null, false)
  },
}))

if (useAuthStore.getState().session?.token) {
  void hydrateAllFromApi()
}
