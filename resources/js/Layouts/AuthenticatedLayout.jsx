import { usePage, Link, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
    ChevronDown,
    LayoutDashboard,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Calendar,
    CalendarDays,
    Clock,
    Users,
    User,
    Building2,
    Briefcase,
    FileBarChart,
    Wallet,
    Settings,
    FolderOpen,
    BarChart3,
    ClipboardList,
    Home,
    Headset,
} from "lucide-react";

const MENU_ICON_MAP = [
    { keys: ["absen", "presensi", "attendance", "kehadiran"], Icon: Calendar },
    { keys: ["cuti", "leave", "izin"], Icon: CalendarDays },
    { keys: ["lembur", "overtime", "shift", "roster", "jadwal"], Icon: Clock },
    { keys: ["dashboard", "beranda", "home"], Icon: LayoutDashboard },
    { keys: ["karyawan", "employee", "pegawai", "staff"], Icon: Users },
    {
        keys: ["departemen", "department", "divisi", "division", "unit"],
        Icon: Building2,
    },
    { keys: ["jabatan", "position", "role"], Icon: Briefcase },
    { keys: ["laporan", "report", "rekap"], Icon: FileBarChart },
    { keys: ["gaji", "payroll", "penggajian", "salary"], Icon: Wallet },
    { keys: ["setting", "pengaturan", "config"], Icon: Settings },
    { keys: ["dokumen", "document", "arsip", "file"], Icon: FolderOpen },
    { keys: ["statistik", "statistic", "analitik"], Icon: BarChart3 },
    { keys: ["pengajuan", "request", "form"], Icon: ClipboardList },
    { keys: ["profil", "profile"], Icon: User },
    { keys: ["user", "akun"], Icon: User },
    { keys: ["ticket", "helpdesk", "it", "support"], Icon: Headset },
];

function getMenuIcon(menu) {
    const source =
        `${menu?.title || ""} ${menu?.route_name || ""}`.toLowerCase();
    for (const { keys, Icon } of MENU_ICON_MAP) {
        if (keys.some((k) => source.includes(k))) return Icon;
    }
    return Home;
}

export default function AuthenticatedLayout({
    user: propUser,
    header,
    children,
}) {
    const page = usePage();
    const { auth } = page.props;
    const user = propUser || auth?.user;
    const rawMenus = auth?.menus || [];

    // =========================================================================
    // FILTER MENU DINAMIS BERDASARKAN ROLE & DEPARTEMEN
    // =========================================================================
    const userDeptKode = (
        user?.karyawan?.departemen?.kode_departemen || ""
    ).toUpperCase();
    const userDeptName = (
        user?.karyawan?.departemen?.nama_departemen || ""
    ).toLowerCase();
    const userRoleName = user?.role?.nama_role || "";

    const isSupportTeam =
        userRoleName === "Admin" ||
        ["IT", "GA", "HC", "HR"].includes(userDeptKode) ||
        userDeptName.includes("information technology") ||
        userDeptName.includes("general affair") ||
        userDeptName.includes("human capital") ||
        userDeptName.includes("human resource") ||
        userDeptName === "it" ||
        userDeptName === "ga" ||
        userDeptName === "hc";

    const menus = rawMenus
        .map((menu) => {
            const initialChildCount = menu.children ? menu.children.length : 0;

            if (initialChildCount === 0) {
                return { ...menu, _hadChildren: false };
            }

            // Filter sub-menu di dalam parent
            const filteredChildren = menu.children.filter((child) => {
                // Sembunyikan 'Monitoring IT Ticket' jika bukan tim Admin/IT/GA
                if (
                    child.route_name === "admin.ticket.index" &&
                    !isSupportTeam
                ) {
                    return false;
                }
                return true;
            });

            return {
                ...menu,
                children: filteredChildren,
                _hadChildren: true,
            };
        })
        .filter((menu) => {
            // Hapus menu parent HANYA jika sebelumnya punya anak menu, namun habis setelah difilter
            if (menu._hadChildren && menu.children.length === 0) return false;
            return true;
        });

    // Deteksi layar mobile
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    const [isCollapsed, setIsCollapsed] = useState(isMobile);
    const [openSubmenus, setOpenSubmenus] = useState({});

    // ====== Auto-Expand Submenu yang Aktif ======
    useEffect(() => {
        const activeSubmenus = {};
        menus.forEach((menu) => {
            if (menu.children && menu.children.length > 0) {
                const hasActiveChild = menu.children.some(
                    (child) =>
                        child.route_name && route().current(child.route_name),
                );
                if (hasActiveChild) {
                    activeSubmenus[menu.id] = true;
                }
            }
        });
        setOpenSubmenus((prev) => ({ ...prev, ...activeSubmenus }));
    }, [page.url, menus]);

    // ====== Auto-collapse saat pindah halaman HANYA untuk layar kecil ======
    const prevUrlRef = useRef(page.url);
    useEffect(() => {
        if (prevUrlRef.current !== page.url) {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            }
            prevUrlRef.current = page.url;
        }
    }, [page.url]);

    const toggleSidebar = () => setIsCollapsed((v) => !v);

    const toggleSubmenu = (menuId) => {
        setOpenSubmenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route("logout"));
    };

    return (
        <div className="flex min-h-screen bg-[#F8F7FC]">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(243, 184, 23, 0.25);
                    border-radius: 999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(243, 184, 23, 0.55);
                }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(243,184,23,0.3) transparent; }
            `}</style>

            {/* ================= SIDEBAR ================= */}
            <aside
                className={`${
                    isCollapsed ? "w-20" : "absolute z-50 w-64 md:relative"
                } sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#2A164E] via-[#341A5A] to-[#431D6D] text-white border-r border-[#F3B817]/10 shadow-2xl shadow-[#2A164E]/40 transition-[width] duration-300 ease-in-out will-change-[width]`}
            >
                {/* -------- HEADER: LOGO + TOGGLE -------- */}
                <div className="relative flex h-16 shrink-0 items-center border-b border-white/10 px-4">
                    <Link
                        href={route("dashboard")}
                        className={`flex-1 overflow-hidden pr-10 transition-opacity duration-200 ${
                            isCollapsed
                                ? "pointer-events-none opacity-0"
                                : "opacity-100"
                        }`}
                    >
                        <span className="whitespace-nowrap bg-gradient-to-r from-[#F3B817] to-[#FFD966] bg-clip-text text-lg font-bold tracking-wider text-transparent">
                            LDP HRIS & ERP
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={toggleSidebar}
                        title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
                        className={`absolute top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-[#F3B817] ${
                            isCollapsed ? "right-6" : "right-3"
                        }`}
                    >
                        {isCollapsed ? (
                            <PanelLeftOpen className="h-5 w-5" />
                        ) : (
                            <PanelLeftClose className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* -------- MENU NAVIGASI -------- */}
                <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
                    {menus.map((menu) => {
                        const hasChildren =
                            menu.children && menu.children.length > 0;
                        const isOpen = !!openSubmenus[menu.id];
                        const MenuIcon = getMenuIcon(menu);

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
                                    className={`group flex items-center gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                                        isCurrent
                                            ? "bg-gradient-to-r from-[#F3B817] to-[#E8A900] font-semibold text-[#2A164E] shadow-lg shadow-[#F3B817]/25"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <MenuIcon
                                        className={`h-5 w-5 shrink-0 transition-colors ${
                                            isCurrent
                                                ? "text-[#2A164E]"
                                                : "text-white/55 group-hover:text-[#F3B817]"
                                        }`}
                                    />
                                    <span
                                        className={`transition-opacity duration-200 ${
                                            isCollapsed
                                                ? "hidden opacity-0 md:block"
                                                : "opacity-100"
                                        }`}
                                    >
                                        {menu.title}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <div key={menu.id} className="space-y-0.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isCollapsed) setIsCollapsed(false);
                                        toggleSubmenu(menu.id);
                                    }}
                                    title={isCollapsed ? menu.title : ""}
                                    className={`group flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                                        isOpen && !isCollapsed
                                            ? "bg-white/5 text-white"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <MenuIcon
                                        className={`h-5 w-5 shrink-0 transition-colors ${
                                            isOpen && !isCollapsed
                                                ? "text-[#F3B817]"
                                                : "text-white/55 group-hover:text-[#F3B817]"
                                        }`}
                                    />
                                    <span
                                        className={`flex-1 truncate text-left transition-opacity duration-200 ${
                                            isCollapsed
                                                ? "hidden opacity-0 md:block"
                                                : "opacity-100"
                                        }`}
                                    >
                                        {menu.title}
                                    </span>
                                    {!isCollapsed && (
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    )}
                                </button>

                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${
                                        !isCollapsed && isOpen
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="mt-1 ml-4 space-y-0.5 border-l border-white/10 py-1 pl-3">
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
                                                        className={`block truncate rounded-lg px-3 py-1.5 text-[13px] transition-colors duration-200 ${
                                                            isChildCurrent
                                                                ? "bg-[#F3B817]/15 font-semibold text-[#F3B817]"
                                                                : "text-white/60 hover:bg-white/5 hover:text-white"
                                                        }`}
                                                    >
                                                        {child.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* -------- FOOTER: PROFIL + LOGOUT -------- */}
                <div className="shrink-0 space-y-3 border-t border-white/10 bg-black/10 p-3">
                    <div
                        className={`flex items-center gap-3 ${
                            isCollapsed ? "justify-center" : "px-1"
                        }`}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F3B817] to-[#E8A900] text-sm font-bold text-[#2A164E] ring-2 ring-[#F3B817]/30">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-white">
                                    {user?.name || "User LDP"}
                                </p>
                                <p className="truncate text-[10px] text-white/50">
                                    {user?.role?.nama_role ||
                                        user?.email ||
                                        "Karyawan"}
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Keluar / Logout"
                        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-xs font-semibold text-red-300 transition-colors duration-200 hover:bg-red-500/20 hover:text-red-200 ${
                            isCollapsed ? "px-0" : "px-3"
                        }`}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Backdrop Mobile */}
            {isMobile && !isCollapsed && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            {/* ================= MAIN CONTENT ================= */}
            <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                {header && (
                    <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white px-6 py-4 shadow-sm md:px-8">
                        {header}
                    </header>
                )}
                <main className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
