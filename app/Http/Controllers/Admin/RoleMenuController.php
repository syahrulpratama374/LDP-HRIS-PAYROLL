<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Menu;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleMenuController extends Controller
{
    public function index()
    {
        $roles = Role::with('menus')->get();
        $menus = Menu::whereNull('parent_id')
            ->with('children')
            ->orderBy('order', 'asc')
            ->get();

        return Inertia::render('Admin/RoleManagement/Index', [
            'roles' => $roles,
            'menus' => $menus,
        ]);
    }

    public function updatePermissions(Request $request)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
            'menu_ids' => 'array',
            'menu_ids.*' => 'exists:menus,id',
        ]);

        $role = Role::findOrFail($request->role_id);
        $role->menus()->sync($request->menu_ids ?? []);

        return back()->with('success', 'Hak akses role berhasil diperbarui!');
    }

    public function storeRole(Request $request)
    {
        $request->validate([
            'nama_role' => 'required|string|max:50|unique:roles,nama_role',
        ]);

        Role::create([
            'nama_role' => $request->nama_role,
        ]);

        return back()->with('success', 'Role baru berhasil ditambahkan!');
    }
}