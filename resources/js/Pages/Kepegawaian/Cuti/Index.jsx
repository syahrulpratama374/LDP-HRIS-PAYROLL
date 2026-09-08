import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function IndexCuti({ auth, riwayatCuti }) {
    // Menangkap pesan sukses dari controller
    const { flash } = usePage().props;

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

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Alert Notifikasi Sukses */}
                    {flash?.success && (
                        <div
                            className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                            role="alert"
                        >
                            <span className="block sm:inline">
                                {flash.success}
                            </span>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Daftar Pengajuan Anda
                                </h3>
                                <Link href={route("cuti.create")}>
                                    <PrimaryButton>
                                        + Ajukan Cuti Baru
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Tabel Riwayat */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal Pengajuan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Jenis Cuti
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Periode Cuti
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Alasan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {riwayatCuti.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                                >
                                                    Belum ada riwayat pengajuan
                                                    cuti.
                                                </td>
                                            </tr>
                                        ) : (
                                            riwayatCuti.map((cuti) => (
                                                <tr key={cuti.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(
                                                            cuti.created_at,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {cuti.jenis_cuti}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {cuti.tanggal_mulai} s/d{" "}
                                                        {cuti.tanggal_selesai}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                                                        {cuti.alasan}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
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
