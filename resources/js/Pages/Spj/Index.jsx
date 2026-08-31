import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Index({ spj }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Riwayat Perjalanan Dinas (SPJ)
                </h2>
            }
        >
            <Head title="SPJ Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route("spj.create")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all"
                        >
                            + Buat Pengajuan SPJ
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tujuan & Keperluan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total Biaya
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spj.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada riwayat SPJ.
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
                                                        {item.tujuan}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {item.keperluan}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
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
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm font-bold text-green-600">
                                                    Rp{" "}
                                                    {Number(
                                                        item.total_biaya,
                                                    ).toLocaleString("id-ID")}
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
                                                                  ? "bg-blue-100 text-blue-800"
                                                                  : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {item.status_approval}
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
        </AuthenticatedLayout>
    );
}
