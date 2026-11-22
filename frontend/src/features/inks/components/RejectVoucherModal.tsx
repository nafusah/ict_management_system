import { useState } from 'react'
import { XCircle } from 'lucide-react'
import { Button, Field, Modal, TextInput } from '../../../shared/components/ui'
import type { InkVoucher } from '../../../shared/data/types'

export function RejectVoucherModal({
  voucher,
  onClose,
  busy,
  onConfirm,
}: {
  voucher: InkVoucher | null
  onClose: () => void
  busy: boolean
  onConfirm: (notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState('')

  const handleClose = () => {
    if (busy) return
    setNotes('')
    onClose()
  }

  return (
    <Modal
      open={Boolean(voucher)}
      onClose={handleClose}
      title={voucher ? `رفض إذن الصرف (${voucher.id})` : ''}
      description="سيتم تغيير حالة الإذن إلى «مرفوض» دون خصم أي كميات من المخزون."
      size="sm"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            type="button"
            disabled={busy}
            onClick={() => {
              void onConfirm(notes).then(() => setNotes(''))
            }}
          >
            <XCircle className="size-4" />
            {busy ? 'جاري الرفض...' : 'تأكيد الرفض'}
          </Button>
        </>
      }
    >
      <Field label="سبب الرفض (اختياري)">
        {(id) => (
          <TextInput
            id={id}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: عدم توفر رصيد أو تكرار الطلب..."
          />
        )}
      </Field>
    </Modal>
  )
}
