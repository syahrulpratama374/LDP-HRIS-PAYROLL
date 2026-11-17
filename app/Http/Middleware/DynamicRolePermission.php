<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Menu;

class DynamicRolePermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1. Jika belum login, biarkan diselesaikan oleh middleware 'auth' bawaan
        if (!$user) {
            return $next($request);
        }

        // 2. Bypass penuh untuk Super Admin (Role ID = 1) agar tidak pernah terkunci
        if ($user->role_id === 1) {
            return $next($request);
        }

        // 3. Dapatkan nama route yang sedang diakses
        $currentRoute = $request->route()->getName();

        // Jika route tidak memiliki nama (misal halaman statis biasa), lewati pengecekan
        if (!$currentRoute) {
            return $next($request);
        }

        // Halaman universal untuk semua user login (tidak perlu menu)
        if ($currentRoute === 'dashboard' || str_starts_with($currentRoute, 'profile.')) {
            return $next($request);
        }

        // 4. Cek apakah route ini terdaftar di tabel menus dan diizinkan untuk role user saat ini
        $hasAccess = self::bolehAkses($user, $currentRoute);

        // 5. Jika tidak punya akses, kembalikan response 403 Forbidden
        if (!$hasAccess) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuka halaman ini.');
        }

        return $next($request);
    }

    /**
     * Apakah user boleh membuka route bernama $routeName (logika sama dengan handle()).
     * Dipakai juga oleh dashboard untuk menyembunyikan tautan yang akan berujung 403.
     */
    public static function bolehAkses($user, string $routeName): bool
    {
        if ($user->role_id === 1) {
            return true;
        }

        $menuRoutes = Menu::whereNotNull('route_name')
            ->whereHas('roles', function ($query) use ($user) {
                $query->where('roles.id', $user->role_id);
            })
            ->pluck('route_name');

        if ($menuRoutes->contains($routeName)) {
            return true;
        }

        // Fallback: prefix resource penuh = nama route menu tanpa segmen aksi terakhir
        // (mis. menu 'admin.payroll.index' -> 'admin.payroll.' mencakup admin.payroll.generate,
        // tetapi TIDAK mencakup admin.komponen.* atau admin.pinjaman.*).
        return $menuRoutes->contains(function ($menuRoute) use ($routeName) {
            $pos = strrpos($menuRoute, '.');
            $prefix = $pos === false ? $menuRoute . '.' : substr($menuRoute, 0, $pos + 1);

            return str_starts_with($routeName, $prefix);
        });
    }
}
