import { CheckCircle2 } from 'lucide-react'
import { Button, Modal } from '../../../shared/components/ui'
import type { InkColorItem, InkVoucher } from '../../../shared/data/types'
import { DEFAULT_COLOR } from './voucherUtils'

export function ApproveDispenseModal({
  voucher,
  onClose,
  inkMap,
  colorMap,
  busy,
  onConfirm,
}: {
  voucher: InkVoucher | null
  onClose: () => void
  inkMap: Record<string, { quantity: number }>
  colorMap: Record<string, InkColorItem>
  busy: boolean
  onConfirm: () => Promise<void>
}) {
  if (!voucher) return null

  const hasShortage = voucher.items.some((item) => {
    const stock = inkMap[item.inkId]?.quantity ?? 0
    return item.quantity > stock
  })

  return (
    <Modal
      open={Boolean(voucher)}
      onClose={onClose}
      title={`تأكيد صرف الإذن (${voucher.id})`}
      description={`سيتم تحويل حالة الإذن إلى «تم الصرف» وخصم الكميات التالية لصالح ${voucher.department}${
        (voucher.scope ?? 'shared') === 'personal' && voucher.recipientName
          ? ` (الموظف: ${voucher.recipientName})`
          : ' (جماعي للإدارة)'
      }.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy || hasShortage}
          >
            <CheckCircle2 className="size-4" />
            {busy ? 'جاري التنفيذ...' : 'تأكيد وتم الصرف'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {voucher.items.map((item, idx) => {
            const stock = inkMap[item.inkId]?.quantity ?? 0
            const c = colorMap[item.color] ?? DEFAULT_COLOR
            const insufficient = item.quantity > stock
            return (
              <li key={`${item.inkId}-${idx}`} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: c.primary }} />
                  <bdi>{item.model}</bdi>
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="font-bold text-slate-900">المطلوب: {item.quantity}</span>
                  <span className={insufficient ? 'font-semibold text-red-600' : 'text-slate-500'}>
                    (المتوفر: {stock})
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        {hasShortage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            رصيد المخزون الحالي لا يكفي لتنفيذ هذا الإذن. يرجى توريد الكمية أو رفض الإذن.
          </div>
        )}
      </div>
    </Modal>
  )
}
