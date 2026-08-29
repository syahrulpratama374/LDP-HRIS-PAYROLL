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
                            {/* Logo: Mengarahkan ke rute yang berbeda berdasarkan Role */}
                            <div className="shrink-0 flex items-center">
                                <Link
                                    href={
                                        user.role_id === 1
                                            ? route("dashboard")
                                            : route("absensi.create")
                                    }
                                >
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-indigo-600" />
                                </Link>
                            </div>

                            {/* Menu Navigasi Desktop */}
                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                {/* === MENU KHUSUS ADMIN === */}
                                {user.role_id === 1 && (
                                    <>
                                        <NavLink
                                            href={route("dashboard")}
                                            active={route().current(
                                                "dashboard",
                                            )}
                                        >
                                            Dashboard
                                        </NavLink>
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

                                {/* === MENU KHUSUS KARYAWAN === */}

                                {user.role_id == 2 && (
                                    <>
                                        <NavLink
                                            href={route("absensi.create")}
                                            active={route().current(
                                                "absensi.create",
                                            )}
                                        >
                                            Absensi Kehadiran
                                        </NavLink>
                                        <NavLink
                                            href={route("cuti.index")}
                                            active={route().current("cuti.*")}
                                        >
                                            Pengajuan Cuti & Izin
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

                {/* Menu Responsive (Mobile) */}
                <div
                    className={
                        (showingNavigationDropdown ? "block" : "hidden") +
                        " sm:hidden"
                    }
                >
                    <div className="pt-2 pb-3 space-y-1">
                        {/* === MENU KHUSUS ADMIN (MOBILE) === */}
                        {user.role_id === 1 && (
                            <>
                                <ResponsiveNavLink
                                    href={route("dashboard")}
                                    active={route().current("dashboard")}
                                >
                                    Dashboard
                                </ResponsiveNavLink>
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

                        {/* === MENU KHUSUS KARYAWAN (MOBILE) === */}
                        {user.role_id === 2 && (
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
                                    Pengajuan Cuti & Izin
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
