import { usePage, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

export default function AuthenticatedLayout({
    user: propUser,
    header,
    children,
}) {
    const { auth } = usePage().props;
    const user = propUser || auth?.user;
    const menus = auth?.menus || [];

    // State untuk Toggle Buka/Tutup Sidebar
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openSubmenus, setOpenSubmenus] = useState({});

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleSubmenu = (menuId) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [menuId]: !prev[menuId],
        }));
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route("logout"));
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* SIDEBAR NAVIGATION (Dapat Diciutkan / Collapsible) */}
            <aside
                className={`${
                    isCollapsed ? "w-20" : "w-64"
                } bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 shadow-xl border-r border-slate-800 shrink-0 transition-all duration-300 ease-in-out`}
            >
                {/* HEADER SIDEBAR: LOGO & TOMBOL TOGGLE */}
                <div
                    className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
                >
                    {!isCollapsed && (
                        <Link
                            href={route("dashboard")}
                            className="text-lg font-bold tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors truncate"
                        >
                            LDP HRIS & ERP
                        </Link>
                    )}

                    {/* Tombol Buka / Tutup Sidebar */}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
                    >
                        {isCollapsed ? (
                            <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
                        ) : (
                            <PanelLeftClose className="w-5 h-5 text-slate-400" />
                        )}
                    </button>
                </div>

                {/* MENU NAVIGASI DINAMIS */}
                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {menus.map((menu) => {
                        const hasChildren =
                            menu.children && menu.children.length > 0;
                        const isOpen = !!openSubmenus[menu.id];

                        // Rendering Menu Single (Tanpa Dropdown)
                        if (!hasChildren) {
                            const isCurrent =
                                menu.route_name &&
                                route().current(menu.route_name);
                            return (
                                <Link
                                    key={menu.id}
                                    href={
                                        menu.route_name
                                            ? route(menu.route_name)
                                            : "#"
                                    }
                                    title={isCollapsed ? menu.title : ""}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isCurrent
                                            ? "bg-indigo-600 text-white shadow-md font-semibold"
                                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                    } ${isCollapsed ? "justify-center px-0" : ""}`}
                                >
                                    <LayoutDashboard className="w-5 h-5 text-slate-400 shrink-0" />
                                    {!isCollapsed && (
                                        <span className="truncate">
                                            {menu.title}
                                        </span>
                                    )}
                                </Link>
                            );
                        }

                        // Rendering Group/Parent Menu dengan Submenu
                        return (
                            <div key={menu.id} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isCollapsed) setIsCollapsed(false); // Otomatis buka sidebar jika menu diklik
                                        toggleSubmenu(menu.id);
                                    }}
                                    title={isCollapsed ? menu.title : ""}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all group ${
                                        isCollapsed ? "justify-center px-0" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <LayoutDashboard className="w-5 h-5 text-slate-400 shrink-0 group-hover:text-slate-200" />
                                        {!isCollapsed && (
                                            <span className="truncate">
                                                {menu.title}
                                            </span>
                                        )}
                                    </div>
                                    {!isCollapsed &&
                                        (isOpen ? (
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0" />
                                        ))}
                                </button>

                                {/* SUBMENU DROPDOWN (HANYA MUNCUL SAAT SIDEBAR TERBUKA) */}
                                {!isCollapsed && isOpen && (
                                    <div className="pl-9 pr-2 space-y-1 py-1">
                                        {menu.children.map((child) => {
                                            const isChildCurrent =
                                                child.route_name &&
                                                route().current(
                                                    child.route_name,
                                                );
                                            return (
                                                <Link
                                                    key={child.id}
                                                    href={
                                                        child.route_name
                                                            ? route(
                                                                  child.route_name,
                                                              )
                                                            : "#"
                                                    }
                                                    className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all truncate ${
                                                        isChildCurrent
                                                            ? "bg-indigo-500/20 text-indigo-300 font-bold border-l-2 border-indigo-400 pl-2.5"
                                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                                    }`}
                                                >
                                                    {child.title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* FOOTER SIDEBAR: PROFIL & TOMBOL LOGOUT */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-3">
                    {/* Info Profil Singkat */}
                    <div
                        className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "px-2"}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30 text-xs shrink-0">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-200 truncate">
                                    {user?.name || "User LDP"}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    {user?.role?.nama_role ||
                                        user?.email ||
                                        "Karyawan"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Tombol Logout */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Keluar / Logout"
                        className={`w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold transition-all border border-red-500/20 ${
                            isCollapsed ? "px-0" : "px-3"
                        }`}
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {header && (
                    <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
                        {header}
                    </header>
                )}
                <main className="p-8 flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
