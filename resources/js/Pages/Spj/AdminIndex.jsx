import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function AdminIndex({ spj }) {
    // Fungsi eksekusi persetujuan dengan konfirmasi
    const handleApproval = (id, status, namaKaryawan) => {
        if (
            confirm(
                `Apakah Anda yakin ingin ${status.toUpperCase()} pengajuan Pra-SPJ dari ${namaKaryawan}?`,
            )
        ) {
            router.patch(
                route("admin.spj.status", id),
                {
                    status_approval: status,
                },
                {
                    preserveScroll: true,
                },
            );
        }
    };

    // Fungsi format Rupiah
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Approval Perjalanan Dinas (Pra-SPJ Tier-1)
                </h2>
            }
        >
            <Head title="Approval SPJ Tim" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6 border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Daftar Pengajuan SPJ Bawahan
                            </h3>
                            <p className="text-sm text-gray-500">
                                Validasi rencana perjalanan dan estimasi
                                anggaran (Pra-SPJ) tim Anda sebelum diproses
                                oleh Finance.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Nama & Jabatan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tujuan & Tanggal
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total Estimasi Biaya
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
                                    {spj.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada pengajuan SPJ yang
                                                masuk dari tim Anda.
                                            </td>
                                        </tr>
                                    ) : (
                                        spj.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-bold text-gray-800">
                                                        {item.karyawan
                                                            ?.nama_lengkap ||
                                                            "Tidak Diketahui"}
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
                                                        {item.tujuan}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {new Date(
                                                            item.tgl_mulai,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}{" "}
                                                        -{" "}
                                                        {new Date(
                                                            item.tgl_selesai,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-400 mt-1 truncate max-w-[200px]"
                                                        title={item.keperluan}
                                                    >
                                                        {item.keperluan}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-bold text-gray-800">
                                                        {formatRupiah(
                                                            item.total_biaya,
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {item.komponen_biaya
                                                            ?.length || 0}{" "}
                                                        Item Rincian
                                                    </div>
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
                                                        <div className="flex justify-center items-center space-x-2">
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
                                                                title="Setujui Pra-SPJ"
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
                                                                title="Tolak SPJ"
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
