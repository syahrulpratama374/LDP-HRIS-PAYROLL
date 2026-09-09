import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Supervisor({
    auth,
    pendingCuti,
    pendingLembur,
    pendingSpj,
    sisaCuti,
    sisaKasbon,
}) {
    const totalPending =
        pendingCuti.length + pendingLembur.length + pendingSpj.length;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard Supervisor / Manager
                </h2>
            }
        >
            <Head title="Dashboard Supervisor" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* --- KOMPONEN MANAJERIAL: TIER-1 APPROVAL --- */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-t-4 border-red-500">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Menunggu Persetujuan Anda (Tier-1)
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Validasi pengajuan dari tim di Departemen
                                    Anda.
                                </p>
                            </div>
                            <div className="bg-red-100 text-red-800 font-bold px-4 py-2 rounded-full shadow-inner">
                                {totalPending} Menunggu
                            </div>
                        </div>

                        {totalPending === 0 ? (
                            <div className="text-center py-8 text-gray-500 font-medium bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                🎉 Tidak ada antrean persetujuan saat ini. Tim
                                Anda aman!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Antrean Cuti */}
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 shadow-sm">
                                    <h4 className="font-bold text-orange-800 mb-3 border-b border-orange-200 pb-2">
                                        🗓️ Pengajuan Cuti ({pendingCuti.length})
                                    </h4>
                                    <ul className="space-y-3 mb-4">
                                        {pendingCuti.slice(0, 3).map((cuti) => (
                                            <li
                                                key={cuti.id}
                                                className="text-sm bg-white p-2 rounded shadow-sm"
                                            >
                                                <span className="font-bold">
                                                    {
                                                        cuti.karyawan
                                                            ?.nama_lengkap
                                                    }
                                                </span>
                                                <br />
                                                <span className="text-gray-500">
                                                    {cuti.jenis_cuti} (
                                                    {new Date(
                                                        cuti.tanggal_mulai,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                    )
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={route("admin.cuti.index")}
                                        className="w-full block text-center bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded text-sm transition"
                                    >
                                        Proses Cuti &rarr;
                                    </Link>
                                </div>

                                {/* Antrean Lembur */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                                    <h4 className="font-bold text-blue-800 mb-3 border-b border-blue-200 pb-2">
                                        ⏱️ Pengajuan Lembur (
                                        {pendingLembur.length})
                                    </h4>
                                    <ul className="space-y-3 mb-4">
                                        {pendingLembur
                                            .slice(0, 3)
                                            .map((lembur) => (
                                                <li
                                                    key={lembur.id}
                                                    className="text-sm bg-white p-2 rounded shadow-sm"
                                                >
                                                    <span className="font-bold">
                                                        {
                                                            lembur.karyawan
                                                                ?.nama_lengkap
                                                        }
                                                    </span>
                                                    <br />
                                                    <span className="text-gray-500">
                                                        {new Date(
                                                            lembur.tanggal,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}{" "}
                                                        ({lembur.jam_mulai} -{" "}
                                                        {lembur.jam_selesai})
                                                    </span>
                                                </li>
                                            ))}
                                    </ul>
                                    <Link
                                        href={route("admin.lembur.index")}
                                        className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition"
                                    >
                                        Proses Lembur &rarr;
                                    </Link>
                                </div>

                                {/* Antrean SPJ */}
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 shadow-sm">
                                    <h4 className="font-bold text-purple-800 mb-3 border-b border-purple-200 pb-2">
                                        ✈️ Pengajuan SPJ ({pendingSpj.length})
                                    </h4>
                                    <ul className="space-y-3 mb-4">
                                        {pendingSpj.slice(0, 3).map((spj) => (
                                            <li
                                                key={spj.id}
                                                className="text-sm bg-white p-2 rounded shadow-sm"
                                            >
                                                <span className="font-bold">
                                                    {spj.karyawan?.nama_lengkap}
                                                </span>
                                                <br />
                                                <span className="text-gray-500">
                                                    Tujuan: {spj.tujuan}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={route("admin.spj.index")}
                                        className="w-full block text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm transition"
                                    >
                                        Proses SPJ &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- KOMPONEN SELF-SERVICE (Sama seperti Karyawan Biasa) --- */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8 flex flex-col md:flex-row justify-between items-center border-t-4 border-indigo-500">
                        <div className="text-center md:text-left mb-6 md:mb-0">
                            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                Portal Kehadiran Pribadi
                            </h3>
                            <p className="text-gray-500 mt-2">
                                Jangan lupa untuk melakukan Clock-In sebelum
                                mulai bekerja.
                            </p>
                        </div>
                        <div>
                            <Link
                                href={route("absensi.create")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105 inline-block text-center"
                            >
                                ⏱️ Terminal Absensi
                            </Link>
                        </div>
                    </div>

                    {/* Widget Cuti & Kasbon Pribadi */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center border-l-4 border-green-500 hover:shadow-md transition">
                            <div className="p-4 rounded-full bg-green-100 text-green-600 mr-5 text-3xl">
                                🌴
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    Sisa Saldo Cuti Saya
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
                                    Ajukan Cuti Pribadi &rarr;
                                </Link>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center border-l-4 border-orange-500 hover:shadow-md transition">
                            <div className="p-4 rounded-full bg-orange-100 text-orange-600 mr-5 text-3xl">
                                💰
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    Sisa Limit Kasbon Saya
                                </p>
                                <p className="text-3xl font-extrabold text-gray-800 my-1">
                                    Rp {sisaKasbon.toLocaleString("id-ID")}
                                </p>
                                <Link
                                    href={route("pinjaman.index")}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                                >
                                    Ajukan Kasbon Pribadi &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
