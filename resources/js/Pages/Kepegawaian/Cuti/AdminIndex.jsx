import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function AdminIndex({ auth, pengajuan }) {
    // Fungsi untuk menembak update status ke backend
    const handleApproval = (id, status, namaKaryawan) => {
        if (
            confirm(
                `Anda yakin ingin ${status.toUpperCase()} pengajuan cuti dari ${namaKaryawan}?`,
            )
        ) {
            router.patch(
                route("admin.cuti.status", id),
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
                    Approval Cuti Tim (Tier-1)
                </h2>
            }
        >
            <Head title="Approval Cuti Tim" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6 border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Daftar Pengajuan Cuti Bawahan
                            </h3>
                            <p className="text-sm text-gray-500">
                                Persetujuan ini akan memicu sistem untuk
                                memotong saldo cuti tahunan Karyawan terkait.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Detail Cuti
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Alasan
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
                                    {pengajuan.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Tidak ada pengajuan cuti dari
                                                tim Anda.
                                            </td>
                                        </tr>
                                    ) : (
                                        pengajuan.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-bold text-gray-800">
                                                        {
                                                            item.karyawan
                                                                ?.nama_lengkap
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {
                                                            item.karyawan
                                                                ?.jabatan
                                                                ?.nama_jabatan
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-semibold text-indigo-600">
                                                        {item.jenis_cuti}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {new Date(
                                                            item.tanggal_mulai,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}{" "}
                                                        s/d{" "}
                                                        {new Date(
                                                            item.tanggal_selesai,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                </td>
                                                <td
                                                    className="px-6 py-4 border-b text-sm text-gray-700 max-w-xs truncate"
                                                    title={item.alasan}
                                                >
                                                    {item.alasan}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            item.status_approval ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : item.status_approval ===
                                                                    "Disetujui"
                                                                  ? "bg-green-100 text-green-800"
                                                                  : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {item.status_approval}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {item.status_approval ===
                                                    "Pending" ? (
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleApproval(
                                                                        item.id,
                                                                        "Disetujui",
                                                                        item
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
                                                                        item.id,
                                                                        "Ditolak",
                                                                        item
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
