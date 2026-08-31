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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow"
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
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Keterangan
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
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada riwayat penerbitan SP.
                                            </td>
                                        </tr>
                                    ) : (
                                        suratPeringatans.map((sp) => (
                                            <tr
                                                key={sp.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b">
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
                                                <td className="px-6 py-4 border-b">
                                                    <span className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded text-xs">
                                                        {sp.jenis_sp}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b">
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
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm text-gray-700">
                                                        {sp.keterangan}
                                                    </div>
                                                    {sp.file_surat_path && (
                                                        <a
                                                            href={`/storage/${sp.file_surat_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                                                        >
                                                            Lihat Dokumen
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(sp.id)
                                                        }
                                                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded shadow"
                                                    >
                                                        Hapus
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
        </AuthenticatedLayout>
    );
}
