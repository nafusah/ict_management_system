export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="جارٍ التحميل">
      <span className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
    </div>
  )
}
