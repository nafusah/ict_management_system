import { CUSTODY_ACTIONS, DEVICE_CONDITIONS, STORAGE_EMPLOYEE } from '../../../shared/data/types'
import type { CustodyRecord, Device } from '../../../shared/data/types'

/**
 * نموذج استلام وتسليم عهدة جهاز — يُفتح في نافذة جديدة ويُطبع.
 * نفس هوية "وصل استلام الأحبار": الترويسة والختم الرسمي لإدارة الاتصالات وتقنية المعلومات.
 */

const IT_DEPARTMENT = 'إدارة الاتصالات وتقنية المعلومات'

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function dateParts(date: string) {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return { year: m[1], month: m[2], day: m[3] }
  const d = new Date()
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
  }
}

const FLAME_DARK =
  'M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z'
const FLAME_GOLD =
  'M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z'

function party(employee: string | null | undefined, department: string | null | undefined) {
  if (!employee) return { name: IT_DEPARTMENT, dept: 'قسم الأجهزة والدعم الفني' }
  if (employee === STORAGE_EMPLOYEE) return { name: STORAGE_EMPLOYEE, dept: IT_DEPARTMENT }
  return { name: employee, dept: department ?? '' }
}

export function printCustodyForm(device: Device, record: CustodyRecord, deviceTypeLabel: string) {
  const win = window.open('', '_blank', 'width=900,height=760')
  if (!win) {
    window.alert('تعذر فتح نافذة الطباعة. اسمح للمتصفح بفتح النوافذ المنبثقة ثم حاول مجدداً.')
    return
  }

  const isReturn = record.action === 'returned'
  const title = isReturn ? 'نموذج إرجاع عهدة جهاز' : 'نموذج استلام وتسليم عهدة جهاز'
  const from = party(record.fromEmployee, record.fromDepartment)
  const to = party(record.toEmployee, record.toDepartment)
  const { year, month, day } = dateParts(record.date)
  const condition = record.condition ? DEVICE_CONDITIONS[record.condition] : '—'

  const ack = isReturn
    ? `أقر أنا الموقع أدناه (${esc(from.name)}) بأنني قمت بإرجاع الجهاز الموضح أعلاه إلى ${esc(IT_DEPARTMENT)}، وتُخلى عهدتي منه اعتباراً من تاريخ هذا النموذج.`
    : `أقر أنا الموقع أدناه (${esc(to.name)}) باستلام الجهاز الموضح أعلاه بالحالة المذكورة، وأتعهد بالمحافظة عليه واستخدامه لأغراض العمل فقط، وإعادته إلى ${esc(IT_DEPARTMENT)} عند الطلب أو عند انتهاء علاقتي بالجهة.`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${esc(title)} - ${esc(record.id)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800&family=Tinos:wght@700&display=swap');
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 20px; font-family: 'Cairo', Tahoma, Arial, sans-serif; color: #0f172a; background: #fff; }
  .sheet { max-width: 780px; margin: 0 auto; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 24px 28px; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand h1 { margin: 0; font-size: 16px; font-weight: 800; }
  .brand p { margin: 2px 0 0; font-size: 12px; color: #475569; }
  .doc-badge { text-align: left; }
  .doc-badge .title { display: inline-block; background: #0f172a; color: #fff; padding: 5px 14px; border-radius: 6px; font-size: 14px; font-weight: 800; }
  .doc-badge .meta { margin-top: 6px; font-size: 12px; color: #334155; }
  h2 { font-size: 13px; margin: 0 0 8px; color: #334155; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px; }
  table.grid th, table.grid td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
  table.grid th { background: #f1f5f9; font-weight: 700; width: 26%; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .party { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 12px 14px; font-size: 13px; }
  .party .role { font-size: 11px; color: #64748b; }
  .party .name { font-weight: 800; font-size: 14px; margin-top: 2px; }
  .party .dept { color: #475569; font-size: 12px; }
  .ack { font-size: 12.5px; color: #334155; background: #f8fafc; border-right: 3px solid #0f172a; padding: 8px 12px; margin-bottom: 22px; line-height: 1.9; }
  .signs { display: flex; gap: 24px; align-items: flex-end; }
  .sign-box { flex: 1; border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 12px; color: #334155; }
  .sign-line { height: 48px; }
  .stamp-wrapper { filter: url(#ink-texture); }
  .stamp-box { width: 300px; border: 2.5px solid #152b8c; color: #152b8c; }
  .upper { border-bottom: 2.5px solid #152b8c; }
  .s-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 10px 0; }
  .s-logo { width: 28px; height: 32px; fill: currentColor; flex-shrink: 0; }
  .s-title { text-align: center; flex: 1; }
  .s-ar { font-size: 10px; font-weight: 800; margin: 0; }
  .s-en { font-family: 'Tinos', serif; font-size: 11.5px; font-weight: 700; margin: 0; direction: ltr; }
  .s-mid { display: flex; justify-content: space-between; align-items: stretch; height: 54px; margin-top: 2px; }
  .side-r { width: 42px; border-top: 2.5px solid #152b8c; border-left: 2.5px solid #152b8c; display: flex; align-items: center; justify-content: center; }
  .side-l { width: 42px; border-top: 2.5px solid #152b8c; border-right: 2.5px solid #152b8c; display: flex; align-items: center; justify-content: center; }
  .v-ar { writing-mode: vertical-rl; font-size: 15px; font-weight: 800; }
  .v-en { writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'Tinos', serif; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
  .s-date { flex: 1; display: flex; align-items: center; justify-content: center; direction: ltr; font-family: Arial, sans-serif; font-size: 18px; font-weight: 700; gap: 6px; }
  .s-foot { text-align: center; padding: 5px 6px; }
  .d-ar { font-size: 11px; font-weight: 800; margin: 0; }
  .d-en { font-family: 'Tinos', serif; font-size: 8.5px; font-weight: 700; margin: 0; direction: ltr; }
  .footer-note { margin-top: 18px; font-size: 10.5px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .sheet { border: none; padding: 0; } }
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
        <svg width="42" height="48" viewBox="304 0 78 89"><path fill="#242120" d="${FLAME_DARK}"/><path fill="#FEC400" d="${FLAME_GOLD}"/></svg>
        <div>
          <h1>شركة نفوسة للعمليات النفطية بي.في</h1>
          <p>${esc(IT_DEPARTMENT)} — نظام إدارة أصول تقنية المعلومات</p>
        </div>
      </div>
      <div class="doc-badge">
        <span class="title">${esc(title)}</span>
        <div class="meta">رقم المرجع: <strong>${esc(record.id)}</strong> | التاريخ: <strong>${esc(record.date)}</strong></div>
      </div>
    </div>

    <h2>بيانات الجهاز</h2>
    <table class="grid">
      <tr><th>اسم الجهاز</th><td><strong>${esc(device.name)}</strong></td><th>النوع</th><td>${esc(deviceTypeLabel)}</td></tr>
      <tr><th>الماركة</th><td>${esc(device.brand)}</td><th>الرقم التسلسلي</th><td dir="ltr" style="text-align:right;font-family:monospace;font-weight:700;">${esc(device.serialNumber)}</td></tr>
      <tr><th>رقم الجهاز</th><td>${esc(device.id)}</td><th>حالة الجهاز</th><td><strong>${esc(condition)}</strong></td></tr>
      <tr><th>نوع العملية</th><td>${esc(CUSTODY_ACTIONS[record.action].label)}</td><th>تاريخ العملية</th><td dir="ltr" style="text-align:right;">${esc(record.date)}</td></tr>
    </table>

    <div class="parties">
      <div class="party">
        <div class="role">الطرف المسلِّم</div>
        <div class="name">${esc(from.name)}</div>
        <div class="dept">${esc(from.dept)}</div>
      </div>
      <div class="party">
        <div class="role">الطرف المستلِم</div>
        <div class="name">${esc(to.name)}</div>
        <div class="dept">${esc(to.dept)}</div>
      </div>
    </div>

    ${record.notes ? `<h2>ملاحظات</h2><div class="ack" style="border-right-color:#94a3b8;">${esc(record.notes)}</div>` : ''}

    <div class="ack">${ack}</div>

    <div class="signs">
      <div class="sign-box">
        <strong>توقيع المسلِّم</strong>
        <div class="sign-line"></div>
        <div>الاسم: ${esc(from.name)}</div>
      </div>
      <div class="sign-box">
        <strong>توقيع المستلِم</strong>
        <div class="sign-line"></div>
        <div>الاسم: ${esc(to.name)}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;gap:24px;">
      <div class="sign-box" style="max-width:260px;">
        <strong>اعتماد ${esc(IT_DEPARTMENT)}</strong>
        <div class="sign-line"></div>
        <div>الاسم: ${esc(record.performedByName || '........................................')}</div>
      </div>
      <div class="stamp-wrapper">
        <div class="stamp-box">
          <div class="upper">
            <div class="s-head">
              <svg class="s-logo" viewBox="304 0 78 89"><path d="${FLAME_DARK}"/><path d="${FLAME_GOLD}"/></svg>
              <div class="s-title">
                <p class="s-ar">شركة نفوسة للعمليات النفطية بي.في</p>
                <p class="s-en">Nafusah Oil Operation B.V</p>
              </div>
              <svg class="s-logo" viewBox="304 0 78 89"><path d="${FLAME_DARK}"/><path d="${FLAME_GOLD}"/></svg>
            </div>
            <div class="s-mid">
              <div class="side-r"><span class="v-ar">أستلم</span></div>
              <div class="s-date"><span>${esc(year)}</span><span>-${esc(month)}-</span><span>${esc(day)}</span></div>
              <div class="side-l"><span class="v-en">RECEVIDE</span></div>
            </div>
          </div>
          <div class="s-foot">
            <p class="d-ar">${esc(IT_DEPARTMENT)}</p>
            <p class="d-en">Information and Communications Technology Department</p>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-note">صدر هذا النموذج من نظام إدارة أصول تقنية المعلومات — مرجع القيد ${esc(record.id)}</div>
  </div>
  <script>
    window.onload = function () { setTimeout(function () { window.print(); }, 300); };
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
}
