<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تنبيه نقص مخزون الأحبار</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Tahoma,Arial,sans-serif;color:#0f172a;direction:rtl;text-align:right;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #fecaca;border-radius:12px;overflow:hidden;">
    <div style="background:#991b1b;color:#ffffff;padding:18px 24px;">
      <p style="margin:0;font-size:12px;color:#fecaca;">{{ $details['orgName'] }}</p>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:700;">تنبيه نقص مخزون الأحبار</h1>
    </div>

    <div style="padding:22px 24px;">
      <p style="margin:0 0 14px;font-size:14px;color:#334155;">
        وصلت أصناف الأحبار التالية إلى حد التنبيه أو أقل، وتحتاج إلى إعادة تزويد:
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#fef2f2;color:#7f1d1d;">
            <th style="padding:9px 10px;border:1px solid #fecaca;text-align:right;">الموديل</th>
            <th style="padding:9px 10px;border:1px solid #fecaca;text-align:right;">الماركة</th>
            <th style="padding:9px 10px;border:1px solid #fecaca;text-align:right;">اللون</th>
            <th style="padding:9px 10px;border:1px solid #fecaca;text-align:right;">نوع الطابعة</th>
            <th style="padding:9px 10px;border:1px solid #fecaca;text-align:center;">المتوفر</th>
            <th style="padding:9px 10px;border:1px solid #fecaca;text-align:center;">حد التنبيه</th>
          </tr>
        </thead>
        <tbody>
          @foreach($details['items'] as $item)
            <tr>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;font-weight:700;">{{ $item['model'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['brand'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['colorName'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['printerTypeName'] ?: '—' }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:#b91c1c;">
                {{ $item['quantity'] }}
              </td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;color:#475569;">
                {{ $item['alertThreshold'] }}
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
