import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function Index({ auth, asets, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("admin.aset.index"),
            { search },
            { preserveState: true },
        );
    };

    const formatRupiah = (angka) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Manajemen Aset & Inventaris
                </h2>
            }
        >
            <Head title="Manajemen Aset" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative shadow-sm">
                            {flash.success}
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <form
                            onSubmit={handleSearch}
                            className="flex space-x-2"
                        >
                            <input
                                type="text"
                                placeholder="Cari nama atau kode aset..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm w-64"
                            />
                            <button
                                type="submit"
                                className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-md font-bold text-sm transition"
                            >
                                Cari
                            </button>
                        </form>
                        <Link
                            href={route("admin.aset.create")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition"
                        >
                            + Tambah Aset Baru
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            QR Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            Detail Aset
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            Pemegang / Lokasi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                                            Informasi Finansial
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {asets.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada aset terdaftar di
                                                sistem.
                                            </td>
                                        </tr>
                                    ) : (
                                        asets.data.map((aset) => (
                                            <tr
                                                key={aset.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4">
                                                    {aset.qr_code_path ? (
                                                        <a
                                                            href={`/storage/${aset.qr_code_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <img
                                                                src={`/storage/${aset.qr_code_path}`}
                                                                alt="QR"
                                                                className="w-16 h-16 object-contain border border-gray-300 rounded p-1 bg-white hover:scale-150 transition-transform duration-300"
                                                                title="Klik untuk memperbesar"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-red-500">
                                                            No QR
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-lg">
                                                        {aset.kode_aset}
                                                    </div>
                                                    <div className="font-semibold text-indigo-600">
                                                        {aset.nama_aset}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                                        {aset.kategori}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {aset.penanggung_jawab_id ? (
                                                        <>
                                                            <div className="font-bold text-gray-800">
                                                                {
                                                                    aset
                                                                        .penanggung_jawab
                                                                        ?.nama_lengkap
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {
                                                                    aset
                                                                        .penanggung_jawab
                                                                        ?.departemen
                                                                        ?.nama_departemen
                                                                }
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-sm">
                                                            Di Gudang (Tidak
                                                            ditugaskan)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-800">
                                                        {aset.harga_beli
                                                            ? formatRupiah(
                                                                  aset.harga_beli,
                                                              )
                                                            : "-"}
                                                    </div>
                                                    {aset.tgl_expired_pajak && (
                                                        <div className="text-xs text-red-600 mt-1 font-bold">
                                                            Exp Pajak:{" "}
                                                            {new Date(
                                                                aset.tgl_expired_pajak,
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                                                        ${
                                                            aset.status ===
                                                            "Tersedia"
                                                                ? "bg-green-100 text-green-800"
                                                                : aset.status ===
                                                                    "Dipakai"
                                                                  ? "bg-blue-100 text-blue-800"
                                                                  : aset.status ===
                                                                      "Maintenance"
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {aset.status}
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
