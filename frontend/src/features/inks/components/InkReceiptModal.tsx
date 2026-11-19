import { Printer } from 'lucide-react'
import { Button, Modal } from '../../../shared/components/ui'
import type { Classification } from '../../../shared/data/types'

export interface InkReceiptItem {
  model: string
  brand: string
  colorName: string
  printerTypeName?: string | null
  quantity: number
}

export interface InkReceiptData {
  receiptNo: string
  date: string
  department: string
  scope: Classification
  recipientName?: string | null
  requesterName?: string | null
  approvedByName?: string | null
  notes?: string | null
  items: InkReceiptItem[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseDateParts(dateStr: string): { year: string; month: string; day1: string; day2: string } {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    return { year: m[1], month: m[2], day1: m[3][0] ?? '', day2: m[3][1] ?? '' }
  }
  const now = new Date()
  const y = String(now.getFullYear())
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return { year: y, month: mo, day1: d[0], day2: d[1] }
}

function NafusahFlameSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="304 0 78 89" aria-hidden="true">
      <path d="M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z" />
      <path d="M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z" />
    </svg>
  )
}

function IctOfficialStamp({ date }: { date: string }) {
  const { year, month, day1, day2 } = parseDateParts(date)

  return (
    <div
      className="inline-block w-[290px] select-none border-2 border-[#152b8c] text-[#152b8c]"
    >
      <div className="flex flex-col border-b-2 border-[#152b8c]">
        <div className="flex items-start justify-between px-2.5 pt-2">
          <NafusahFlameSvg className="mt-0.5 h-8 w-7 shrink-0 fill-current" />
          <div className="flex-1 text-center">
            <p className="m-0 text-[9.5px] font-extrabold leading-tight">شركة نفوسة للعمليات النفطية بي.في</p>
            <p className="m-0 font-serif text-[11px] font-bold leading-tight" dir="ltr">
              Nafusah Oil Operation B.V
            </p>
          </div>
          <NafusahFlameSvg className="mt-0.5 h-8 w-7 shrink-0 fill-current" />
        </div>

        <div className="mt-1 flex h-14 items-stretch justify-between">
          <div className="flex w-10 items-center justify-center border-t-2 border-l-2 border-[#152b8c]">
            <span className="text-sm font-extrabold" style={{ writingMode: 'vertical-rl' }}>
              أستلم
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center pb-1 font-sans text-lg font-bold" dir="ltr">
            <span className="mr-1.5">{year}</span>
            <span className="mr-1.5">-{month}-</span>
            <span className="inline-flex items-baseline">
              <span className="inline-block -translate-y-0.5">{day1}</span>
              <span className="inline-block translate-y-px">{day2}</span>
            </span>
          </div>

          <div className="flex w-10 items-center justify-center border-t-2 border-r-2 border-[#152b8c]">
            <span
              className="font-serif text-[9.5px] font-bold tracking-wider"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              RECEVIDE
            </span>
          </div>
        </div>
      </div>

      <div className="px-2 py-1.5 text-center">
        <p className="m-0 text-[10.5px] font-extrabold">إدارة الإتصالات وتقنية المعلومات</p>
        <p className="m-0 font-serif text-[8.5px] font-bold" dir="ltr">
          Information and Communications Technology Department
        </p>
      </div>
    </div>
  )
}

function openInkReceiptPrintWindow(receipt: InkReceiptData) {
  const win = window.open('', '_blank', 'width=900,height=720')
  if (!win) {
    window.print()
    return
  }

  const { year, month, day1, day2 } = parseDateParts(receipt.date)
  const totalQty = receipt.items.reduce((sum, item) => sum + item.quantity, 0)
  const recipientDisplay =
    receipt.scope === 'personal' && receipt.recipientName
      ? `${escapeHtml(receipt.department)} — الموظف: ${escapeHtml(receipt.recipientName)}`
      : `${escapeHtml(receipt.department)} (صرف جماعي)`

  const rowsHtml = receipt.items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-weight:700;">${escapeHtml(item.model)}</td>
        <td>${escapeHtml(item.brand)}</td>
        <td>${escapeHtml(item.colorName)}</td>
        <td>${escapeHtml(item.printerTypeName || '—')}</td>
        <td style="text-align:center;font-weight:700;">${item.quantity}</td>
      </tr>
    `,
    )
    .join('')

  const flamePaths = `
    <path d="M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z"/>
    <path d="M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z"/>
  `

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>وصل استلام حبر - ${escapeHtml(receipt.receiptNo)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800&family=Tinos:wght@700&display=swap');
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 20px;
    font-family: 'Cairo', Tahoma, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
  }
  .sheet {
    max-width: 780px;
    margin: 0 auto;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 24px 28px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .brand h1 { margin: 0; font-size: 16px; font-weight: 800; }
  .brand p { margin: 2px 0 0; font-size: 12px; color: #475569; }
  .doc-badge {
    text-align: left;
  }
  .doc-badge .title {
    display: inline-block;
    background: #0f172a;
    color: #fff;
    padding: 5px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 800;
  }
  .doc-badge .meta {
    margin-top: 6px;
    font-size: 12px;
    color: #334155;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 18px;
    font-size: 13px;
  }
  .info-label { color: #64748b; font-size: 11px; display: block; }
  .info-value { font-weight: 700; color: #0f172a; }
  table.items {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-bottom: 18px;
  }
  table.items th, table.items td {
    border: 1px solid #cbd5e1;
    padding: 8px 10px;
    text-align: right;
  }
  table.items th {
    background: #f1f5f9;
    font-weight: 700;
  }
  .ack {
    font-size: 12.5px;
    color: #334155;
    background: #f8fafc;
    border-right: 3px solid #0f172a;
    padding: 8px 12px;
    margin-bottom: 22px;
  }
  .footer-sign {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-top: 12px;
  }
  .sign-box {
    flex: 1;
    border-top: 1px dashed #94a3b8;
    padding-top: 8px;
    font-size: 12px;
    color: #334155;
  }
  .sign-line {
    height: 44px;
  }
  .stamp-wrapper {
    filter: url(#ink-texture);
  }
  .stamp-box {
    width: 320px;
    border: 2.5px solid #152b8c;
    color: #152b8c;
    background: transparent;
  }
  .upper-section { border-bottom: 2.5px solid #152b8c; }
  .stamp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 6px 10px 0;
  }
  .stamp-logo { width: 30px; height: 34px; fill: currentColor; flex-shrink: 0; }
  .stamp-title { text-align: center; flex: 1; }
  .stamp-ar { font-size: 10px; font-weight: 800; margin: 0; }
  .stamp-en { font-family: 'Tinos', serif; font-size: 12px; font-weight: 700; margin: 0; direction: ltr; }
  .stamp-mid { display: flex; justify-content: space-between; align-items: stretch; height: 58px; margin-top: 2px; }
  .side-r { width: 44px; border-top: 2.5px solid #152b8c; border-left: 2.5px solid #152b8c; display: flex; align-items: center; justify-content: center; }
  .side-l { width: 44px; border-top: 2.5px solid #152b8c; border-right: 2.5px solid #152b8c; display: flex; align-items: center; justify-content: center; }
  .v-ar { writing-mode: vertical-rl; font-size: 15px; font-weight: 800; }
  .v-en { writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'Tinos', serif; font-size: 10.5px; font-weight: 700; letter-spacing: 1px; }
  .date-mid { flex: 1; display: flex; align-items: center; justify-content: center; direction: ltr; font-family: Arial, sans-serif; font-size: 19px; font-weight: 700; }
  .stamp-foot { text-align: center; padding: 5px 6px; }
  .dept-ar { font-size: 11.5px; font-weight: 800; margin: 0; }
  .dept-en { font-family: 'Tinos', serif; font-size: 9px; font-weight: 700; margin: 0; direction: ltr; }
  @media print {
    body { padding: 0; }
    .sheet { border: none; padding: 0; }
  }
</style>
</head>
<body>
  <svg width="0" height="0" style="position:absolute;">
    <filter id="ink-texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <svg width="42" height="48" viewBox="304 0 78 89" style="fill:#0f172a;">${flamePaths}</svg>
        <div>
          <h1>شركة نفوسة للعمليات النفطية بي.في</h1>
          <p>إدارة الإتصالات وتقنية المعلومات — نظام إدارة أصول تقنية المعلومات</p>
        </div>
      </div>
      <div class="doc-badge">
        <span class="title">وصل استلام أحبار</span>
        <div class="meta">رقم المرجع: <strong>${escapeHtml(receipt.receiptNo)}</strong> | التاريخ: <strong>${escapeHtml(receipt.date)}</strong></div>
      </div>
    </div>

    <div class="info-grid">
      <div><span class="info-label">الجهة / المستلم</span><span class="info-value">${recipientDisplay}</span></div>
      <div><span class="info-label">إجمالي الكمية المصروفة</span><span class="info-value">${totalQty} خرطوش</span></div>
      ${receipt.requesterName ? `<div><span class="info-label">مقدم الطلب</span><span class="info-value">${escapeHtml(receipt.requesterName)}</span></div>` : ''}
      ${receipt.approvedByName ? `<div><span class="info-label">تم الصرف بواسطة</span><span class="info-value">${escapeHtml(receipt.approvedByName)}</span></div>` : ''}
      ${receipt.notes ? `<div style="grid-column:1 / -1;"><span class="info-label">ملاحظات</span><span class="info-value">${escapeHtml(receipt.notes)}</span></div>` : ''}
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:42px;text-align:center;">م</th>
          <th>موديل الحبر</th>
          <th>الماركة</th>
          <th>اللون</th>
          <th>نوع الطابعة</th>
          <th style="width:80px;text-align:center;">الكمية</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="ack">
      أقر أنا الموقع أدناه باستلام أصناف الأحبار الموضحة أعلاه بحالة سليمة وكاملة، وتم قيدها في عهدة الجهة المستلمة.
    </div>

    <div class="footer-sign">
      <div class="sign-box">
        <strong>توقيع المستلم</strong>
        <div class="sign-line"></div>
        <div>الاسم: ${escapeHtml(receipt.recipientName || '........................................')}</div>
        <div style="margin-top:4px;">التاريخ: ${escapeHtml(receipt.date)}</div>
      </div>

      <div class="stamp-wrapper">
        <div class="stamp-box">
          <div class="upper-section">
            <div class="stamp-header">
              <svg class="stamp-logo" viewBox="304 0 78 89">${flamePaths}</svg>
              <div class="stamp-title">
                <p class="stamp-ar">شركة نفوسة للعمليات النفطية بي.في</p>
                <p class="stamp-en">Nafusah Oil Operation B.V</p>
              </div>
              <svg class="stamp-logo" viewBox="304 0 78 89">${flamePaths}</svg>
            </div>
            <div class="stamp-mid">
              <div class="side-r"><span class="v-ar">أستلم</span></div>
              <div class="date-mid">
                <span style="margin-right:8px;">${escapeHtml(year)}</span>
                <span style="margin-right:8px;">-${escapeHtml(month)}-</span>
                <span>${escapeHtml(day1)}${escapeHtml(day2)}</span>
              </div>
              <div class="side-l"><span class="v-en">RECEVIDE</span></div>
            </div>
          </div>
          <div class="stamp-foot">
            <p class="dept-ar">إدارة الإتصالات وتقنية المعلومات</p>
            <p class="dept-en">Information and Communications Technology Department</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 300);
    };
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
}

export function InkReceiptModal({
  receipt,
  onClose,
}: {
  receipt: InkReceiptData | null
  onClose: () => void
}) {
  if (!receipt) return null
  const totalQty = receipt.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Modal
      open={Boolean(receipt)}
      onClose={onClose}
      title={`وصل استلام حبر (${receipt.receiptNo})`}
      description="معاينة وصل الاستلام الرسمي متضمناً الختم المعتمد لإدارة الإتصالات وتقنية المعلومات."
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            إغلاق
          </Button>
          <Button variant="primary" type="button" onClick={() => openInkReceiptPrintWindow(receipt)}>
            <Printer className="size-4" />
            طباعة وصل الاستلام
          </Button>
        </>
      }
    >
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-3">
            <NafusahFlameSvg className="h-10 w-9 fill-slate-900" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900">شركة نفوسة للعمليات النفطية بي.في</h3>
              <p className="text-xs text-slate-500">إدارة الإتصالات وتقنية المعلومات</p>
            </div>
          </div>
          <div className="text-left">
            <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              وصل استلام أحبار
            </span>
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              رقم المرجع: <strong>{receipt.receiptNo}</strong> • التاريخ: <strong>{receipt.date}</strong>
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs sm:grid-cols-2">
          <div>
            <span className="block text-slate-500">الجهة / المستلم</span>
            <span className="font-bold text-slate-900">
              {receipt.department} —{' '}
              {receipt.scope === 'personal' && receipt.recipientName ? receipt.recipientName : 'صرف جماعي'}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">إجمالي الكمية المصروفة</span>
            <span className="font-bold text-slate-900">{totalQty} خرطوش</span>
          </div>
          {receipt.requesterName && (
            <div>
              <span className="block text-slate-500">مقدم الطلب</span>
              <span className="font-bold text-slate-900">{receipt.requesterName}</span>
            </div>
          )}
          {receipt.approvedByName && (
            <div>
              <span className="block text-slate-500">تم الصرف بواسطة</span>
              <span className="font-bold text-slate-900">{receipt.approvedByName}</span>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-3 py-2 text-center font-semibold">م</th>
                <th className="px-3 py-2 font-semibold">موديل الحبر</th>
                <th className="px-3 py-2 font-semibold">الماركة</th>
                <th className="px-3 py-2 font-semibold">اللون</th>
                <th className="px-3 py-2 font-semibold">نوع الطابعة</th>
                <th className="px-3 py-2 text-center font-semibold">الكمية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items.map((item, idx) => (
                <tr key={`${item.model}-${idx}`}>
                  <td className="px-3 py-2 text-center tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{item.model}</td>
                  <td className="px-3 py-2 text-slate-700">{item.brand}</td>
                  <td className="px-3 py-2 text-slate-700">{item.colorName}</td>
                  <td className="px-3 py-2 text-slate-600">{item.printerTypeName || '—'}</td>
                  <td className="px-3 py-2 text-center font-bold tabular-nums">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border-r-4 border-slate-900 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          أقر أنا الموقع أدناه باستلام أصناف الأحبار الموضحة أعلاه بحالة سليمة وكاملة.
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
          <div className="min-w-52 flex-1 border-t border-dashed border-slate-300 pt-2 text-xs text-slate-600">
            <p className="font-bold text-slate-800">توقيع المستلم</p>
            <div className="h-8" />
            <p>الاسم: {receipt.recipientName || '....................................'}</p>
          </div>
          <IctOfficialStamp date={receipt.date} />
        </div>
      </div>
    </Modal>
  )
}
