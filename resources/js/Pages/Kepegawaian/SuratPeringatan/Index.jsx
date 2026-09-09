import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";

export default function Index({ suratPeringatans }) {
    const handleDelete = (id) => {
        if (
            confirm(
                "Yakin ingin menghapus arsip SP ini? Data tidak dapat dipulihkan.",
            )
        ) {
            router.delete(route("admin.sp.destroy", id));
        }
    };

    // Fungsi membaca status Aktif/Kedaluwarsa
    const checkStatus = (tglSelesai) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset waktu ke jam 00:00 untuk komparasi adil
        const selesai = new Date(tglSelesai);

        return selesai >= today; // Jika tanggal selesai masih masa depan/hari ini = true (Aktif)
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Data Pelanggaran Karyawan (SP)
                </h2>
            }
        >
            <Head title="Manajemen SP" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Link
                            href={route("admin.sp.create")}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow"
                        >
                            + Terbitkan SP Baru
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tingkat SP
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Masa Berlaku
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Lampiran
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suratPeringatans.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada riwayat penerbitan SP.
                                            </td>
                                        </tr>
                                    ) : (
                                        suratPeringatans.map((sp) => {
                                            const isAktif = checkStatus(
                                                sp.tgl_selesai,
                                            );

                                            return (
                                                <tr
                                                    key={sp.id}
                                                    className={`transition border-b ${isAktif ? "hover:bg-red-50" : "bg-gray-50 opacity-75"}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-800">
                                                            {
                                                                sp.karyawan
                                                                    ?.nama_lengkap
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {
                                                                sp.karyawan
                                                                    ?.departemen
                                                                    ?.nama_departemen
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`font-bold px-2 py-1 rounded text-xs ${isAktif ? "bg-red-100 text-red-800" : "bg-gray-200 text-gray-600"}`}
                                                        >
                                                            {sp.jenis_sp}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold">
                                                            {new Date(
                                                                sp.tgl_mulai,
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            s/d{" "}
                                                            {new Date(
                                                                sp.tgl_selesai,
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {isAktif ? (
                                                            <span className="text-xs font-bold text-red-600">
                                                                ⚠ AKTIF
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-green-600">
                                                                ✔ Kedaluwarsa
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {sp.file_surat_path ? (
                                                            <a
                                                                href={`/storage/${sp.file_surat_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs text-indigo-600 hover:underline font-semibold"
                                                            >
                                                                Lihat Dokumen
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">
                                                                Tidak ada file
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    sp.id,
                                                                )
                                                            }
                                                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded shadow"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
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
