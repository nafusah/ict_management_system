<?php

use App\Models\AppUser;
use Illuminate\Database\Migrations\Migration;

/** يمنح صلاحيات قسم الحوكمة لمديري النظام الحاليين. */
return new class extends Migration
{
    public function up(): void
    {
        $governancePerms = [
            'strategy.view',
            'strategy.manage',
            'projects.view',
            'projects.manage',
        ];

        AppUser::withTrashed()->get()->each(function (AppUser $user) use ($governancePerms): void {
            $perms = is_array($user->permissions) ? $user->permissions : [];
            if (! in_array('settings.manage', $perms, true)) {
                return;
            }

            $merged = array_values(array_unique(array_merge($perms, $governancePerms)));
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
