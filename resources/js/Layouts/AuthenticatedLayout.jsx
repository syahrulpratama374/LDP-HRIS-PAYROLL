import { useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";

export default function AuthenticatedLayout({ header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    // MENGAMBIL DATA USER SECARA GLOBAL DARI INERTIA
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            {/* Logo Perusahaan */}
                            <div className="shrink-0 flex items-center">
                                <Link href={route("dashboard")}>
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-indigo-600" />
                                </Link>
                            </div>

                            {/* ============================================================== */}
                            {/* MENU NAVIGASI DESKTOP (TERSTRUKTUR & RAPI)                    */}
                            {/* ============================================================== */}
                            <div className="hidden space-x-4 sm:-my-px sm:ms-8 sm:flex sm:items-center">
                                {/* 1. DASHBOARD UTAMA */}
                                <NavLink
                                    href={route("dashboard")}
                                    active={route().current("dashboard")}
                                >
                                    Dashboard
                                </NavLink>

                                {/* 2. MENU SELF-SERVICE KARYAWAN (Role 1 s/d 6) */}
                                <NavLink
                                    href={route("absensi.create")}
                                    active={route().current("absensi.create")}
                                >
                                    Absensi
                                </NavLink>

                                {/* Dropdown Pengajuan Karyawan */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150 ${
                                                route().current("cuti.*") ||
                                                route().current("lembur.*") ||
                                                route().current("spj.*") ||
                                                route().current("pinjaman.*") ||
                                                route().current("logbook.*")
                                                    ? "text-indigo-600 font-bold border-b-2 border-indigo-500"
                                                    : ""
                                            }`}
                                        >
                                            Pengajuan Saya
                                            <svg
                                                className="ms-2 -me-0.5 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content width="48">
                                        <Dropdown.Link
                                            href={route("cuti.index")}
                                        >
                                            Pengajuan Cuti
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("lembur.index")}
                                        >
                                            Pengajuan Lembur
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("spj.index")}
                                        >
                                            Perjalanan Dinas (SPJ)
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("pinjaman.index")}
                                        >
                                            Kasbon & Pinjaman
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("logbook.index")}
                                        >
                                            Logbook Shift NOC
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>

                                {/* 3. DROPDOWN MODUL E-PERSURATAN */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150 ${
                                                route().current("keluar.*") ||
                                                route().current("template.*") ||
                                                route().current("layout.*")
                                                    ? "text-indigo-600 font-bold border-b-2 border-indigo-500"
                                                    : ""
                                            }`}
                                        >
                                            e-Persuratan
                                            <svg
                                                className="ms-2 -me-0.5 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content width="56">
                                        <Dropdown.Link
                                            href={route("keluar.index")}
                                        >
                                            Surat Keluar
                                        </Dropdown.Link>

                                        {/* Khusus Admin & HC (Role 1 & 3) */}
                                        {[1, 3].includes(user.role_id) && (
                                            <>
                                                <div className="border-t border-gray-100 my-1" />
                                                <div className="block px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                    Pengaturan Persuratan
                                                </div>
                                                <Dropdown.Link
                                                    href={route(
                                                        "template.index",
                                                    )}
                                                >
                                                    Master Template & Rute TTD
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route("layout.index")}
                                                >
                                                    Layout Kop & Aset Visual
                                                </Dropdown.Link>
                                            </>
                                        )}
                                    </Dropdown.Content>
                                </Dropdown>

                                {/* 4. DROPDOWN APPROVAL CENTER (Role 1 s/d 5) */}
                                {[1, 2, 3, 4, 5].includes(user.role_id) && (
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150 ${
                                                    route().current(
                                                        "admin.cuti.*",
                                                    ) ||
                                                    route().current(
                                                        "admin.lembur.*",
                                                    ) ||
                                                    route().current(
                                                        "admin.spj.*",
                                                    ) ||
                                                    route().current(
                                                        "admin.delegasi.*",
                                                    ) ||
                                                    route().current(
                                                        "admin.kinerja.*",
                                                    )
                                                        ? "text-indigo-600 font-bold border-b-2 border-indigo-500"
                                                        : ""
                                                }`}
                                            >
                                                Approval Center
                                                <svg
                                                    className="ms-2 -me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content width="48">
                                            <Dropdown.Link
                                                href={route("admin.cuti.index")}
                                            >
                                                Approval Cuti
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.lembur.index",
                                                )}
                                            >
                                                Approval Lembur
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route("admin.spj.index")}
                                            >
                                                Approval SPJ
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.delegasi.index",
                                                )}
                                            >
                                                Delegasi Wewenang (Plt)
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.kinerja.index",
                                                )}
                                            >
                                                Penilaian KPI Kinerja
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                )}

                                {/* 5. DROPDOWN KEPEGAWAIAN & MASTER DATA (Role 1 & 3) */}
                                {[1, 3].includes(user.role_id) && (
                                    <>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                                >
                                                    Kepegawaian
                                                    <svg
                                                        className="ms-2 -me-0.5 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content width="48">
                                                <Dropdown.Link
                                                    href={route(
                                                        "karyawan.index",
                                                    )}
                                                >
                                                    Data Karyawan
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route(
                                                        "absensi.index",
                                                    )}
                                                >
                                                    Monitor Absensi
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route(
                                                        "pengumuman.index",
                                                    )}
                                                >
                                                    Broadcast Internal
                                                </Dropdown.Link>
                                            </Dropdown.Content>
                                        </Dropdown>

                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                                >
                                                    Master Data
                                                    <svg
                                                        className="ms-2 -me-0.5 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content width="48">
                                                <Dropdown.Link
                                                    href={route(
                                                        "departemen.index",
                                                    )}
                                                >
                                                    Departemen
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route(
                                                        "jabatan.index",
                                                    )}
                                                >
                                                    Jabatan
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route(
                                                        "golongan.index",
                                                    )}
                                                >
                                                    Golongan
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route("shift.index")}
                                                >
                                                    Jam Shift
                                                </Dropdown.Link>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </>
                                )}

                                {/* 6. DROPDOWN FINANCE & PAYROLL (Role 1 & 4) */}
                                {[1, 4].includes(user.role_id) && (
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                            >
                                                Finance & Payroll
                                                <svg
                                                    className="ms-2 -me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content width="48">
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.pinjaman.index",
                                                )}
                                            >
                                                Approval Kasbon
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.payroll.index",
                                                )}
                                            >
                                                Kalkulator Payroll
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.komponen.index",
                                                )}
                                            >
                                                Master Komponen Gaji
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                )}

                                {/* 7. DROPDOWN SISTEM & GA (Khusus Super Admin Role 1) */}
                                {[1].includes(user.role_id) && (
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                            >
                                                Sistem & Aset
                                                <svg
                                                    className="ms-2 -me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content width="48">
                                            <Dropdown.Link
                                                href={route("admin.aset.index")}
                                            >
                                                Aset & QR Code
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route(
                                                    "admin.audit.index",
                                                )}
                                            >
                                                Audit Trail (Log Forensik)
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                )}
                            </div>
                        </div>

                        {/* DROPDOWN PROFIL AKUN (KANAN) */}
                        <div className="hidden sm:flex sm:items-center sm:ms-6">
                            <div className="ms-3 relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                            >
                                                {user.name}
                                                <svg
                                                    className="ms-2 -me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route("slip.index")}
                                        >
                                            Slip Gaji Saya
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("ticket.index")}
                                        >
                                            IT Helpdesk Ticket
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("profile.edit")}
                                        >
                                            Pengaturan Profil
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* HAMBURGER MENU (MOBILE TOGGLE) */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* MENU RESPONSIVE (TAMPILAN MOBILE)                              */}
                {/* ============================================================== */}
                <div
                    className={
                        (showingNavigationDropdown ? "block" : "hidden") +
                        " sm:hidden"
                    }
                >
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink
                            href={route("dashboard")}
                            active={route().current("dashboard")}
                        >
                            Dashboard
                        </ResponsiveNavLink>

                        {/* SELF-SERVICE MOBILE */}
                        <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                            Pengajuan & Persuratan
                        </div>
                        <ResponsiveNavLink
                            href={route("absensi.create")}
                            active={route().current("absensi.create")}
                        >
                            Absensi Kehadiran
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("cuti.index")}
                            active={route().current("cuti.*")}
                        >
                            Pengajuan Cuti
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("lembur.index")}
                            active={route().current("lembur.*")}
                        >
                            Pengajuan Lembur
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("spj.index")}
                            active={route().current("spj.*")}
                        >
                            Perjalanan Dinas (SPJ)
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("pinjaman.index")}
                            active={route().current("pinjaman.*")}
                        >
                            Kasbon & Pinjaman
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("logbook.index")}
                            active={route().current("logbook.*")}
                        >
                            Logbook Shift NOC
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("keluar.index")}
                            active={route().current("keluar.*")}
                        >
                            Surat Keluar
                        </ResponsiveNavLink>

                        {/* APPROVAL MOBILE */}
                        {[1, 2, 3, 4, 5].includes(user.role_id) && (
                            <>
                                <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Approval Center
                                </div>
                                <ResponsiveNavLink
                                    href={route("admin.cuti.index")}
                                    active={route().current("admin.cuti.*")}
                                >
                                    Approval Cuti
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("admin.lembur.index")}
                                    active={route().current("admin.lembur.*")}
                                >
                                    Approval Lembur
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("admin.spj.index")}
                                    active={route().current("admin.spj.*")}
                                >
                                    Approval SPJ
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("admin.delegasi.index")}
                                    active={route().current("admin.delegasi.*")}
                                >
                                    Delegasi Wewenang (Plt)
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("admin.kinerja.index")}
                                    active={route().current("admin.kinerja.*")}
                                >
                                    Penilaian KPI
                                </ResponsiveNavLink>
                            </>
                        )}

                        {/* PENGATURAN PERSURATAN HC/ADMIN MOBILE */}
                        {[1, 3].includes(user.role_id) && (
                            <>
                                <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Pengaturan Persuratan
                                </div>
                                <ResponsiveNavLink
                                    href={route("template.index")}
                                    active={route().current("template.*")}
                                >
                                    Master Template & Rute
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("layout.index")}
                                    active={route().current("layout.*")}
                                >
                                    Layout Kop & Aset Visual
                                </ResponsiveNavLink>
                            </>
                        )}
                    </div>

                    {/* FOOTER USER MOBILE */}
                    <div className="pt-4 pb-1 border-t border-gray-200">
                        <div className="px-4">
                            <div className="font-medium text-base text-gray-800">
                                {user.name}
                            </div>
                            <div className="font-medium text-sm text-gray-500">
                                {user.email}
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route("slip.index")}>
                                Slip Gaji Saya
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route("ticket.index")}>
                                IT Helpdesk
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route("profile.edit")}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route("logout")}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HEADER HALAMAN */}
            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* KONTEN UTAMA */}
            <main>{children}</main>
        </div>
    );
}
