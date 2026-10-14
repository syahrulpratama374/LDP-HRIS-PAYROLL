import { useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Users,
    Clock,
    CheckSquare,
    FileClock,
    BadgeDollarSign,
    ShieldAlert,
    QrCode,
    BookOpen,
    Megaphone,
    Database,
    Building,
    Briefcase,
    Award,
    Calendar,
    Wallet,
    Calculator,
    FileText,
    LifeBuoy,
    UserCircle,
    LogOut,
    ChevronRight,
} from "lucide-react";

const SidebarItem = ({ href, active, icon: Icon, label }) => (
    <Link
        href={href}
        className={`group relative flex items-center justify-center h-11 w-11 rounded-xl mb-2 transition-all duration-200 ${
            active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {/* Tooltip pas kursor diarahkan */}
        <span className="absolute left-16 bg-gray-900 text-gray-100 text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-800 transition-opacity duration-200">
            {label}
        </span>
    </Link>
);

export default function AdminLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* ================= SIDEBAR KIRI (ADMIN STYLE) ================= */}
            <aside className="hidden sm:flex flex-col w-20 bg-[#111322] border-r border-gray-800 fixed h-full z-40 py-4 items-center justify-between">
                {/* Bagian Atas: Logo */}
                <div className="flex flex-col items-center w-full">
                    <div className="mb-6 mt-1">
                        <Link href={route("dashboard")}>
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
                                <ApplicationLogo className="block h-6 w-auto text-white fill-current" />
                            </div>
                        </Link>
                    </div>

                    <div className="w-8 border-b border-gray-800 mb-4"></div>

                    {/* Daftar Menu Sidebar (Berdasarkan Role Anda) */}
                    <div className="flex-1 w-full flex flex-col items-center overflow-y-auto no-scrollbar space-y-1 pb-6 max-h-[calc(100vh-180px)]">
                        {/* 1. Menu Umum / Dashboard */}
                        <SidebarItem
                            href={route("dashboard")}
                            active={route().current("dashboard")}
                            icon={LayoutDashboard}
                            label="Dashboard"
                        />

                        {/* 2. Menu Khusus Role 1 (Super Admin / IT) */}
                        {[1].includes(user.role_id) && (
                            <>
                                <SidebarItem
                                    href={route("admin.audit.index")}
                                    active={route().current("admin.audit.*")}
                                    icon={ShieldAlert}
                                    label="Audit Trail"
                                />
                                <SidebarItem
                                    href={route("admin.aset.index")}
                                    active={route().current("admin.aset.*")}
                                    icon={QrCode}
                                    label="Aset & QR Code"
                                />
                            </>
                        )}

                        {/* 3. Menu Self-Service (Role 2 s/d 6) */}
                        {[2, 3, 4, 5, 6].includes(user.role_id) && (
                            <>
                                <SidebarItem
                                    href={route("absensi.create")}
                                    active={route().current("absensi.create")}
                                    icon={Clock}
                                    label="Absensi Kehadiran"
                                />
                                <SidebarItem
                                    href={route("cuti.index")}
                                    active={route().current("cuti.*")}
                                    icon={Calendar}
                                    label="Pengajuan Cuti"
                                />
                                <SidebarItem
                                    href={route("lembur.index")}
                                    active={route().current("lembur.*")}
                                    icon={FileClock}
                                    label="Pengajuan Lembur"
                                />
                                <SidebarItem
                                    href={route("spj.index")}
                                    active={route().current("spj.*")}
                                    icon={FileText}
                                    label="Perjalanan Dinas (SPJ)"
                                />
                                <SidebarItem
                                    href={route("pinjaman.index")}
                                    active={route().current("pinjaman.*")}
                                    icon={Wallet}
                                    label="Kasbon & Pinjaman"
                                />
                                <SidebarItem
                                    href={route("logbook.index")}
                                    active={route().current("logbook.*")}
                                    icon={BookOpen}
                                    label="Logbook Shift"
                                />
                            </>
                        )}

                        {/* 4. Broadcast (Role 1, 2, 3) */}
                        {[1, 2, 3].includes(user.role_id) && (
                            <SidebarItem
                                href={route("pengumuman.index")}
                                active={route().current("pengumuman.*")}
                                icon={Megaphone}
                                label="Broadcast"
                            />
                        )}

                        {/* 5. Menu Manajerial / Approver (Role 1 s/d 5) */}
                        {[1, 2, 3, 4, 5].includes(user.role_id) && (
                            <>
                                <div className="w-8 border-b border-gray-800 my-2"></div>
                                <SidebarItem
                                    href={route("admin.cuti.index")}
                                    active={route().current("admin.cuti.*")}
                                    icon={CheckSquare}
                                    label="Apprv Cuti"
                                />
                                <SidebarItem
                                    href={route("admin.lembur.index")}
                                    active={route().current("admin.lembur.*")}
                                    icon={FileClock}
                                    label="Apprv Lembur"
                                />
                                <SidebarItem
                                    href={route("admin.spj.index")}
                                    active={route().current("admin.spj.*")}
                                    icon={BadgeDollarSign}
                                    label="Apprv SPJ"
                                />
                                <SidebarItem
                                    href={route("admin.delegasi.index")}
                                    active={route().current("admin.delegasi.*")}
                                    icon={Users}
                                    label="Delegasi (Plt)"
                                />
                                <SidebarItem
                                    href={route("admin.kinerja.index")}
                                    active={route().current("admin.kinerja.*")}
                                    icon={Award}
                                    label="KPI Kinerja"
                                />
                            </>
                        )}

                        {/* 6. Menu HC & Admin (Role 1 & 3) + Master Data */}
                        {[1, 3].includes(user.role_id) && (
                            <>
                                <div className="w-8 border-b border-gray-800 my-2"></div>
                                <SidebarItem
                                    href={route("karyawan.index")}
                                    active={route().current("karyawan.*")}
                                    icon={Users}
                                    label="Data Karyawan"
                                />
                                <SidebarItem
                                    href={route("absensi.index")}
                                    active={route().current("absensi.index")}
                                    icon={Clock}
                                    label="Monitor Absensi"
                                />
                                <SidebarItem
                                    href={route("keluar.index")}
                                    active={route().current("keluar.*")}
                                    icon={FileText}
                                    label="Persuratan"
                                />

                                {/* Master Data */}
                                <SidebarItem
                                    href={route("departemen.index")}
                                    active={
                                        route().current("departemen.*") ||
                                        route().current("jabatan.*") ||
                                        route().current("golongan.*") ||
                                        route().current("shift.*")
                                    }
                                    icon={Database}
                                    label="Master Data (Dept/Jabatan/Shift)"
                                />
                            </>
                        )}

                        {/* 7. Menu Finance & Admin (Role 1 & 4) */}
                        {[1, 4].includes(user.role_id) && (
                            <>
                                <div className="w-8 border-b border-gray-800 my-2"></div>
                                <SidebarItem
                                    href={route("admin.pinjaman.index")}
                                    active={route().current("admin.pinjaman.*")}
                                    icon={Wallet}
                                    label="Apprv Kasbon"
                                />
                                <SidebarItem
                                    href={route("admin.payroll.index")}
                                    active={route().current("admin.payroll.*")}
                                    icon={Calculator}
                                    label="Payroll"
                                />
                                <SidebarItem
                                    href={route("admin.komponen.index")}
                                    active={route().current("admin.komponen.*")}
                                    icon={BadgeDollarSign}
                                    label="Master Komponen Gaji"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Bagian Bawah: Profil & Logout Dropdown */}
                <div className="w-full flex justify-center pb-2">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="h-11 w-11 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border border-gray-700">
                                <UserCircle size={22} />
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content
                            align="left"
                            contentClasses="py-1 bg-white ml-14 mb-2 shadow-2xl border border-gray-100 rounded-lg w-48"
                        >
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-800 truncate">
                                    {user.name}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {user.email}
                                </p>
                            </div>
                            <Dropdown.Link href={route("slip.index")}>
                                Slip Gaji Saya
                            </Dropdown.Link>
                            <Dropdown.Link href={route("ticket.index")}>
                                IT Helpdesk
                            </Dropdown.Link>
                            <Dropdown.Link href={route("profile.edit")}>
                                Profile
                            </Dropdown.Link>
                            <Dropdown.Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="text-red-600"
                            >
                                Log Out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </aside>

            {/* ================= AREA UTAMA (KONTEN + TOP BAR SEDERHANA) ================= */}
            <div className="flex-1 sm:ml-20 flex flex-col min-h-screen">
                {/* Header Judul Halaman */}
                {header && (
                    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
                        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                            <div>{header}</div>
                            <div className="text-xs text-gray-500 font-medium hidden md:block">
                                Portal Admin — PT Lintas Data Prima
                            </div>
                        </div>
                    </header>
                )}

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
