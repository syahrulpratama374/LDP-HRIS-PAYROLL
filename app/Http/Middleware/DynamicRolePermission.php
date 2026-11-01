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

        // 4. Cek apakah route ini terdaftar di tabel menus dan diizinkan untuk role user saat ini
        $hasAccess = Menu::where('route_name', $currentRoute)
            ->whereHas('roles', function ($query) use ($user) {
                $query->where('roles.id', $user->role_id);
            })
            ->exists();

        // Cek jika route merupakan bagian dari aksi grup/resource (misal: 'karyawan.index' -> 'karyawan.*')
        if (!$hasAccess) {
            $baseRoute = explode('.', $currentRoute)[0] . '.*';
            $hasAccess = Menu::where('route_name', 'LIKE', explode('.', $currentRoute)[0] . '%')
                ->whereHas('roles', function ($query) use ($user) {
                    $query->where('roles.id', $user->role_id);
                })
                ->exists();
        }

        // 5. Jika tidak punya akses, kembalikan response 403 Forbidden
        if (!$hasAccess) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuka halaman ini.');
        }

        return $next($request);
    }
}