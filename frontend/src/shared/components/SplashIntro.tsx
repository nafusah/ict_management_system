import { useEffect, useState } from 'react'

const SPLASH_STORAGE_KEY = 'it-management:splash-last-date'
const DISPLAY_MS = 3200
const FADE_MS = 500

let evaluatedThisPageLoad: boolean | null = null

function getLocalDateKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function shouldShowSplashToday(): boolean {
  if (evaluatedThisPageLoad !== null) return evaluatedThisPageLoad
  if (typeof window === 'undefined') {
    evaluatedThisPageLoad = false
    return false
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    evaluatedThisPageLoad = false
    return false
  }
  try {
    const today = getLocalDateKey()
    const lastSeen = localStorage.getItem(SPLASH_STORAGE_KEY)
    if (lastSeen === today) {
      evaluatedThisPageLoad = false
      return false
    }
    localStorage.setItem(SPLASH_STORAGE_KEY, today)
    evaluatedThisPageLoad = true
    return true
  } catch {
    evaluatedThisPageLoad = false
    return false
  }
}

export default function SplashIntro() {
  const [visible, setVisible] = useState(shouldShowSplashToday)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!visible) return

    const fadeTimer = window.setTimeout(() => setFading(true), DISPLAY_MS)
    const hideTimer = window.setTimeout(() => setVisible(false), DISPLAY_MS + FADE_MS)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFading(true)
        window.setTimeout(() => setVisible(false), 180)
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    setFading(true)
    window.setTimeout(() => setVisible(false), 180)
  }

  return (
    <div
      role="status"
      aria-label="جاري فتح النظام"
      onClick={dismiss}
      className={`fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-white transition-opacity duration-500 ${fading ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
    >
      <div className="relative flex size-44 items-center justify-center sm:size-48">
        <svg
          viewBox="0 0 160 160"
          aria-hidden="true"
          className="absolute inset-0 size-full"
        >
          <defs>
            <linearGradient id="splash-gold-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fab801" />
              <stop offset="60%" stopColor="#e8bc40" />
              <stop offset="100%" stopColor="#fcc41a" />
            </linearGradient>
          </defs>
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="3"
          />
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="url(#splash-gold-ring)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="452"
            strokeDashoffset="452"
            className="splash-ring-anim"
          />
        </svg>

        <div className="splash-logo-anim relative size-28 overflow-hidden rounded-2xl p-2 sm:size-32">
          <img
            src="/images/ims_logo.svg"
            alt="شعار النظام"
            className="size-full object-contain select-none"
          />
          <div
            aria-hidden="true"
            className="splash-sheen-anim pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/75 to-transparent"
          />
        </div>
      </div>

      <div className="splash-text-anim mt-4 text-center">

        <p className="mt-1 text-xs font-medium text-slate-500">
          إدارة الاتصالات وتقنية المعلومات
        </p>
      </div>
    </div>
  )
}
