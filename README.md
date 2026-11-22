# ICT Management System — نظام إدارة تقنية المعلومات

نظام ويب داخلي لشركة **نفوسة** لإدارة أصول ومصروفات تقنية المعلومات: الأجهزة، مخزون الأحبار وأذونات صرفها، واشتراكات الخدمات التقنية، مع صلاحيات دقيقة للمستخدمين وإشعارات بالبريد الإلكتروني.

## المحتويات

- [الوحدات](#الوحدات)
- [البنية التقنية](#البنية-التقنية)
- [هيكل المشروع](#هيكل-المشروع)
- [التشغيل بـ Docker (الإنتاج)](#التشغيل-بـ-docker-الإنتاج)
- [التطوير المحلي](#التطوير-المحلي)
- [المهام المجدولة والطابور](#المهام-المجدولة-والطابور)
- [أوامر Artisan المفيدة](#أوامر-artisan-المفيدة)
- [البريد الإلكتروني (Microsoft Graph)](#البريد-الإلكتروني-microsoft-graph)
- [الاختبارات](#الاختبارات)

## الوحدات

| الوحدة | الوصف |
|---|---|
| لوحة التحكم | ملخص الأجهزة والأحبار والاشتراكات حسب صلاحيات المستخدم |
| الأجهزة | سجل الأجهزة وتفاصيلها وموقعها والموظف المسؤول |
| الأحبار | المخزون، أحبار كل طابعة، الصرف الفردي والجماعي، تنبيه المخزون المنخفض |
| أذونات الصرف | إنشاء إذن صرف ← اعتماد/رفض ← صرف وإرسال إيصال بالبريد |
| الاشتراكات | الخدمات والمزودون والتصنيفات، صفحة ملخص، وتنبيهات قبل الانتهاء |
| القاموس | أنواع الأجهزة، الماركات، ألوان الأحبار، أنواع الطابعات، الخدمات |
| الإعدادات | المستخدمون والصلاحيات، الموظفون والإدارات، سجل التدقيق، الإشعارات، النسخ الاحتياطي |

## البنية التقنية

- **Backend:** Laravel 13 (PHP 8.3) — REST API تحت `/api` مع مصادقة بالتوكن (`auth.api`) وصلاحيات (`permission:...`).
- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Zustand + React Router 7 — واجهة عربية (RTL) بخط Tajawal.
- **قاعدة البيانات:** MySQL 8.
- **الطابور والكاش والجلسات:** driver `database`.
- **البريد:** Microsoft Graph (transport مخصص) أو أي mailer يدعمه Laravel.
- **النشر:** Docker Compose (mysql, api, queue, scheduler, nginx).

## هيكل المشروع

```
.
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Controllers لكل وحدة
│   │   ├── Models/
│   │   ├── Jobs/                   # النسخ الاحتياطي وفحص التنبيهات
│   │   ├── Mail/                   # رسائل البريد + MicrosoftGraphTransport
│   │   ├── Services/               # منطق الإشعارات والنسخ الاحتياطي
│   │   └── Console/Commands/       # أوامر Artisan
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/                # بيانات أولية + data/employees.json + data/ict_services.xlsx
│   └── routes/api.php              # كل مسارات الـ API والصلاحيات
├── frontend/                # React SPA
│   └── src/
│       ├── app/                    # App.tsx (المسارات) و Layout
│       ├── features/               # صفحة/Store لكل وحدة
│       └── shared/                 # مكونات مشتركة، api.ts، types.ts
├── docker/nginx/default.conf       # nginx: يخدم الواجهة ويمرر /api إلى php-fpm
└── docker-compose.yml
```

## التشغيل بـ Docker (الإنتاج)

1. أنشئ ملف `.env` في جذر المشروع (بجانب `docker-compose.yml`):

   ```env
   APP_KEY=base64:...            # مطلوب — انظر الأمر أدناه
   APP_URL=https://ims.example.com
   DB_PASSWORD=change-me
   MYSQL_ROOT_PASSWORD=change-me-too

   MAIL_MAILER=msgraph           # أو log أثناء التجربة
   MAIL_FROM_ADDRESS=noreply@nafusah.com
   MSGRAPH_TENANT_ID=
   MSGRAPH_CLIENT_ID=
   MSGRAPH_CLIENT_SECRET=
   MSGRAPH_USER_ID=
   ```

   لتوليد `APP_KEY`:

   ```bash
   docker compose run --rm api php artisan key:generate --show
   ```

2. ابنِ وشغّل:

   ```bash
   docker compose up -d --build
   ```

   حاوية `api` تشغّل `php artisan migrate --force` تلقائياً عند الإقلاع.

3. أول مرة فقط — أدخل البيانات الأولية:

   ```bash
   docker compose exec api php artisan db:seed --force
   ```

4. **ملاحظة عن المنفذ:** خدمة `nginx` تستخدم `expose: 80` فقط (بدون نشر للمنفذ على الجهاز المضيف)، أي أنها مُعدة للعمل خلف reverse proxy. للوصول المباشر أضف:

   ```yaml
   nginx:
     ports:
       - "80:80"
   ```

### المستخدم الافتراضي

الـ seeder ينشئ مستخدم مدير (`USR-001`) بكامل الصلاحيات وكلمة مرور افتراضية `123456`. **غيّرها فوراً** بعد أول دخول من الإعدادات.

## التطوير المحلي

### المتطلبات

- PHP 8.3+ و Composer
- Node.js 22+
- MySQL 8 (أو SQLite للتجربة السريعة)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# عدّل إعدادات DB_* في .env
php artisan migrate --seed
php artisan serve            # http://127.0.0.1:8000
```

في نافذة أخرى، لتشغيل الطابور (الإيميلات والنسخ الاحتياطي):

```bash
php artisan queue:work
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

خادم Vite يمرر طلبات `/api` تلقائياً إلى `http://127.0.0.1:8000` (انظر `frontend/vite.config.ts`).

أوامر أخرى:

```bash
npm run build    # بناء نسخة الإنتاج إلى dist/
npm run lint
```

## المهام المجدولة والطابور

معرّفة في `backend/routes/console.php` وتعمل عبر حاوية `scheduler`:

| المهمة | التوقيت |
|---|---|
| `CreateDatabaseBackupJob` — نسخة احتياطية لقاعدة البيانات | يومياً 02:00 |
| `CheckSystemAlertsJob` — تحديث حالات الاشتراكات وتنبيه المخزون المنخفض | يومياً 08:00 |
| `subscriptions:notify-expiring --scheduled` | كل دقيقة (يلتزم بالأيام والساعة المحددة في إعدادات الإشعارات) |

النسخ الاحتياطية تُحفظ في `storage/app/private/backups` ويمكن تنزيلها من صفحة الإعدادات.

## أوامر Artisan المفيدة

```bash
php artisan ict:import-subscriptions [file.xlsx] [--dry-run]   # استيراد الاشتراكات من Excel
php artisan subscriptions:notify-expiring                      # إرسال تنبيه الاشتراكات الآن
php artisan inks:notify-low-stock                              # إرسال تنبيه المخزون المنخفض
php artisan mail:test-graph you@nafusah.com                    # اختبار إرسال البريد عبر Graph
php artisan ict:backup                                         # إضافة نسخة احتياطية للطابور
php artisan ict:check-alerts                                   # إضافة فحص التنبيهات للطابور
```

## البريد الإلكتروني (Microsoft Graph)

الإرسال يتم عبر `App\Mail\Transport\MicrosoftGraphTransport` باستخدام تطبيق مسجّل في Azure AD بصلاحية `Mail.Send`. المتغيرات المطلوبة:

| المتغير | الوصف |
|---|---|
| `MSGRAPH_TENANT_ID` | معرّف الـ Tenant |
| `MSGRAPH_CLIENT_ID` | معرّف التطبيق |
| `MSGRAPH_CLIENT_SECRET` | السر — **لا يُحفظ في git** |
| `MSGRAPH_USER_ID` | صندوق البريد المُرسِل |
| `MSGRAPH_PROXY` | (اختياري) بروكسي للاتصال |
| `MSGRAPH_VERIFY_SSL` | (اختياري) افتراضياً `true` |

الرسائل المتاحة: صرف حبر، إشعار الموظف بالصرف، إعادة تعبئة، مخزون منخفض، تنبيه اشتراك.

## الاختبارات

```bash
cd backend
php artisan test
```
