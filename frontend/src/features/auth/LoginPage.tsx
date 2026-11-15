import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeSimple, Eye, EyeSlash, LockSimple, SignIn, WarningCircle } from '@phosphor-icons/react'
import { Button, Field, TextInput } from '../../shared/components/ui'
import { loginWithEmail, quickDemoLogin } from '../../shared/data/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'تسجيل الدخول | إدارة أصول IT'
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const result = loginWithEmail(email, password, remember)
    if (!result.ok) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    navigate('/', { replace: true })
  }

  function handleQuickDemo() {
    setError('')
    quickDemoLogin(remember)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="page-transition w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center">
          <img
            src="/images/Nafusah-logo.svg"
            alt="شعار شركة نفوسة"
            className="h-11 w-auto object-contain"
          />
        </div>

        <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="h-1 w-full bg-signal" aria-hidden="true" />

          <div className="p-6 sm:p-8">
            <header className="mb-6">
              <h1 className="text-xl font-bold text-slate-900">تسجيل الدخول</h1>
              <p className="mt-1 text-sm text-slate-500">
                أدخل بياناتك للوصول إلى نظام إدارة أصول IT
              </p>
            </header>

            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                <WarningCircle className="mt-0.5 size-4 shrink-0 text-red-600" weight="fill" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="البريد الإلكتروني">
                {(id) => (
                  <div className="relative">
                    <EnvelopeSimple
                      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <TextInput
                      id={id}
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      autoFocus
                      placeholder="name@company.local"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      className="pr-9 pl-3 text-left"
                    />
                  </div>
                )}
              </Field>

              <Field label="كلمة المرور">
                {(id) => (
                  <div className="relative">
                    <LockSimple
                      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <TextInput
                      id={id}
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError('')
                      }}
                      className="pr-9 pl-10 text-left"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute top-1/2 left-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                )}
              </Field>

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 cursor-pointer rounded border-slate-300 accent-slate-900"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="mt-2 h-11 w-full text-sm"
              >
                <SignIn className="size-4" weight="bold" />
                <span>{submitting ? 'جاري الدخول...' : 'دخول'}</span>
              </Button>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                دخول سريع بحساب مدير النظام
              </button>
            </div>
          </div>
        </main>

        <p className="mt-6 text-center text-xs text-slate-400">
          إدارة الاتصالات وتقنية المعلومات
        </p>
      </div>
    </div>
  )
}
