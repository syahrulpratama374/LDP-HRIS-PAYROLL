import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function Index({ pengumumans }) {
    const { flash } = usePage().props;

    const handleDelete = (id) => {
        if (
            confirm(
                "Cabut dan hapus pengumuman ini secara permanen dari dasbor karyawan?",
            )
        ) {
            router.delete(route("pengumuman.destroy", id), {
                preserveScroll: true,
            });
        }
    };

    const checkStatus = (tglMulai, tglSelesai) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(tglMulai);
        const end = new Date(tglSelesai);

        if (today >= start && today <= end)
            return (
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                    MENGUDARA
                </span>
            );
        if (today < start)
            return (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                    TERJADWAL
                </span>
            );
        return (
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                KEDALUWARSA
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Manajemen Broadcast (Pengumuman)
                </h2>
            }
        >
            <Head title="Manajemen Pengumuman" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative shadow-sm">
                            {flash.success}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Link
                            href={route("pengumuman.create")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition"
                        >
                            + Buat Siaran Baru
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            Judul & Tipe
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            Target Audiens
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            Masa Tayang
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pengumumans.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada riwayat pengumuman.
                                            </td>
                                        </tr>
                                    ) : (
                                        pengumumans.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">
                                                        {p.judul}
                                                    </div>
                                                    <div
                                                        className={`text-xs font-semibold mt-1 
                                                        ${p.tipe_banner === "Info" ? "text-blue-600" : p.tipe_banner === "Peringatan" ? "text-orange-600" : "text-green-600"}`}
                                                    >
                                                        Banner: {p.tipe_banner}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                                                    {p.target_audiens ===
                                                    "Global"
                                                        ? "🌎 Global"
                                                        : `🏢 Dept ID: ${p.target_audiens}`}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(
                                                        p.tgl_mulai,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}{" "}
                                                    -{" "}
                                                    {new Date(
                                                        p.tgl_selesai,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {checkStatus(
                                                        p.tgl_mulai,
                                                        p.tgl_selesai,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(p.id)
                                                        }
                                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-1 px-3 rounded transition"
                                                    >
                                                        Cabut
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
