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
    Menu
} from "lucide-react";

const MENU_ICON_MAP = [
    { keys: ["absen", "presensi", "attendance", "kehadiran"], Icon: Calendar },
    { keys: ["cuti", "leave", "izin"], Icon: CalendarDays },
    { keys: ["lembur", "overtime", "shift", "roster", "jadwal"], Icon: Clock },
    { keys: ["dashboard", "beranda", "home"], Icon: LayoutDashboard },
    { keys: ["karyawan", "employee", "pegawai", "staff"], Icon: Users },
    { keys: ["departemen", "department", "divisi", "division", "unit"], Icon: Building2 },
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
    const source = `${menu?.title || ""} ${menu?.route_name || ""}`.toLowerCase();
    for (const { keys, Icon } of MENU_ICON_MAP) {
        if (keys.some((k) => source.includes(k))) return Icon;
    }
    return Home;
}

export default function AuthenticatedLayout({ user: propUser, header, children }) {
    const page = usePage();
    const { auth } = page.props;
    const user = propUser || auth?.user;
    const rawMenus = auth?.menus || [];

    // LOGIKA FILTER MENU (TIDAK DIUBAH SAMA SEKALI)
    const userDeptKode = (user?.karyawan?.departemen?.kode_departemen || "").toUpperCase();
    const userDeptName = (user?.karyawan?.departemen?.nama_departemen || "").toLowerCase();
    const userRoleName = user?.role?.nama_role || "";

    const isSupportTeam =
        userRoleName === "Admin" ||
        ["IT", "GA", "HC", "HR"].includes(userDeptKode) ||
        userDeptName.includes("information technology") ||
        userDeptName.includes("general affair") ||
        userDeptName.includes("human capital") ||
        userDeptName.includes("human resource") ||
        userDeptName === "it" || userDeptName === "ga" || userDeptName === "hc";

    const menus = rawMenus.map((menu) => {
        const initialChildCount = menu.children ? menu.children.length : 0;
        if (initialChildCount === 0) return { ...menu, _hadChildren: false };
        const filteredChildren = menu.children.filter((child) => {
            if (child.route_name === "admin.ticket.index" && !isSupportTeam) return false;
            return true;
        });
        return { ...menu, children: filteredChildren, _hadChildren: true };
    }).filter((menu) => {
        if (menu._hadChildren && menu.children.length === 0) return false;
        return true;
    });

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const [isCollapsed, setIsCollapsed] = useState(isMobile);
    const [openSubmenus, setOpenSubmenus] = useState({});

    useEffect(() => {
        const activeSubmenus = {};
        menus.forEach((menu) => {
            if (menu.children && menu.children.length > 0) {
                const hasActiveChild = menu.children.some(
                    (child) => child.route_name && route().current(child.route_name)
                );
                if (hasActiveChild) activeSubmenus[menu.id] = true;
            }
        });
        setOpenSubmenus((prev) => ({ ...prev, ...activeSubmenus }));
    }, [page.url, menus]);

    const prevUrlRef = useRef(page.url);
    useEffect(() => {
        if (prevUrlRef.current !== page.url) {
            if (window.innerWidth < 768) setIsCollapsed(true);
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
        <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>

            {/* ================= SIDEBAR ================= */}
            <aside
                className={`${
                    isCollapsed ? "w-20" : "absolute z-50 w-64 md:relative"
                } h-full flex shrink-0 flex-col bg-[#2A164E] text-white transition-[width] duration-300 ease-in-out`}
            >
                {/* HEADER LOGO */}
                <div className="relative flex h-16 shrink-0 items-center border-b border-white/10 px-4">
                    <Link
                        href={route("dashboard")}
                        className={`flex-1 overflow-hidden transition-opacity ${
                            isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
                        }`}
                    >
                        <span className="whitespace-nowrap text-lg font-bold tracking-wider text-white">
                            LDP <span className="text-[#F3B817]">HRIS</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className={`absolute top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white ${
                            isCollapsed ? "right-4" : "right-3"
                        }`}
                    >
                        {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>
                </div>

                {/* MENU NAVIGASI */}
                <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
                    {menus.map((menu) => {
                        const hasChildren = menu.children && menu.children.length > 0;
                        const isOpen = !!openSubmenus[menu.id];
                        const MenuIcon = getMenuIcon(menu);

                        if (!hasChildren) {
                            const isCurrent = menu.route_name && route().current(menu.route_name);
                            return (
                                <Link
                                    key={menu.id}
                                    href={menu.route_name ? route(menu.route_name) : "#"}
                                    title={isCollapsed ? menu.title : ""}
                                    className={`group flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                        isCurrent
                                            ? "bg-white/10 text-[#F3B817]"
                                            : "text-white/70 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <MenuIcon className={`h-5 w-5 shrink-0 ${isCurrent ? "text-[#F3B817]" : "text-white/50 group-hover:text-white"}`} />
                                    <span className={`whitespace-nowrap ${isCollapsed ? "hidden opacity-0 md:block" : "opacity-100"}`}>
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
                                    className={`group flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                        isOpen && !isCollapsed ? "bg-white/5 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <MenuIcon className={`h-5 w-5 shrink-0 ${isOpen && !isCollapsed ? "text-[#F3B817]" : "text-white/50 group-hover:text-white"}`} />
                                    <span className={`flex-1 truncate text-left ${isCollapsed ? "hidden opacity-0 md:block" : "opacity-100"}`}>
                                        {menu.title}
                                    </span>
                                    {!isCollapsed && (
                                        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                    )}
                                </button>

                                <div className={`grid transition-all duration-300 ${!isCollapsed && isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                    <div className="overflow-hidden">
                                        <div className="mt-1 ml-5 space-y-0.5 border-l border-white/10 py-1 pl-3">
                                            {menu.children.map((child) => {
                                                const isChildCurrent = child.route_name && route().current(child.route_name);
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={child.route_name ? route(child.route_name) : "#"}
                                                        className={`block truncate rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                                                            isChildCurrent
                                                                ? "text-[#F3B817] font-semibold"
                                                                : "text-white/60 hover:text-white"
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

                {/* FOOTER SIDEBAR (LOGOUT) */}
                <div className="shrink-0 border-t border-white/10 p-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Keluar / Logout"
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white ${
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
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsCollapsed(true)} />
            )}

            {/* ================= MAIN CONTENT ================= */}
            <div className="flex h-full min-w-0 flex-1 flex-col">
                
                {/* NAVBAR ATAS */}
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-[#2A164E]">
                            <Menu className="h-6 w-6" />
                        </button>
                        {/* Menampilkan judul dari prop header, jika tidak ada kosongkan saja */}
                        <div className="text-lg font-semibold text-[#2A164E]">
                            {header || ""} 
                        </div>
                    </div>

                    {/* Profil User di Navbar */}
                    <div className="flex items-center gap-4">
                        <Link 
                            href={route('profile.edit')} 
                            className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 py-1.5 pl-2 pr-4 transition hover:bg-gray-100"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A164E] text-sm font-bold text-white">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-semibold text-[#2A164E] leading-tight">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    {user?.role?.nama_role || "Karyawan"}
                                </p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* MAIN BODY - Diberi padding tipis agar tidak terlalu banyak gap */}
                <main className="custom-scrollbar flex-1 overflow-y-auto bg-[#F8F9FA]">
                    <div className="w-full h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}