import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";

export default function Index({ penilaians }) {
    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus data penilaian ini?")) {
            router.delete(route("admin.kinerja.destroy", id));
        }
    };

    const getPredikat = (skor) => {
        if (skor >= 90)
            return {
                text: "Sangat Baik",
                color: "bg-green-100 text-green-800",
            };
        if (skor >= 75)
            return { text: "Baik", color: "bg-blue-100 text-blue-800" };
        if (skor >= 60)
            return { text: "Cukup", color: "bg-yellow-100 text-yellow-800" };
        return { text: "Kurang", color: "bg-red-100 text-red-800" };
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Penilaian Kinerja (KPI)
                </h2>
            }
        >
            <Head title="Manajemen Kinerja" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Link
                            href={route("admin.kinerja.create")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow"
                        >
                            + Input Evaluasi Baru
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
                                            Periode
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Skor & Predikat
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase w-1/3">
                                            Catatan Evaluasi
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {penilaians.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada data evaluasi kinerja.
                                            </td>
                                        </tr>
                                    ) : (
                                        penilaians.map((p) => {
                                            const predikat = getPredikat(
                                                p.skor_kpi,
                                            );
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 border-b">
                                                        <div className="font-bold text-gray-800">
                                                            {
                                                                p.karyawan
                                                                    ?.nama_lengkap
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Dinilai oleh:{" "}
                                                            {p.penilai
                                                                ?.nama_lengkap ||
                                                                "Sistem"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 border-b">
                                                        <span className="font-semibold text-gray-700">
                                                            Bulan{" "}
                                                            {p.periode_bulan} /{" "}
                                                            {p.periode_tahun}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 border-b">
                                                        <div className="text-2xl font-black text-gray-900">
                                                            {Number(p.skor_kpi)}
                                                        </div>
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-bold ${predikat.color}`}
                                                        >
                                                            {predikat.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 border-b">
                                                        <div className="text-sm text-gray-600 italic">
                                                            "
                                                            {p.catatan_evaluasi}
                                                            "
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 border-b text-center">
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    p.id,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900 font-bold text-sm"
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
