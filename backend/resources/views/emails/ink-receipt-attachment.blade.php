<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>وصل استلام أحبار - {{ $details['receiptNo'] ?? $details['date'] }}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Tahoma, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      direction: rtl;
      text-align: right;
    }
    .toolbar {
      max-width: 780px;
      margin: 0 auto 12px;
      display: flex;
      justify-content: flex-end;
    }
    .print-btn {
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .sheet {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
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
      gap: 12px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand h1 { margin: 0; font-size: 16px; font-weight: 800; }
    .brand p { margin: 3px 0 0; font-size: 12px; color: #475569; }
    .doc-badge { text-align: left; }
    .doc-badge .title {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      padding: 5px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 800;
    }
    .doc-badge .meta { margin-top: 6px; font-size: 12px; color: #334155; }
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
    table.items th { background: #f1f5f9; font-weight: 700; }
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
    .sign-line { height: 42px; }
    .stamp-box {
      width: 310px;
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
    .stamp-logo { width: 28px; height: 32px; fill: currentColor; flex-shrink: 0; }
    .stamp-title { text-align: center; flex: 1; }
    .stamp-ar { font-size: 10px; font-weight: 800; margin: 0; }
    .stamp-en { font-family: 'Times New Roman', serif; font-size: 11.5px; font-weight: 700; margin: 0; direction: ltr; }
    .stamp-mid { display: flex; justify-content: space-between; align-items: stretch; height: 54px; margin-top: 2px; }
    .side-r { width: 42px; border-top: 2.5px solid #152b8c; border-left: 2.5px solid #152b8c; display: flex; align-items: center; justify-content: center; }
    .side-l { width: 42px; border-top: 2.5px solid #152b8c; border-right: 2.5px solid #152b8c; display: flex; align-items: center; justify-content: center; }
    .v-ar { writing-mode: vertical-rl; font-size: 14px; font-weight: 800; }
    .v-en { writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'Times New Roman', serif; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
    .date-mid { flex: 1; display: flex; align-items: center; justify-content: center; direction: ltr; font-family: Arial, sans-serif; font-size: 18px; font-weight: 700; }
    .stamp-foot { text-align: center; padding: 5px 6px; }
    .dept-ar { font-size: 11px; font-weight: 800; margin: 0; }
    .dept-en { font-family: 'Times New Roman', serif; font-size: 8.5px; font-weight: 700; margin: 0; direction: ltr; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .toolbar { display: none; }
      .sheet { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  @php
    $dateStr = (string) ($details['date'] ?? now()->toDateString());
    $parts = explode('-', $dateStr);
    $year = $parts[0] ?? now()->format('Y');
    $month = $parts[1] ?? now()->format('m');
    $day = $parts[2] ?? now()->format('d');
    $totalQty = collect($details['items'] ?? [])->sum('dispensedQty');
    $receiptNo = $details['voucherId'] ?? ('DSP-'.str_replace('-', '', $dateStr));
  @endphp

  <div class="toolbar">
    <button type="button" class="print-btn" onclick="window.print()">طباعة وصل الاستلام</button>
  </div>

  <div class="sheet">
    <div class="header">
      <div class="brand">
        <svg width="40" height="46" viewBox="304 0 78 89">
          <path fill="#242120" d="M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z"/>
          <path fill="#FEC400" d="M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z"/>
        </svg>
        <div>
          <h1>شركة نفوسة للعمليات النفطية بي.في</h1>
          <p>{{ $details['orgName'] ?? 'إدارة الإتصالات وتقنية المعلومات' }}</p>
        </div>
      </div>
      <div class="doc-badge">
        <span class="title">وصل استلام أحبار</span>
        <div class="meta">رقم المرجع: <strong>{{ $receiptNo }}</strong> | التاريخ: <strong>{{ $dateStr }}</strong></div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <span class="info-label">الجهة / المستلم</span>
        <span class="info-value">
          {{ $details['department'] }}
          @if(!empty($details['recipientName']))
            — {{ $details['recipientName'] }}
          @else
            (صرف جماعي)
          @endif
        </span>
      </div>
      <div>
        <span class="info-label">إجمالي الكمية المصروفة</span>
        <span class="info-value">{{ $totalQty }} خرطوش</span>
      </div>
      @if(!empty($details['requesterName']))
        <div>
          <span class="info-label">مقدم الطلب</span>
          <span class="info-value">{{ $details['requesterName'] }}</span>
        </div>
      @endif
      @if(!empty($details['performedBy']))
        <div>
          <span class="info-label">تم الصرف بواسطة</span>
          <span class="info-value">{{ $details['performedBy'] }}</span>
        </div>
      @endif
      @if(!empty($details['notes']))
        <div style="grid-column:1 / -1;">
          <span class="info-label">ملاحظات</span>
          <span class="info-value">{{ $details['notes'] }}</span>
        </div>
      @endif
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
      <tbody>
        @foreach($details['items'] as $idx => $item)
          <tr>
            <td style="text-align:center;">{{ $idx + 1 }}</td>
            <td style="font-weight:700;">{{ $item['model'] }}</td>
            <td>{{ $item['brand'] }}</td>
            <td>{{ $item['colorName'] }}</td>
            <td>{{ $item['printerTypeName'] ?: '—' }}</td>
            <td style="text-align:center;font-weight:700;">{{ $item['dispensedQty'] }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <div class="ack">
      أقر أنا الموقع أدناه باستلام أصناف الأحبار الموضحة أعلاه بحالة سليمة وكاملة، وتم قيدها في عهدة الجهة المستلمة.
    </div>

    <div class="footer-sign">
      <div class="sign-box">
        <strong>توقيع المستلم</strong>
        <div class="sign-line"></div>
        <div>الاسم: {{ $details['recipientName'] ?: '........................................' }}</div>
        <div style="margin-top:4px;">التاريخ: {{ $dateStr }}</div>
      </div>

      <div class="stamp-wrapper">
        <div class="stamp-box">
          <div class="upper-section">
            <div class="stamp-header">
              <svg class="stamp-logo" viewBox="304 0 78 89">
                <path d="M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z"/>
                <path d="M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z"/>
              </svg>
              <div class="stamp-title">
                <p class="stamp-ar">شركة نفوسة للعمليات النفطية بي.في</p>
                <p class="stamp-en">Nafusah Oil Operation B.V</p>
              </div>
              <svg class="stamp-logo" viewBox="304 0 78 89">
                <path d="M350.622,1.627 C342.084,40.893 401.711,49.99 349.868,87.373 C355.865,57.449 349.922,58.045 342.084,46.309 C328.252,25.597 348.752,8.104 350.622,1.627 z"/>
                <path d="M323.194,28.282 C298.842,53.708 309.397,78.468 333.91,87.357 C349.583,60.956 321.311,61.744 323.194,28.282 z"/>
              </svg>
            </div>
            <div class="stamp-mid">
              <div class="side-r"><span class="v-ar">أستلم</span></div>
              <div class="date-mid">
                <span style="margin-right:8px;">{{ $year }}</span>
                <span style="margin-right:8px;">-{{ $month }}-</span>
                <span>{{ $day }}</span>
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
</body>
</html>
