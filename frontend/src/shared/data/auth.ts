import { useSyncExternalStore } from 'react'
import { usersStore } from './store'
import type { AppUser } from './types'

const AUTH_KEY = 'it-management:session'

export interface AuthSession {
  userId: string
  name: string
  email: string
  department: string
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

let currentSession: AuthSession | null = readSession()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function persistSession(session: AuthSession | null, remember: boolean) {
  currentSession = session
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
  emit()
}

export function loginWithEmail(
  email: string,
  password: string,
  remember = true,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) {
    return { ok: false, error: 'يرجى إدخال البريد الإلكتروني.' }
  }
  if (!password || password.length < 4) {
    return { ok: false, error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل.' }
  }

  const users = usersStore.getAll()
  const matched: AppUser | undefined = users.find((u) => u.email.toLowerCase() === cleanEmail)

  if (!matched) {
    return { ok: false, error: 'البريد الإلكتروني غير مسجل في النظام.' }
  }
  if (!matched.active) {
    return { ok: false, error: 'هذا الحساب غير نشط حالياً. تواصل مع مدير النظام.' }
  }

  const session: AuthSession = {
    userId: matched.id,
    name: matched.name,
    email: matched.email,
    department: matched.department,
  }
  persistSession(session, remember)
  return { ok: true, session }
}

export function quickDemoLogin(remember = true) {
  const users = usersStore.getAll()
  const admin = users.find((u) => u.active) ?? users[0]
  if (!admin) return
  persistSession(
    {
      userId: admin.id,
      name: admin.name,
      email: admin.email,
      department: admin.department,
    },
    remember,
  )
}

export function logout() {
  persistSession(null, false)
}

export function useAuth(): AuthSession | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => currentSession,
  )
}
