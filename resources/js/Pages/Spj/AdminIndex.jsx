import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";

export default function AdminIndex({ spj }) {
    const { auth } = usePage().props;
    const userRole = auth.user.role_id;

    const handleApproval = (id, status, namaKaryawan) => {
        let textConfirm = `Apakah Anda yakin ingin menolak pengajuan ini?`;
        if (status === "Menunggu Pelaporan")
            textConfirm = `Setujui Pra-SPJ dari ${namaKaryawan}? Karyawan dapat berangkat dan wajib lapor nota setelah pulang.`;
        if (status === "Selesai")
            textConfirm = `Validasi nota SPJ dari ${namaKaryawan}? Dana akan otomatis masuk ke mesin Payroll bulan ini.`;

        if (confirm(textConfirm)) {
            router.patch(
                route("admin.spj.status", id),
                {
                    status_approval: status,
                },
                { preserveScroll: true },
            );
        }
    };

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
                    Approval Perjalanan Dinas (Tier 1 & 2)
                </h2>
            }
        >
            <Head title="Approval SPJ Tim" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Nama Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tujuan & Tanggal
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total Biaya & Bukti Nota
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
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
                                                Belum ada pengajuan SPJ.
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
                                                            "N/A"}
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
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-bold text-gray-800">
                                                        {formatRupiah(
                                                            item.total_biaya,
                                                        )}
                                                    </div>
                                                    {item.file_bukti_path ? (
                                                        <a
                                                            href={`/storage/${item.file_bukti_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-600 hover:underline mt-1 block font-semibold"
                                                        >
                                                            📄 Lihat Bukti Nota
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-red-500 italic mt-1 block">
                                                            Belum ada nota
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            item.status_approval ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : item.status_approval ===
                                                                    "Menunggu Pelaporan"
                                                                  ? "bg-blue-100 text-blue-800"
                                                                  : item.status_approval ===
                                                                      "Menunggu Validasi Finance"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : item.status_approval ===
                                                                        "Selesai"
                                                                      ? "bg-green-100 text-green-800"
                                                                      : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {item.status_approval}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <div className="flex justify-center items-center space-x-2">
                                                        {/* TIER-1: SPV APPROVAL */}
                                                        {item.status_approval ===
                                                            "Pending" &&
                                                            [1, 5].includes(
                                                                userRole,
                                                            ) && (
                                                                <>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleApproval(
                                                                                item.id,
                                                                                "Menunggu Pelaporan",
                                                                                item
                                                                                    .karyawan
                                                                                    ?.nama_lengkap,
                                                                            )
                                                                        }
                                                                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded shadow transition text-xs font-bold"
                                                                    >
                                                                        Setujui
                                                                        Berangkat
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
                                                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded shadow transition text-xs font-bold"
                                                                    >
                                                                        Tolak
                                                                    </button>
                                                                </>
                                                            )}

                                                        {/* TIER-2: FINANCE VALIDATION */}
                                                        {item.status_approval ===
                                                            "Menunggu Validasi Finance" &&
                                                            [1, 4].includes(
                                                                userRole,
                                                            ) && (
                                                                <>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleApproval(
                                                                                item.id,
                                                                                "Selesai",
                                                                                item
                                                                                    .karyawan
                                                                                    ?.nama_lengkap,
                                                                            )
                                                                        }
                                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded shadow transition text-xs font-bold"
                                                                    >
                                                                        Validasi
                                                                        &
                                                                        Cairkan
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
                                                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded shadow transition text-xs font-bold"
                                                                    >
                                                                        Tolak
                                                                    </button>
                                                                </>
                                                            )}

                                                        {/* INDICATORS */}
                                                        {[
                                                            "Selesai",
                                                            "Ditolak",
                                                        ].includes(
                                                            item.status_approval,
                                                        ) && (
                                                            <span className="text-xs text-gray-400 italic">
                                                                Selesai Diproses
                                                            </span>
                                                        )}
                                                        {item.status_approval ===
                                                            "Menunggu Pelaporan" && (
                                                            <span className="text-xs text-blue-500 italic font-semibold">
                                                                Menunggu
                                                                Karyawan Lapor
                                                            </span>
                                                        )}
                                                    </div>
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
