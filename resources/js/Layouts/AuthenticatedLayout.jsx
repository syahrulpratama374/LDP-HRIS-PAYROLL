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
                            {/* Logo */}
                            <div className="shrink-0 flex items-center">
                                <Link href={route("dashboard")}>
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-indigo-600" />
                                </Link>
                            </div>

                            {/* ============================================== */}
                            {/* MENU NAVIGASI DESKTOP                          */}
                            {/* ============================================== */}
                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                {/* 1. MENU UMUM (Semua Role) */}
                                <NavLink
                                    href={route("dashboard")}
                                    active={route().current("dashboard")}
                                >
                                    Dashboard
                                </NavLink>

                                {/* 2. MENU SELF-SERVICE (Role 2 s/d 6) */}
                                {[2, 3, 4, 5, 6].includes(user.role_id) && (
                                    <>
                                        <NavLink
                                            href={route("absensi.create")}
                                            active={route().current(
                                                "absensi.create",
                                            )}
                                        >
                                            Absensi
                                        </NavLink>
                                        <NavLink
                                            href={route("cuti.index")}
                                            active={route().current("cuti.*")}
                                        >
                                            Pengajuan Cuti
                                        </NavLink>
                                        <NavLink
                                            href={route("lembur.index")}
                                            active={route().current("lembur.*")}
                                        >
                                            Lembur
                                        </NavLink>
                                        <NavLink
                                            href={route("spj.index")}
                                            active={route().current("spj.*")}
                                        >
                                            SPJ
                                        </NavLink>
                                        <NavLink
                                            href={route("pinjaman.index")}
                                            active={route().current(
                                                "pinjaman.*",
                                            )}
                                        >
                                            Kasbon
                                        </NavLink>
                                    </>
                                )}

                                {/* 3. MENU MANAJERIAL / APPROVER (Role 1 s/d 5) */}
                                {[1, 2, 3, 4, 5].includes(user.role_id) && (
                                    <>
                                        <NavLink
                                            href={route("admin.cuti.index")}
                                            active={route().current(
                                                "admin.cuti.*",
                                            )}
                                        >
                                            Apprv Cuti
                                        </NavLink>
                                        <NavLink
                                            href={route("admin.lembur.index")}
                                            active={route().current(
                                                "admin.lembur.*",
                                            )}
                                        >
                                            Apprv Lembur
                                        </NavLink>
                                        <NavLink
                                            href={route("admin.spj.index")}
                                            active={route().current(
                                                "admin.spj.*",
                                            )}
                                        >
                                            Apprv SPJ
                                        </NavLink>
                                        <NavLink
                                            href={route("admin.delegasi.index")}
                                            active={route().current(
                                                "admin.delegasi.*",
                                            )}
                                        >
                                            Delegasi (Plt)
                                        </NavLink>
                                        <NavLink
                                            href={route("admin.kinerja.index")}
                                            active={route().current(
                                                "admin.kinerja.*",
                                            )}
                                        >
                                            KPI Kinerja
                                        </NavLink>
                                    </>
                                )}

                                {/* 4. MENU HC & ADMIN (Role 1 & 3) */}
                                {[1, 3].includes(user.role_id) && (
                                    <>
                                        <NavLink
                                            href={route("karyawan.index")}
                                            active={route().current(
                                                "karyawan.*",
                                            )}
                                        >
                                            Data Karyawan
                                        </NavLink>
                                        <NavLink
                                            href={route("absensi.index")}
                                            active={route().current(
                                                "absensi.index",
                                            )}
                                        >
                                            Monitor Absensi
                                        </NavLink>
                                        <NavLink
                                            href={route("keluar.index")}
                                            active={route().current("keluar.*")}
                                        >
                                            Persuratan
                                        </NavLink>

                                        {/* Dropdown Master Data */}
                                        <div className="hidden sm:flex sm:items-center">
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <span className="inline-flex rounded-md mt-1">
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
                                                    </span>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content>
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
                                                </Dropdown.Content>
                                            </Dropdown>
                                        </div>
                                    </>
                                )}

                                {/* 5. MENU FINANCE & ADMIN (Role 1 & 4) */}
                                {[1, 4].includes(user.role_id) && (
                                    <>
                                        <NavLink
                                            href={route("admin.pinjaman.index")}
                                            active={route().current(
                                                "admin.pinjaman.*",
                                            )}
                                        >
                                            Apprv Kasbon
                                        </NavLink>
                                        <NavLink
                                            href={route("admin.payroll.index")}
                                            active={route().current(
                                                "admin.payroll.*",
                                            )}
                                        >
                                            Payroll
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:ms-6">
                            {/* Dropdown Profil Akun */}
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
                                            IT Helpdesk
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("profile.edit")}
                                        >
                                            Profile
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

                        {/* Hamburger Menu (Tampilan Mobile) */}
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

                {/* ============================================== */}
                {/* MENU RESPONSIVE (MOBILE)                       */}
                {/* ============================================== */}
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
                        {[2, 3, 4, 5, 6].includes(user.role_id) && (
                            <>
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
                                    Perjalanan Dinas
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("pinjaman.index")}
                                    active={route().current("pinjaman.*")}
                                >
                                    Kasbon & Pinjaman
                                </ResponsiveNavLink>
                            </>
                        )}

                        {/* APPROVAL MOBILE */}
                        {[1, 2, 3, 4, 5].includes(user.role_id) && (
                            <>
                                <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Approve & Manajerial
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

                        {/* HC & ADMIN MOBILE */}
                        {[1, 3].includes(user.role_id) && (
                            <>
                                <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    HC & Admin
                                </div>
                                <ResponsiveNavLink
                                    href={route("karyawan.index")}
                                    active={route().current("karyawan.*")}
                                >
                                    Data Karyawan
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("absensi.index")}
                                    active={route().current("absensi.index")}
                                >
                                    Monitor Absensi
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("keluar.index")}
                                    active={route().current("keluar.*")}
                                >
                                    Persuratan HC
                                </ResponsiveNavLink>

                                <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Master Data
                                </div>
                                <ResponsiveNavLink
                                    href={route("departemen.index")}
                                    active={route().current("departemen.index")}
                                >
                                    Departemen
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("jabatan.index")}
                                    active={route().current("jabatan.index")}
                                >
                                    Jabatan
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("golongan.index")}
                                    active={route().current("golongan.index")}
                                >
                                    Golongan
                                </ResponsiveNavLink>
                            </>
                        )}

                        {/* FINANCE MOBILE */}
                        {[1, 4].includes(user.role_id) && (
                            <>
                                <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Finance & Payroll
                                </div>
                                <ResponsiveNavLink
                                    href={route("admin.pinjaman.index")}
                                    active={route().current("admin.pinjaman.*")}
                                >
                                    Approval Kasbon
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route("admin.payroll.index")}
                                    active={route().current("admin.payroll.*")}
                                >
                                    Kalkulator Payroll
                                </ResponsiveNavLink>
                            </>
                        )}
                    </div>

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

            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
