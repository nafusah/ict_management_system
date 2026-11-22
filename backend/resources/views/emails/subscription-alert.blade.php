<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>{{ $details['title'] }}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Tahoma,Arial,sans-serif;color:#0f172a;direction:rtl;text-align:right;">
  @php
    $headerBg = match($details['tone'] ?? 'slate') {
      'red' => '#991b1b',
      'amber' => '#92400e',
      default => '#0f172a',
    };
  @endphp
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:{{ $headerBg }};color:#ffffff;padding:18px 24px;">
      <p style="margin:0;font-size:12px;color:#cbd5e1;">{{ $details['orgName'] }}</p>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:700;">{{ $details['title'] }}</h1>
    </div>

    <div style="padding:22px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#334155;">{{ $details['subtitle'] }}</p>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f1f5f9;color:#0f172a;">
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">الخدمة / الاشتراك</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">المزود</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">الموقع</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;">تاريخ الانتهاء</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          @foreach($details['items'] as $item)
            <tr>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;font-weight:700;">
                {{ $item['serviceName'] }}
                @if(!empty($item['poNumber']))
                  <div style="font-size:11px;font-weight:400;color:#64748b;">PO: {{ $item['poNumber'] }}</div>
                @endif
              </td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['provider'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['location'] ?: '—' }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;">{{ $item['endDate'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:{{ $item['isExpired'] ? '#b91c1c' : '#b45309' }};">
                {{ $item['statusLabel'] }}
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>

    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
      مع تحيات {{ $details['orgName'] }}.
    </div>
  </div>
</body>
</html>
