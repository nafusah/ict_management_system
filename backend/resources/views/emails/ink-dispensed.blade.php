<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>إشعار صرف حبر</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Tahoma,Arial,sans-serif;color:#0f172a;direction:rtl;text-align:right;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:20px 24px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">{{ $details['orgName'] }}</p>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:700;">إشعار صرف حبر</h1>
    </div>

    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#334155;">
        تم تنفيذ عملية <strong>{{ $details['operationLabel'] }}</strong> بنجاح، وفيما يلي تفاصيل الصرف:
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <tbody>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;width:180px;">الإدارة / القسم</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['department'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">نطاق الصرف</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">
              {{ $details['scopeLabel'] }}
              @if(!empty($details['recipientName']))
                — <strong>{{ $details['recipientName'] }}</strong>
              @endif
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">تاريخ الصرف</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['date'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">المنفذ / المعتمد</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['performedBy'] }}</td>
          </tr>
          @if(!empty($details['voucherId']))
            <tr>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">رقم إذن الصرف</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['voucherId'] }}</td>
            </tr>
          @endif
          @if(!empty($details['requesterName']))
            <tr>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">مقدم الطلب</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['requesterName'] }}</td>
            </tr>
          @endif
          @if(!empty($details['notes']))
            <tr>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">ملاحظات</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">{{ $details['notes'] }}</td>
            </tr>
          @endif
        </tbody>
      </table>

      <h2 style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0f172a;">الأحبار المصروفة</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f1f5f9;color:#0f172a;">
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">الموديل / النوع</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">الماركة</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">اللون</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:right;">نوع الطابعة</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;">الكمية المصروفة</th>
            <th style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;">المتبقي بالمخزون</th>
          </tr>
        </thead>
        <tbody>
          @foreach($details['items'] as $item)
            <tr>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;font-weight:700;">{{ $item['model'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['brand'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['colorName'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;">{{ $item['printerTypeName'] ?: '—' }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;font-weight:700;">{{ $item['dispensedQty'] }}</td>
              <td style="padding:9px 10px;border:1px solid #e2e8f0;text-align:center;">
                <span style="font-weight:700;color:{{ $item['isLowStock'] ? '#b91c1c' : '#0f172a' }};">
                  {{ $item['remainingQty'] }}
                </span>
                @if($item['isLowStock'])
                  <span style="display:inline-block;margin-right:4px;padding:1px 6px;border-radius:999px;background:#fef2f2;color:#b91c1c;font-size:11px;">
                    نقص مخزون
                  </span>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>

    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
      تم إرسال هذا الإشعار تلقائياً من نظام {{ $details['orgName'] }}.
    </div>
  </div>
</body>
</html>
