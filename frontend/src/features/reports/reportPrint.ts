/**
 * قالب طباعة التقارير — بنفس هوية نماذج النظام (ترويسة شركة نفوسة وإدارة الاتصالات وتقنية المعلومات).
 * يُفتح في نافذة جديدة ويُطبع تلقائياً.
 */

export type CellTone = 'red' | 'amber' | 'green' | 'blue' | 'slate'
export type ReportCell = string | number | null | undefined | { text: string | number; tone?: CellTone; bold?: boolean; ltr?: boolean }

export interface ReportColumn {
  label: string
  ltr?: boolean
  width?: string
}

export interface ReportTable {
  title: string
  columns: ReportColumn[]
  rows: ReportCell[][]
  empty?: string
  footer?: ReportCell[]
}

export interface ReportDoc {
  title: string
  section: string
  reference: string
  generatedBy: string
  filters: string
  summary: { label: string; value: string | number; tone?: CellTone }[]
  tables: ReportTable[]
  landscape?: boolean
}

const IT_DEPARTMENT = 'إدارة الاتصالات وتقنية المعلومات'
const FLAME_DARK =
  'M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z'
const FLAME_GOLD =
  'M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z'

const TONES: Record<CellTone, string> = {
  red: '#b91c1c',
  amber: '#a16207',
  green: '#047857',
  blue: '#1e40af',
  slate: '#475569',
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cell(c: ReportCell, col?: ReportColumn): string {
  const obj = c !== null && typeof c === 'object' ? c : { text: c ?? '—' }
  const text = obj.text === '' || obj.text === null || obj.text === undefined ? '—' : obj.text
  const styles: string[] = []
  if (obj.tone) styles.push(`color:${TONES[obj.tone]}`)
  if (obj.bold || obj.tone === 'red') styles.push('font-weight:700')
  const ltr = obj.ltr ?? col?.ltr
  return `<td${ltr ? ' dir="ltr" class="ltr"' : ''}${styles.length ? ` style="${styles.join(';')}"` : ''}>${esc(text)}</td>`
}

function nowStamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** تُفتح النافذة فوراً عند الضغط (حتى لا يمنعها المتصفح) ثم يُكتب فيها التقرير بعد موافقة الخادم. */
export function openReportWindow(): Window | null {
  const win = window.open('', '_blank', 'width=1100,height=800')
  if (win) {
    win.document.write(
      '<html dir="rtl"><body style="font-family:Tahoma,sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;color:#475569">جارٍ تجهيز التقرير...</body></html>',
    )
  }
  return win
}

export function writeReport(win: Window, doc: ReportDoc) {
  const summary = doc.summary
    .map(
      (s) =>
        `<div class="tile"><div class="t-label">${esc(s.label)}</div><div class="t-value"${s.tone ? ` style="color:${TONES[s.tone]}"` : ''}>${esc(s.value)}</div></div>`,
    )
    .join('')

  const tables = doc.tables
    .map((t) => {
      const head = `<tr><th class="num">#</th>${t.columns.map((c) => `<th${c.width ? ` style="width:${c.width}"` : ''}>${esc(c.label)}</th>`).join('')}</tr>`
      const body = t.rows.length
        ? t.rows.map((r, i) => `<tr><td class="num">${i + 1}</td>${r.map((c, j) => cell(c, t.columns[j])).join('')}</tr>`).join('')
        : `<tr><td class="empty" colspan="${t.columns.length + 1}">${esc(t.empty ?? 'لا توجد بيانات')}</td></tr>`
      const foot = t.footer
        ? `<tfoot><tr><td class="num"></td>${t.footer.map((c, j) => cell(c, t.columns[j])).join('')}</tr></tfoot>`
        : ''
      return `<section><h2>${esc(t.title)} <span class="count">(${t.rows.length})</span></h2><table class="grid"><thead>${head}</thead><tbody>${body}</tbody>${foot}</table></section>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${esc(doc.title)} - ${esc(doc.reference)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800&display=swap');
  @page { size: A4 ${doc.landscape ? 'landscape' : 'portrait'}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 20px; font-family: 'Cairo', Tahoma, Arial, sans-serif; color: #0f172a; background: #fff; font-size: 12px; }
  .sheet { max-width: ${doc.landscape ? '1080px' : '800px'}; margin: 0 auto; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand h1 { margin: 0; font-size: 15px; font-weight: 800; }
  .brand p { margin: 2px 0 0; font-size: 11.5px; color: #475569; }
  .doc-badge { text-align: left; }
  .doc-badge .title { display: inline-block; background: #0f172a; color: #fff; padding: 5px 14px; border-radius: 6px; font-size: 14px; font-weight: 800; }
  .doc-badge .meta { margin-top: 6px; font-size: 11px; color: #334155; }
  .info { display: flex; flex-wrap: wrap; gap: 6px 22px; font-size: 11.5px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; }
  .info strong { color: #0f172a; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 16px; }
  .tile { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; }
  .t-label { font-size: 10.5px; color: #64748b; }
  .t-value { font-size: 18px; font-weight: 800; margin-top: 2px; }
  section { margin-bottom: 16px; }
  h2 { font-size: 13px; margin: 0 0 6px; color: #0f172a; border-right: 3px solid #fcc41a; padding-right: 8px; }
  h2 .count { font-weight: 500; color: #64748b; font-size: 11px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.grid th, table.grid td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: right; vertical-align: top; }
  table.grid th { background: #f1f5f9; font-weight: 700; }
  table.grid tfoot td { background: #f8fafc; font-weight: 800; }
  table.grid td.ltr { text-align: right; font-family: Arial, sans-serif; }
  table.grid .num { width: 28px; text-align: center; color: #64748b; }
  table.grid td.empty { text-align: center; color: #94a3b8; padding: 14px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .signs { display: flex; gap: 40px; margin-top: 28px; }
  .sign-box { flex: 1; border-top: 1px dashed #94a3b8; padding-top: 6px; font-size: 11.5px; color: #334155; }
  .sign-line { height: 36px; }
  .footer-note { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <svg width="40" height="46" viewBox="304 0 78 89"><path fill="#242120" d="${FLAME_DARK}"/><path fill="#FEC400" d="${FLAME_GOLD}"/></svg>
        <div>
          <h1>شركة نفوسة للعمليات النفطية بي.في</h1>
          <p>${esc(IT_DEPARTMENT)} — نظام إدارة أصول تقنية المعلومات</p>
        </div>
      </div>
      <div class="doc-badge">
        <span class="title">${esc(doc.title)}</span>
        <div class="meta">رقم المرجع: <strong>${esc(doc.reference)}</strong></div>
      </div>
    </div>

    <div class="info">
      <span>القسم: <strong>${esc(doc.section)}</strong></span>
      <span>تاريخ الإصدار: <strong dir="ltr">${esc(nowStamp())}</strong></span>
      <span>أُعدّ بواسطة: <strong>${esc(doc.generatedBy)}</strong></span>
      <span>نطاق التقرير: <strong>${esc(doc.filters)}</strong></span>
    </div>

    ${summary ? `<div class="tiles">${summary}</div>` : ''}
    ${tables}

    <div class="signs">
      <div class="sign-box"><strong>أعدّه</strong><div class="sign-line"></div><div>الاسم: ${esc(doc.generatedBy)}</div></div>
      <div class="sign-box"><strong>اعتماد مدير ${esc(IT_DEPARTMENT)}</strong><div class="sign-line"></div><div>الاسم: ........................................</div></div>
    </div>

    <div class="footer-note">صدر هذا التقرير من نظام إدارة أصول تقنية المعلومات — مرجع ${esc(doc.reference)} — مسجّل في سجل التدقيق</div>
  </div>
  <script>
    window.onload = function () { setTimeout(function () { window.print(); }, 400); };
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
}
