<?php

use App\Models\AppUser;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $voucherPerms = [
            'inks.vouchers.view',
            'inks.vouchers.create',
            'inks.vouchers.approve',
        ];

        AppUser::withTrashed()->get()->each(function (AppUser $user) use ($voucherPerms): void {
            $perms = is_array($user->permissions) ? $user->permissions : [];
            if (! in_array('settings.manage', $perms, true) && ! in_array('inks.manage', $perms, true)) {
                return;
            }

            $merged = array_values(array_unique(array_merge($perms, $voucherPerms)));
            if (count($merged) !== count($perms)) {
                $user->permissions = $merged;
                $user->save();
            }
        });
    }

    public function down(): void
    {
        // صلاحيات اختيارية يمكن تعديلها من واجهة إدارة المستخدمين
    }
};
