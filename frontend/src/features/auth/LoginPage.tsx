import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeSimple, Eye, EyeSlash, LockSimple, SignIn, WarningCircle } from '@phosphor-icons/react'
import { Toast } from '../../shared/components/ui'
import { useAuthStore } from './authStore'

function triggerWebHaptic(pattern: number | number[] = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignore unsupported environments
    }
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const quickDemoLogin = useAuthStore((s) => s.quickDemoLogin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [connectionToast, setConnectionToast] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'تسجيل الدخول | إدارة أصول IT'
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    triggerWebHaptic(15)
    setError('')
    setSubmitting(true)

    const username = email.trim().replace(/@nafusah\.com$/i, '')
    const fullEmail = username ? `${username}@nafusah.com` : ''
    const result = await login(fullEmail, password, remember)
    if (!result.ok) {
      triggerWebHaptic([20, 40, 20])
      if (result.isConnectionError) {
        setConnectionToast(result.error)
      } else {
        setError(result.error)
      }
      setSubmitting(false)
      return
    }

    triggerWebHaptic(12)
    navigate('/', { replace: true })
  }

  function handleQuickDemo() {
    triggerWebHaptic(10)
    setError('')
    quickDemoLogin(remember)
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-8">
      {/* Subtle tinted shapes behind the glass card on a white canvas so the optical blur & refraction are clearly visible */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 h-[360px] w-[520px] -translate-x-[62%] -translate-y-[68%] rounded-full opacity-55 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fcc41a 0%, #fde68a 45%, transparent 75%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-[380px] w-[520px] -translate-x-[32%] -translate-y-[25%] rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4059aa 0%, #bfdbfe 48%, transparent 76%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
      </div>

      <Toast message={connectionToast} tone="red" onClose={() => setConnectionToast(null)} />

      <div className="page-transition relative z-10 w-full max-w-[420px]">
        <main className="liquid-glass-card relative overflow-hidden rounded-[28px] p-6 sm:p-8">
          <div className="relative z-10">
            <header className="mb-6 flex flex-col items-center text-center">
              <img
                src="/images/ims_logo.svg"
                alt="شعار النظام"
                className="mb-3 h-16 w-16 object-contain"
              />
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">تسجيل الدخول</h1>
              <p className="mt-1 text-sm text-slate-600">
                أدخل بياناتك للوصول إلى نظام إدارة أصول IT
              </p>
            </header>

            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                <WarningCircle className="mt-0.5 size-4 shrink-0 text-red-600" weight="fill" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-800">
                  البريد الإلكتروني
                </label>
                <div
                  dir="ltr"
                  className="flex h-11 w-full items-center overflow-hidden rounded-xl border border-white/80 bg-white/65 shadow-xs backdrop-blur-md transition-colors focus-within:border-slate-900 focus-within:bg-white/90 focus-within:ring-1 focus-within:ring-slate-900"
                >
                  <span className="flex h-full items-center pl-3 text-slate-500" aria-hidden="true">
                    <EnvelopeSimple className="size-4" />
                  </span>
                  <input
                    id="login-email"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value.replace(/@nafusah\.com$/i, '')
                      setEmail(val)
                      if (error) setError('')
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-left text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <span className="flex h-full shrink-0 items-center border-l border-slate-200/80 bg-white/60 px-3 text-xs font-medium text-slate-600 select-none">
                    @nafusah.com
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-800">
                  كلمة المرور
                </label>
                <div className="relative">
                  <LockSimple
                    className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError('')
                    }}
                    className="h-11 w-full rounded-xl border border-white/80 bg-white/65 pr-10 pl-10 text-left text-sm text-slate-900 shadow-xs backdrop-blur-md placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:bg-white/90 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      triggerWebHaptic(8)
                      setShowPassword((prev) => !prev)
                    }}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute top-1/2 left-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900"
                  >
                    {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => {
                      triggerWebHaptic(8)
                      setRemember(e.target.checked)
                    }}
                    className="size-4 cursor-pointer rounded border-slate-300 accent-slate-900"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SignIn className="size-4" weight="bold" />
                <span>{submitting ? 'جاري الدخول...' : 'دخول'}</span>
              </button>
            </form>

            <div className="mt-5 border-t border-slate-900/10 pt-4 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="cursor-pointer text-xs font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                دخول سريع بحساب مدير النظام
              </button>
            </div>
          </div>
        </main>

        <p className="mt-6 text-center text-xs text-slate-500">
          إدارة الاتصالات وتقنية المعلومات
        </p>
      </div>
    </div>
  )
}
