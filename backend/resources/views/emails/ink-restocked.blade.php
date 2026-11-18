<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>إشعار إضافة مخزون حبر</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Tahoma,Arial,sans-serif;color:#0f172a;direction:rtl;text-align:right;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #bbf7d0;border-radius:12px;overflow:hidden;">
    <div style="background:#065f46;color:#ffffff;padding:18px 24px;">
      <p style="margin:0;font-size:12px;color:#a7f3d0;">{{ $details['orgName'] }}</p>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:700;">{{ $details['operationLabel'] }}</h1>
    </div>

    <div style="padding:22px 24px;">
      <p style="margin:0 0 14px;font-size:14px;color:#334155;">
        تمت إضافة كمية جديدة إلى مخزون الأحبار بنجاح، وفيما يلي التفاصيل:
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tbody>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;width:180px;">الموديل / النوع</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;">{{ $details['model'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">الماركة</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['brand'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">اللون</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['colorName'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">نوع الطابعة</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['printerTypeName'] ?: '—' }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">الكمية المضافة</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#065f46;">+{{ $details['addedQty'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">الرصيد السابق ← الجديد</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['beforeQty'] }} ← <strong>{{ $details['afterQty'] }}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">المنفذ</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['performedBy'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">التاريخ</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['date'] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
      مع تحيات {{ $details['orgName'] }}.
    </div>
  </div>
</body>
</html>
