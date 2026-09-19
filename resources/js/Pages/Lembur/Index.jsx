import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Index({ riwayatLembur }) {
    // State untuk Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

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
                    Riwayat Pengajuan Lembur
                </h2>
            }
        >
            <Head title="Pengajuan Lembur" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route("lembur.create")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all"
                        >
                            + Ajukan Lembur Baru
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
                                            Tanggal Lembur
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Jam
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riwayatLembur.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Anda belum pernah mengajukan
                                                lembur.
                                            </td>
                                        </tr>
                                    ) : (
                                        riwayatLembur.map((lembur) => (
                                            <tr
                                                key={lembur.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(
                                                        lembur.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm font-bold text-gray-800">
                                                    {new Date(
                                                        lembur.tanggal,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {lembur.jam_mulai} s/d{" "}
                                                    {lembur.jam_selesai}
                                                </td>
                                                <td className="px-6 py-4 border-b">
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
                                                    <button
                                                        onClick={() =>
                                                            openDetailModal(
                                                                lembur,
                                                            )
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

            {/* Modal Detail Lembur */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Rincian Pengajuan Lembur
                            </h3>
                            <button
                                onClick={closeDetailModal}
                                className="text-gray-500 hover:text-red-500 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                                <div>
                                    <span className="block text-gray-500 font-medium text-xs">
                                        Tanggal Lembur:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        {new Date(
                                            selectedDetail.tanggal,
                                        ).toLocaleDateString("id-ID")}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 font-medium text-xs">
                                        Durasi:
                                    </span>
                                    <span className="font-bold text-indigo-600">
                                        {selectedDetail.jam_mulai} -{" "}
                                        {selectedDetail.jam_selesai}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="block text-gray-500 font-medium mb-1">
                                    Deskripsi Pekerjaan:
                                </span>
                                <div className="bg-white border p-3 rounded text-gray-800">
                                    {selectedDetail.deskripsi_pekerjaan}
                                </div>
                            </div>

                            <div>
                                <span className="block text-gray-500 font-medium">
                                    Status Saat Ini:
                                </span>
                                <span
                                    className={`inline-flex font-bold 
                                    ${
                                        selectedDetail.status_approval ===
                                        "Pending"
                                            ? "text-yellow-600"
                                            : selectedDetail.status_approval ===
                                                "Disetujui"
                                              ? "text-green-600"
                                              : "text-red-600"
                                    }`}
                                >
                                    {selectedDetail.status_approval}
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
