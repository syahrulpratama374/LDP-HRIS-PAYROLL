import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function IndexCuti({ auth, riwayatCuti }) {
    const { flash } = usePage().props;
    const [selectedCuti, setSelectedCuti] = useState(null); // State untuk Pop-up Modal

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Riwayat Cuti & Izin
                </h2>
            }
        >
            <Head title="Riwayat Cuti" />

            {/* MODAL POP-UP DETAIL CUTI */}
            {selectedCuti && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">
                                Detail Pengajuan Cuti
                            </h3>
                            <button
                                onClick={() => setSelectedCuti(null)}
                                className="text-white hover:text-gray-200 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">
                                        Jenis Cuti
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedCuti.jenis_cuti}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">
                                        Status
                                    </p>
                                    <p className="font-bold text-indigo-600">
                                        {selectedCuti.status_approval}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase">
                                        Periode
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedCuti.tanggal_mulai} s/d{" "}
                                        {selectedCuti.tanggal_selesai}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                                    Alasan Lengkap
                                </p>
                                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 whitespace-pre-line">
                                    {selectedCuti.alasan}
                                </div>
                            </div>
                            {selectedCuti.dokumen_bukti_path && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">
                                        Lampiran / Surat Dokter
                                    </p>
                                    <a
                                        href={`/storage/${selectedCuti.dokumen_bukti_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded font-bold text-sm hover:bg-blue-100 transition"
                                    >
                                        📄 Lihat / Unduh Lampiran
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t text-right">
                            <PrimaryButton
                                onClick={() => setSelectedCuti(null)}
                                className="!bg-gray-800"
                            >
                                Tutup
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div
                            className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative font-bold"
                            role="alert"
                        >
                            ✅ {flash.success}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Daftar Pengajuan Anda
                                </h3>
                                <Link href={route("cuti.create")}>
                                    <PrimaryButton>
                                        + Ajukan Cuti Baru
                                    </PrimaryButton>
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r">
                                                Tgl Pengajuan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r">
                                                Jenis Cuti
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r">
                                                Periode
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase border-r">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {riwayatCuti.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-8 whitespace-nowrap text-sm text-gray-500 text-center"
                                                >
                                                    Belum ada riwayat pengajuan
                                                    cuti.
                                                </td>
                                            </tr>
                                        ) : (
                                            riwayatCuti.map((cuti) => (
                                                <tr
                                                    key={cuti.id}
                                                    className="hover:bg-gray-50 transition border-b"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r font-mono">
                                                        {new Date(
                                                            cuti.created_at,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 border-r">
                                                        {cuti.jenis_cuti}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                                                        {cuti.tanggal_mulai} s/d{" "}
                                                        {cuti.tanggal_selesai}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center border-r">
                                                        <span
                                                            className={`px-3 py-1 inline-flex text-xs font-bold rounded-full 
                                                            ${
                                                                cuti.status_approval ===
                                                                "Disetujui"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : cuti.status_approval ===
                                                                        "Ditolak"
                                                                      ? "bg-red-100 text-red-800"
                                                                      : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                        >
                                                            {
                                                                cuti.status_approval
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedCuti(
                                                                    cuti,
                                                                )
                                                            }
                                                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded text-xs font-bold transition"
                                                        >
                                                            Lihat Detail
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
            </div>
        </AuthenticatedLayout>
    );
}
