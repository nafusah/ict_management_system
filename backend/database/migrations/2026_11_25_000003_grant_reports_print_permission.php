<?php

use App\Models\AppUser;
use Illuminate\Database\Migrations\Migration;

/**
 * صلاحية "طباعة التقارير" حصرية: تُمنح لمالك النظام فقط،
 * ولا يمنحها أو يسحبها بعد ذلك إلا من يملكها (انظر AppUserController).
 */
return new class extends Migration
{
    public function up(): void
    {
        $owner = AppUser::withTrashed()
            ->where('email', 'm.alhamali@nafusah.com')
            ->orWhere('id', 'USR-001')
            ->orderByRaw("CASE WHEN email = 'm.alhamali@nafusah.com' THEN 0 ELSE 1 END")
            ->first();

        if (! $owner) {
            return;
        }

        $perms = is_array($owner->permissions) ? $owner->permissions : [];
        if (! in_array('reports.print', $perms, true)) {
            $perms[] = 'reports.print';
            $owner->permissions = array_values($perms);
            $owner->save();
        }
    }

    public function down(): void
    {
        AppUser::withTrashed()->get()->each(function (AppUser $user): void {
            $perms = is_array($user->permissions) ? $user->permissions : [];
            if (in_array('reports.print', $perms, true)) {
                $user->permissions = array_values(array_diff($perms, ['reports.print']));
                $user->save();
            }
        });
    }
};
