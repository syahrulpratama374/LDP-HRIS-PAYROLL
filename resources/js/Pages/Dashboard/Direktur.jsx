import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Direktur({
    auth,
    statistik,
    pendingSpj,
    pendingKasbon,
}) {
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    const currentMonth = new Date().toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
    });

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dasbor Eksekutif
                </h2>
            }
        >
            <Head title="Dashboard Direktur" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* BANNER SELAMAT DATANG */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-lg p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold">
                                Selamat Datang, {auth.user.name}
                            </h3>
                            <p className="text-gray-300 mt-1">
                                Ringkasan operasional dan finansial PT LDP
                                periode {currentMonth}.
                            </p>
                        </div>
                        <div className="text-5xl opacity-20">📈</div>
                    </div>

                    {/* EXECUTIVE METRICS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Total Karyawan Aktif
                            </p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">
                                {statistik.totalKaryawan}{" "}
                                <span className="text-sm font-medium text-gray-500">
                                    Orang
                                </span>
                            </h4>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Beban Payroll Berjalan
                            </p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">
                                {formatRupiah(statistik.bebanGaji)}
                            </h4>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Realisasi SPJ Berjalan
                            </p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">
                                {formatRupiah(statistik.realisasiSpj)}
                            </h4>
                        </div>
                    </div>

                    {/* DOKUMEN MENUNGGU FINAL APPROVAL */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                ⚠ Menunggu Persetujuan Direktur (Final Approval)
                            </h3>
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                                {pendingSpj.length + pendingKasbon.length}{" "}
                                Dokumen Tertunda
                            </span>
                        </div>

                        <div className="p-0">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Jenis Pengajuan
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Pemohon
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Nominal
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingSpj.length === 0 &&
                                    pendingKasbon.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Tidak ada dokumen pengajuan yang
                                                membutuhkan persetujuan Direktur
                                                saat ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {/* List Kasbon Tertunda */}
                                            {pendingKasbon.map((kasbon) => (
                                                <tr
                                                    key={`kasbon-${kasbon.id}`}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                                                            KASBON / PINJAMAN
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                        {
                                                            kasbon.karyawan
                                                                ?.nama_lengkap
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">
                                                        {formatRupiah(
                                                            kasbon.total_pinjaman,
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={route(
                                                                "admin.pinjaman.index",
                                                            )}
                                                            className="text-indigo-600 hover:text-indigo-900 font-bold hover:underline"
                                                        >
                                                            Review Dokumen ➔
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* List SPJ Tertunda */}
                                            {pendingSpj.map((spj) => (
                                                <tr
                                                    key={`spj-${spj.id}`}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                                            SPJ (Dinas Luar)
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                                            {spj.tujuan}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                        {
                                                            spj.karyawan
                                                                ?.nama_lengkap
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">
                                                        {formatRupiah(
                                                            spj.total_biaya,
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={route(
                                                                "admin.spj.index",
                                                            )}
                                                            className="text-indigo-600 hover:text-indigo-900 font-bold hover:underline"
                                                        >
                                                            Review Dokumen ➔
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
