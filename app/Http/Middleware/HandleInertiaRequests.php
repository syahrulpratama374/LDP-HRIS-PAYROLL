<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Menu;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $userMenus = [];

        if ($user) {
            // Ambil menu parent (parent_id IS NULL) beserta submenunya yang diizinkan untuk role user saat ini
            $userMenus = Menu::whereNull('parent_id')
                ->where('is_active', true)
                ->whereHas('roles', function ($query) use ($user) {
                    $query->where('roles.id', $user->role_id);
                })
                ->with(['children' => function ($query) use ($user) {
                    $query->where('is_active', true)
                        ->whereHas('roles', function ($q) use ($user) {
                            $q->where('roles.id', $user->role_id);
                        })
                        ->orderBy('order', 'asc');
                }])
                ->orderBy('order', 'asc')
                ->get();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->load('role', 'karyawan.departemen', 'karyawan.jabatan') : null,
                'menus' => $userMenus, // <-- Menu dinamis terkirim ke semua komponen React!
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}