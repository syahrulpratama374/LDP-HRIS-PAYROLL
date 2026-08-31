import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Dashboard({ auth, stats }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard Overview
                </h2>
            }
        >
            <Head title="Dashboard Admin" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Panel Selamat Datang */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-lg shadow-lg p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">
                                Selamat datang kembali, {auth.user.name}!
                            </h3>
                            <p className="text-indigo-100 text-sm">
                                Ini adalah ringkasan sistem LDP HRIS & Payroll
                                Anda hari ini.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <svg
                                className="w-16 h-16 text-white opacity-20"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                            </svg>
                        </div>
                    </div>

                    {/* Grid Widget Statistik */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Widget 1: Karyawan Aktif */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-5 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                        Total Karyawan
                                    </p>
                                    <h3 className="text-3xl font-black text-gray-800 mt-1">
                                        {stats?.total_karyawan || 0}
                                    </h3>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route("karyawan.index")}
                                    className="text-sm text-blue-600 font-semibold hover:underline"
                                >
                                    Kelola Data →
                                </Link>
                            </div>
                        </div>

                        {/* Widget 2: Cuti Pending */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500 p-5 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                        Cuti Menunggu
                                    </p>
                                    <h3 className="text-3xl font-black text-gray-800 mt-1">
                                        {stats?.cuti_pending || 0}
                                    </h3>
                                </div>
                                <div className="p-2 bg-yellow-50 rounded-lg">
                                    <svg
                                        className="w-6 h-6 text-yellow-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route("admin.cuti.index")}
                                    className="text-sm text-yellow-600 font-semibold hover:underline"
                                >
                                    Tinjau Pengajuan →
                                </Link>
                            </div>
                        </div>

                        {/* Widget 3: SPJ Pending */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-5 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                        Approval SPJ
                                    </p>
                                    <h3 className="text-3xl font-black text-gray-800 mt-1">
                                        {stats?.spj_pending || 0}
                                    </h3>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <svg
                                        className="w-6 h-6 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route("admin.spj.index")}
                                    className="text-sm text-green-600 font-semibold hover:underline"
                                >
                                    Proses Pencairan →
                                </Link>
                            </div>
                        </div>

                        {/* Widget 4: IT Ticket Terbuka */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-5 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                        Tiket IT (Open)
                                    </p>
                                    <h3 className="text-3xl font-black text-gray-800 mt-1">
                                        {stats?.tiket_open || 0}
                                    </h3>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <svg
                                        className="w-6 h-6 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        ></path>
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route("admin.ticket.index")}
                                    className="text-sm text-red-600 font-semibold hover:underline"
                                >
                                    Tindak Lanjuti →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
