<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>إشعار صرف وتركيب حبر</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Tahoma,Arial,sans-serif;color:#0f172a;direction:rtl;text-align:right;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:18px 22px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">{{ $details['orgName'] }}</p>
      <h1 style="margin:6px 0 0;font-size:17px;font-weight:700;">إشعار صرف وتركيب حبر</h1>
    </div>

    <div style="padding:22px;font-size:14px;line-height:1.8;color:#334155;">
      <p style="margin:0 0 12px;">
        مرحباً {{ $details['recipientName'] ?: 'زميلنا العزيز' }}،
      </p>
      <p style="margin:0 0 14px;">
        نفيدك بأنه تم صرف حبر لطابعتكم وجاري حالياً تركيبه وتجهيزه للعمل، وذلك وفق التفاصيل التالية:
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        @foreach($details['items'] as $item)
          <p style="margin:4px 0;font-size:13px;color:#0f172a;">
            • <strong>{{ $item['model'] }}</strong> ({{ $item['brand'] }} — {{ $item['colorName'] }})
            @if(!empty($item['printerTypeName']))
              — للطابعة: <strong>{{ $item['printerTypeName'] }}</strong>
            @endif
            — الكمية: <strong>{{ $item['dispensedQty'] }}</strong>
          </p>
        @endforeach
        <p style="margin:8px 0 0;font-size:12px;color:#64748b;">
          الإدارة: {{ $details['department'] }} &nbsp;|&nbsp; التاريخ: {{ $details['date'] }}
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#475569;">
        مع تحيات إدارة الاتصالات وتقنية المعلومات.
      </p>
    </div>
  </div>
</body>
</html>
