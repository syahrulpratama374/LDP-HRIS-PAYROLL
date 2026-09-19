import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Index({ pinjaman }) {
    // State untuk Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    const openDetailModal = (item) => {
        setSelectedDetail(item);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedDetail(null);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Riwayat Kasbon & Pinjaman
                </h2>
            }
        >
            <Head title="Kasbon Karyawan" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route("pinjaman.create")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all"
                        >
                            + Ajukan Pinjaman Baru
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tgl Pengajuan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total Pinjaman
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tenor
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Sisa Hutang
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
                                    {pinjaman.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Anda belum memiliki riwayat
                                                pinjaman.
                                            </td>
                                        </tr>
                                    ) : (
                                        pinjaman.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(
                                                        p.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm font-bold text-gray-800">
                                                    {formatRupiah(
                                                        p.total_pinjaman,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {p.tenor_bulan} Bulan
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-red-600 font-semibold">
                                                    {formatRupiah(
                                                        p.sisa_pinjaman,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            p.status ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : p.status ===
                                                                    "Menunggu Pencairan"
                                                                  ? "bg-orange-100 text-orange-800"
                                                                  : p.status ===
                                                                      "Menunggu Approval Direktur"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : p.status ===
                                                                        "Berjalan"
                                                                      ? "bg-blue-100 text-blue-800"
                                                                      : p.status ===
                                                                          "Lunas"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {/* TOMBOL DETAIL DITAMBAHKAN DI SINI */}
                                                    <button
                                                        onClick={() =>
                                                            openDetailModal(p)
                                                        }
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow transition text-xs font-bold"
                                                    >
                                                        Detail
                                                    </button>
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

            {/* Modal Detail Kasbon */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Rincian Kasbon / Pinjaman
                            </h3>
                            <button
                                onClick={closeDetailModal}
                                className="text-gray-500 hover:text-red-500 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded border">
                                <span className="block text-gray-500 font-medium text-xs mb-1">
                                    Total Pinjaman Disetujui:
                                </span>
                                <span className="font-bold text-xl text-gray-900">
                                    {formatRupiah(
                                        selectedDetail.total_pinjaman,
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-gray-500 font-medium text-xs">
                                        Tenor (Lama Cicilan):
                                    </span>
                                    <span className="font-bold text-gray-800">
                                        {selectedDetail.tenor_bulan} Bulan
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 font-medium text-xs">
                                        Potongan Per Bulan:
                                    </span>
                                    <span className="font-bold text-red-600">
                                        {formatRupiah(
                                            selectedDetail.total_pinjaman /
                                                selectedDetail.tenor_bulan,
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                <span className="block text-blue-800 font-medium text-xs mb-1">
                                    Sisa Hutang Saat Ini:
                                </span>
                                <span className="font-bold text-lg text-blue-900">
                                    {formatRupiah(selectedDetail.sisa_pinjaman)}
                                </span>
                            </div>

                            <div>
                                <span className="block text-gray-500 font-medium text-xs">
                                    Status Saat Ini:
                                </span>
                                <span
                                    className={`inline-flex font-bold mt-1
                                    ${
                                        selectedDetail.status === "Pending"
                                            ? "text-yellow-600"
                                            : selectedDetail.status === "Lunas"
                                              ? "text-green-600"
                                              : selectedDetail.status ===
                                                  "Ditolak"
                                                ? "text-red-600"
                                                : "text-blue-600"
                                    }`}
                                >
                                    {selectedDetail.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={closeDetailModal}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
