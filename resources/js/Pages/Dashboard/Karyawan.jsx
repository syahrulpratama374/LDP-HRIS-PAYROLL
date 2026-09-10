import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Karyawan({ auth, sisaCuti, sisaKasbon, pengumuman }) {
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Beranda Karyawan
                </h2>
            }
        >
            <Head title="Dasbor Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* WELCOME SECTION */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex justify-between items-center border-l-4 border-indigo-500">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                Halo, {auth.user.name}! 👋
                            </h3>
                            <p className="text-gray-500 mt-1">
                                Selamat datang di portal HRIS & Self-Service PT
                                LDP.
                            </p>
                        </div>
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold text-gray-600">
                                Tanggal Hari Ini
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                                {new Date().toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>

                    {/* PAPAN PENGUMUMAN (BROADCAST BANNER) */}
                    {pengumuman && pengumuman.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                📢 Informasi Terbaru
                            </h4>
                            {pengumuman.map((p) => (
                                <div
                                    key={p.id}
                                    className={`p-4 rounded-lg shadow-sm border-l-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between
                                    ${
                                        p.tipe_banner === "Info"
                                            ? "bg-blue-50 border-blue-500"
                                            : p.tipe_banner === "Peringatan"
                                              ? "bg-orange-50 border-orange-500"
                                              : "bg-green-50 border-green-500"
                                    }`}
                                >
                                    <div>
                                        <h4
                                            className={`text-lg font-bold 
                                            ${
                                                p.tipe_banner === "Info"
                                                    ? "text-blue-800"
                                                    : p.tipe_banner ===
                                                        "Peringatan"
                                                      ? "text-orange-800"
                                                      : "text-green-800"
                                            }`}
                                        >
                                            {p.judul}
                                        </h4>
                                        <p className="text-gray-700 mt-1 text-sm">
                                            {p.konten}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                                        Dari: {p.pembuat?.name || "Manajemen"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* QUICK ACTION & TERMINAL ABSENSI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-lg shadow-lg p-8 text-white flex flex-col justify-center items-center text-center">
                            <h3 className="text-2xl font-bold mb-2">
                                Terminal Kehadiran
                            </h3>
                            <p className="text-indigo-200 mb-6 text-sm">
                                Pastikan Anda berada di area kantor untuk
                                melakukan absen masuk dan pulang.
                            </p>
                            <Link
                                href={route("absensi.create")}
                                className="bg-white text-indigo-900 font-bold py-3 px-8 rounded-full shadow hover:bg-gray-100 transition transform hover:scale-105"
                            >
                                📍 CLOCK IN / OUT SEKARANG
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* CARD SISA CUTI */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div>
                                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
                                        Sisa Cuti Tahunan
                                    </div>
                                    <div className="text-3xl font-black text-gray-800">
                                        {sisaCuti}{" "}
                                        <span className="text-lg text-gray-500 font-medium">
                                            Hari
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href={route("cuti.create")}
                                    className="text-indigo-600 text-sm font-bold hover:underline mt-4"
                                >
                                    Ajukan Cuti ➔
                                </Link>
                            </div>

                            {/* CARD SISA LIMIT KASBON */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div>
                                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
                                        Sisa Limit Kasbon
                                    </div>
                                    <div className="text-2xl font-black text-green-600">
                                        {formatRupiah(sisaKasbon)}
                                    </div>
                                </div>
                                <Link
                                    href={route("pinjaman.create")}
                                    className="text-green-600 text-sm font-bold hover:underline mt-4"
                                >
                                    Ajukan Pinjaman ➔
                                </Link>
                            </div>

                            {/* CARD SLIP GAJI */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-2 flex justify-between items-center hover:bg-gray-50 transition">
                                <div>
                                    <div className="text-gray-800 font-bold">
                                        Slip Gaji & Pendapatan
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Unduh slip gaji bulanan Anda
                                    </div>
                                </div>
                                <Link
                                    href={route("slip.index")}
                                    className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-black transition"
                                >
                                    Lihat Slip
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
