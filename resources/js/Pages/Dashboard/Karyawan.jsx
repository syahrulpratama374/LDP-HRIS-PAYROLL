import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Karyawan({
    auth,
    pengumuman,
    sisaCuti = 12,
    sisaKasbon = 5000000,
}) {
    // Fallback data pengumuman sementara (jika controller belum mengirimkan prop)
    const listPengumuman = pengumuman || [
        {
            id: 1,
            judul: "Pencairan SPJ & Kasbon Dipercepat",
            isi: "Menjelang libur panjang, cut-off pengajuan SPJ dan Kasbon dimajukan ke hari Kamis pukul 14:00 WIB.",
            tipe: "info",
        },
        {
            id: 2,
            judul: "Maintenance Server Internal",
            isi: "Aplikasi LDP HRIS mungkin mengalami gangguan sementara pada Sabtu tengah malam karena ada update sistem database.",
            tipe: "warning",
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard Karyawan
                </h2>
            }
        >
            <Head title="Dashboard Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* 1. IN-APP NOTIFICATION / BANNER PENGUMUMAN */}
                    {listPengumuman.length > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg shadow-sm">
                            <div className="flex items-center mb-3">
                                <span className="text-2xl mr-2">📢</span>
                                <h3 className="text-lg font-bold text-blue-900 tracking-wide uppercase">
                                    Papan Pengumuman Internal
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {listPengumuman.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 relative overflow-hidden"
                                    >
                                        <div
                                            className={`absolute top-0 left-0 w-1 h-full ${item.tipe === "warning" ? "bg-orange-500" : "bg-blue-500"}`}
                                        ></div>
                                        <h4 className="font-bold text-gray-800 mb-1">
                                            {item.judul}
                                        </h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {item.isi}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. WELCOME & QUICK ACTION (CLOCK-IN) */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8 flex flex-col md:flex-row justify-between items-center border-t-4 border-indigo-500">
                        <div className="text-center md:text-left mb-6 md:mb-0">
                            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                Halo, {auth.user.name}!
                            </h3>
                            <p className="text-gray-500 mt-2 text-lg">
                                Selamat bekerja. Jangan lupa untuk melakukan
                                presensi hari ini.
                            </p>
                        </div>
                        <div>
                            <Link
                                href={route("absensi.create")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block text-center text-lg"
                            >
                                ⏱️ Terminal Clock-In / Out
                            </Link>
                        </div>
                    </div>

                    {/* 3. SUMMARY WIDGETS (SISA CUTI & KASBON) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Widget Cuti */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center border-l-4 border-green-500 hover:shadow-md transition">
                            <div className="p-4 rounded-full bg-green-100 text-green-600 mr-5 text-3xl">
                                🌴
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    Sisa Saldo Cuti Tahunan
                                </p>
                                <p className="text-3xl font-extrabold text-gray-800 my-1">
                                    {sisaCuti}{" "}
                                    <span className="text-lg font-medium text-gray-500">
                                        Hari
                                    </span>
                                </p>
                                <Link
                                    href={route("cuti.index")}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                                >
                                    Ajukan Cuti &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Widget Kasbon */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center border-l-4 border-orange-500 hover:shadow-md transition">
                            <div className="p-4 rounded-full bg-orange-100 text-orange-600 mr-5 text-3xl">
                                💰
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    Sisa Limit Kasbon
                                </p>
                                <p className="text-3xl font-extrabold text-gray-800 my-1">
                                    Rp {sisaKasbon.toLocaleString("id-ID")}
                                </p>
                                <Link
                                    href={route("pinjaman.index")}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                                >
                                    Ajukan Kasbon &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
