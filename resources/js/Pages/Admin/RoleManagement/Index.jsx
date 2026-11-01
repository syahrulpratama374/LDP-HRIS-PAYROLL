import React, { useState } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Shield,
    CheckSquare,
    Square,
    Save,
    CheckCircle,
    Plus,
} from "lucide-react";

export default function RoleManagementIndex({ roles = [], menus = [] }) {
    const { flash } = usePage().props;
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || null);
    const [showRoleModal, setShowRoleModal] = useState(false);

    const activeRole = roles.find((r) => r.id === Number(selectedRoleId));
    const initialMenuIds = activeRole?.menus
        ? activeRole.menus.map((m) => m.id)
        : [];

    const { data, setData, post, processing } = useForm({
        role_id: selectedRoleId,
        menu_ids: initialMenuIds,
    });

    const roleForm = useForm({
        nama_role: "",
    });

    const handleSelectRole = (roleId) => {
        setSelectedRoleId(roleId);
        const targetRole = roles.find((r) => r.id === Number(roleId));
        const activeIds = targetRole?.menus
            ? targetRole.menus.map((m) => m.id)
            : [];

        setData({
            role_id: roleId,
            menu_ids: activeIds,
        });
    };

    const handleToggleMenu = (menuId, children = []) => {
        let updatedMenuIds = [...data.menu_ids];

        if (updatedMenuIds.includes(menuId)) {
            updatedMenuIds = updatedMenuIds.filter((id) => id !== menuId);
            if (children.length > 0) {
                const childIds = children.map((c) => c.id);
                updatedMenuIds = updatedMenuIds.filter(
                    (id) => !childIds.includes(id),
                );
            }
        } else {
            updatedMenuIds.push(menuId);
            if (children.length > 0) {
                const childIds = children.map((c) => c.id);
                childIds.forEach((cId) => {
                    if (!updatedMenuIds.includes(cId)) {
                        updatedMenuIds.push(cId);
                    }
                });
            }
        }

        setData("menu_ids", updatedMenuIds);
    };

    const handleSubmitPermissions = (e) => {
        e.preventDefault();
        post(route("admin.role.update"), {
            preserveScroll: true,
        });
    };

    const handleCreateRole = (e) => {
        e.preventDefault();
        roleForm.post(route("admin.role.storeRole"), {
            onSuccess: () => {
                roleForm.reset();
                setShowRoleModal(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-indigo-600" />
                    Pengaturan Hak Akses Role & Menu
                </h2>
            }
        >
            <Head title="Manajemen Role & Hak Akses" />

            <div className="max-w-7xl mx-auto space-y-6">
                {flash?.success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 shadow-sm">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium">
                            {flash.success}
                        </span>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* PANEL KIRI: LIST ROLE & TOMBOL TAMBAH ROLE */}
                    <div className="p-4 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Daftar Role
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowRoleModal(true)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Role Baru
                            </button>
                        </div>

                        <div className="space-y-1">
                            {roles.map((role) => {
                                const isSelected =
                                    Number(selectedRoleId) === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectRole(role.id)
                                        }
                                        className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                                            isSelected
                                                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                    >
                                        <span>
                                            {role.nama_role || role.name}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${
                                                isSelected
                                                    ? "bg-indigo-700 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                            }`}
                                        >
                                            {role.menus?.length || 0} menu
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* PANEL KANAN: CENTANG PERMISSION MENU */}
                    <div className="md:col-span-3 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Hak Akses:{" "}
                                    <span className="text-indigo-600">
                                        {activeRole?.nama_role ||
                                            activeRole?.name}
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Centang menu atau modul yang diizinkan untuk
                                    diakses oleh role ini.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmitPermissions}
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Perubahan"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {menus.map((parent) => {
                                const isParentChecked = data.menu_ids.includes(
                                    parent.id,
                                );
                                const hasChildren =
                                    parent.children &&
                                    parent.children.length > 0;

                                return (
                                    <div
                                        key={parent.id}
                                        className={`p-4 rounded-xl border transition-all ${
                                            isParentChecked
                                                ? "bg-indigo-50/30 border-indigo-200 shadow-sm"
                                                : "bg-white border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label
                                                onClick={() =>
                                                    handleToggleMenu(
                                                        parent.id,
                                                        parent.children,
                                                    )
                                                }
                                                className="flex items-center gap-3 cursor-pointer select-none group"
                                            >
                                                {isParentChecked ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                                                )}
                                                <span
                                                    className={`text-sm font-bold ${isParentChecked ? "text-indigo-950" : "text-gray-800"}`}
                                                >
                                                    {parent.title}
                                                </span>
                                            </label>
                                        </div>

                                        {hasChildren && (
                                            <div className="mt-3 pl-6 pt-3 border-t border-gray-100 space-y-2">
                                                {parent.children.map(
                                                    (child) => {
                                                        const isChildChecked =
                                                            data.menu_ids.includes(
                                                                child.id,
                                                            );

                                                        return (
                                                            <label
                                                                key={child.id}
                                                                onClick={() =>
                                                                    handleToggleMenu(
                                                                        child.id,
                                                                    )
                                                                }
                                                                className="flex items-center gap-2.5 cursor-pointer select-none group text-xs text-gray-600 hover:text-gray-900"
                                                            >
                                                                {isChildChecked ? (
                                                                    <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                                                                ) : (
                                                                    <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" />
                                                                )}
                                                                <span
                                                                    className={
                                                                        isChildChecked
                                                                            ? "font-semibold text-gray-900"
                                                                            : ""
                                                                    }
                                                                >
                                                                    {
                                                                        child.title
                                                                    }
                                                                </span>
                                                            </label>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL TAMBAH ROLE BARU */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900">
                            Tambah Role Jabatan Baru
                        </h3>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Nama Role
                                </label>
                                <input
                                    type="text"
                                    value={roleForm.data.nama_role}
                                    onChange={(e) =>
                                        roleForm.setData(
                                            "nama_role",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: General Affair, NOC Specialist"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                                {roleForm.errors.nama_role && (
                                    <span className="text-xs text-red-500">
                                        {roleForm.errors.nama_role}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRoleModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={roleForm.processing}
                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Simpan Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
