/**
 * هياكل التحميل (Skeletons) — تظهر مكان البيانات أول ما تنفتح الصفحة
 * لين توصل البيانات من الخادم، بدل ما تظهر الصفحة فاضية أو بأرقام صفرية.
 */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-md bg-slate-200', className)} />
}

// عروض متفاوتة باش الصفوف ما تبانش متطابقة
const WIDTHS = ['w-40', 'w-32', 'w-48', 'w-36', 'w-44', 'w-28']
const SUB_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-16', 'w-24', 'w-20']

/** صفوف تحاكي جداول القوائم (أيقونة + سطرين + شارات + أزرار). */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="جارٍ تحميل البيانات" aria-busy="true" className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={cx('h-3.5', WIDTHS[i % WIDTHS.length])} />
            <Skeleton className={cx('h-2.5', SUB_WIDTHS[i % SUB_WIDTHS.length])} />
          </div>
          <Skeleton className="hidden h-3 w-24 sm:block" />
          <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      ))}
    </div>
  )
}

/** صفوف داخل <tbody> للجداول البسيطة. */
export function TableRowsSkeleton({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} aria-hidden="true">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton
                className={cx(
                  'h-3.5',
                  c === 0 ? WIDTHS[r % WIDTHS.length] : c === cols - 1 ? 'w-12' : SUB_WIDTHS[(r + c) % SUB_WIDTHS.length],
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** شبكة بطاقات (الطابعات، لوحة التحكم). */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="جارٍ تحميل البيانات"
      aria-busy="true"
      className={cx('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className={cx('h-3.5', WIDTHS[i % WIDTHS.length])} />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** هيكل صفحة كاملة — يظهر وقت تحميل ملف الصفحة نفسه (lazy). */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="جارٍ تحميل الصفحة" aria-busy="true">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-10 w-64 max-w-full rounded-md" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <Skeleton className="h-3 w-1/2" />
        </div>
        <ListSkeleton rows={7} />
      </div>
    </div>
  )
}
