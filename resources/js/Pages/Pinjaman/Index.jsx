import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Index({ pinjaman }) {
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {pinjaman.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
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
                                                    Rp{" "}
                                                    {Number(
                                                        p.total_pinjaman,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {p.tenor_bulan} Bulan
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-red-600 font-semibold">
                                                    Rp{" "}
                                                    {Number(
                                                        p.sisa_pinjaman,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            p.status ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
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
