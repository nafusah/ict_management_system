import { CheckCircle2, Printer, XCircle } from 'lucide-react'
import { Button, Modal, Pill } from '../../../shared/components/ui'
import { INK_DISPENSE_SCOPES, INK_VOUCHER_STATUSES } from '../../../shared/data/types'
import type { InkColorItem, InkVoucher } from '../../../shared/data/types'
import { DEFAULT_COLOR } from './voucherUtils'
import { formatDateTime } from './voucherUtils'

export function VoucherDetailModal({
  voucher,
  onClose,
  colorMap,
  inkMap,
  canApprove,
  onPrintReceipt,
  onApprove,
  onReject,
}: {
  voucher: InkVoucher | null
  onClose: () => void
  colorMap: Record<string, InkColorItem>
  inkMap: Record<string, { quantity: number }>
  canApprove: boolean
  onPrintReceipt: () => void
  onApprove: () => void
  onReject: () => void
}) {
  if (!voucher) return null
  const statusMeta = INK_VOUCHER_STATUSES[voucher.status]

  return (
    <Modal
      open={Boolean(voucher)}
      onClose={onClose}
      title={`تفاصيل إذن الصرف (${voucher.id})`}
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            إغلاق
          </Button>
          {voucher.status === 'dispensed' && (
            <Button variant="primary" type="button" onClick={onPrintReceipt}>
              <Printer className="size-4" />
              طباعة وصل استلام
            </Button>
          )}
          {voucher.status === 'pending' && canApprove && (
            <>
              <Button variant="danger" type="button" onClick={onReject}>
                <XCircle className="size-4" />
                رفض الإذن
              </Button>
              <Button variant="primary" type="button" onClick={onApprove}>
                <CheckCircle2 className="size-4" />
                اعتماد وتنفيذ الصرف
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-2">
          <div>
            <div className="text-xs text-slate-500">الحالة</div>
            <div className="mt-1">
              <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">تاريخ الإذن</div>
            <div className="mt-1 font-medium text-slate-900 tabular-nums">{voucher.date}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">الإدارة الطالبة</div>
            <div className="mt-1 font-medium text-slate-900">{voucher.department}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">نوع الصرف / المستلم</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
              <Pill tone={(voucher.scope ?? 'shared') === 'personal' ? 'green' : 'blue'}>
                {INK_DISPENSE_SCOPES[voucher.scope ?? 'shared'].label}
              </Pill>
              {(voucher.scope ?? 'shared') === 'personal' && voucher.recipientName && (
                <span>{voucher.recipientName}</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">مقدّم الطلب</div>
            <div className="mt-1 font-medium text-slate-900">{voucher.requesterName}</div>
          </div>
          {voucher.approvedByName && (
            <>
              <div>
                <div className="text-xs text-slate-500">تمت المعالجة بواسطة</div>
                <div className="mt-1 font-medium text-slate-900">{voucher.approvedByName}</div>
              </div>
              {voucher.dispensedAt && (
                <div>
                  <div className="text-xs text-slate-500">تاريخ ووقت الصرف</div>
                  <div className="mt-1 font-medium text-slate-900 tabular-nums">
                    {formatDateTime(voucher.dispensedAt)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">الأصناف المطلوبة</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">موديل الحبر</th>
                  <th className="px-3 py-2 font-medium">اللون</th>
                  <th className="px-3 py-2 font-medium">الكمية</th>
                  {voucher.status === 'pending' && <th className="px-3 py-2 font-medium">المتوفر بالمخزون</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {voucher.items.map((item, idx) => {
                  const c = colorMap[item.color] ?? DEFAULT_COLOR
                  const stock = inkMap[item.inkId]?.quantity
                  return (
                    <tr key={`${item.inkId}-${idx}`}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <bdi>{item.model}</bdi>
                        {item.brand && <span className="mr-1.5 text-slate-400">({item.brand})</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: c.primary }} />
                          <span>{c.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 tabular-nums">{item.quantity}</td>
                      {voucher.status === 'pending' && (
                        <td className="px-3 py-2 tabular-nums">
                          {stock === undefined ? (
                            <span className="text-slate-400">غير متاح</span>
                          ) : stock < item.quantity ? (
                            <span className="font-semibold text-red-600">{stock} (غير كافٍ)</span>
                          ) : (
                            <span className="font-medium text-emerald-700">{stock}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {voucher.notes && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">ملاحظات: </span>
            {voucher.notes}
          </div>
        )}
      </div>
    </Modal>
  )
}
