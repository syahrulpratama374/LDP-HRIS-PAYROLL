import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function AdminIndex({ lemburs }) {
    // Menerima parameter tambahan namaKaryawan agar dialog konfirmasi lebih personal
    const handleApproval = (id, status, namaKaryawan) => {
        if (
            confirm(
                `Apakah Anda yakin ingin ${status.toUpperCase()} pengajuan lembur dari ${namaKaryawan}?`,
            )
        ) {
            // Menggunakan metode PATCH agar standar dengan Approval Cuti
            router.patch(
                route("admin.lembur.status", id),
                {
                    status_approval: status,
                },
                {
                    preserveScroll: true,
                },
            );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Approval Lembur Tim (Tier-1)
                </h2>
            }
        >
            <Head title="Approval Lembur Tim" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6 border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Daftar Pengajuan Lembur Bawahan
                            </h3>
                            <p className="text-sm text-gray-500">
                                Validasi jam kerja tambahan tim Anda di sini.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Nama Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Departemen
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tanggal / Jam
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Deskripsi
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi (Tier-1)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lemburs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada pengajuan lembur yang
                                                masuk dari tim Anda.
                                            </td>
                                        </tr>
                                    ) : (
                                        lemburs.map((lembur) => (
                                            <tr
                                                key={lembur.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b text-sm font-bold text-gray-800">
                                                    {lembur.karyawan
                                                        ?.nama_lengkap ||
                                                        "Tidak Diketahui"}
                                                    <div className="text-xs font-normal text-gray-500 mt-1">
                                                        {
                                                            lembur.karyawan
                                                                ?.jabatan
                                                                ?.nama_jabatan
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-600">
                                                    {lembur.karyawan?.departemen
                                                        ?.nama_departemen ||
                                                        "-"}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    <span className="font-semibold text-indigo-600">
                                                        {new Date(
                                                            lembur.tanggal,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </span>
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {lembur.jam_mulai} -{" "}
                                                        {lembur.jam_selesai}
                                                    </span>
                                                </td>
                                                <td
                                                    className="px-6 py-4 border-b text-sm text-gray-600 max-w-xs truncate"
                                                    title={
                                                        lembur.deskripsi_pekerjaan
                                                    }
                                                >
                                                    {lembur.deskripsi_pekerjaan}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {/* Penambahan warna Badge Status agar seragam dengan modul Cuti */}
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            lembur.status_approval ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : lembur.status_approval ===
                                                                    "Disetujui"
                                                                  ? "bg-green-100 text-green-800"
                                                                  : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {lembur.status_approval}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {lembur.status_approval ===
                                                    "Pending" ? (
                                                        <div className="flex justify-center items-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleApproval(
                                                                        lembur.id,
                                                                        "Disetujui",
                                                                        lembur
                                                                            .karyawan
                                                                            ?.nama_lengkap,
                                                                    )
                                                                }
                                                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded shadow transition"
                                                                title="Setujui"
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleApproval(
                                                                        lembur.id,
                                                                        "Ditolak",
                                                                        lembur
                                                                            .karyawan
                                                                            ?.nama_lengkap,
                                                                    )
                                                                }
                                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded shadow transition"
                                                                title="Tolak"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Sudah Diproses
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
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
