import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Printer } from 'lucide-react'
import { usePrinterTypes } from '../../shared/data/store'
import Inks from './InksPage'

export default function PrinterInksDetailPage() {
  const { id } = useParams<{ id: string }>()
  const printerTypes = usePrinterTypes()
  const exists = Boolean(id && printerTypes.some((p) => p.id === id))

  if (!id || !exists) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <Printer className="size-6" />
        </div>
        <h1 className="text-base font-bold text-slate-900">الطابعة غير موجودة</h1>
        <p className="mt-1.5 text-xs text-slate-500">
          تعذر العثور على الطابعة المطلوبة أو ربما تم حذفها من القاموس.
        </p>
        <Link
          to="/inks/printers"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <ArrowRight className="size-3.5" />
          العودة إلى الطابعات والأحبار
        </Link>
      </div>
    )
  }

  return <Inks lockedPrinterTypeId={id} />
}
