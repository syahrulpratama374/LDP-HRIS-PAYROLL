import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";

export default function Index({ auth, logs, filters }) {
    const [search, setSearch] = useState(filters?.search || "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("admin.audit.index"),
            { search },
            { preserveState: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Log Forensik Sistem (Audit Trail)
                </h2>
            }
        >
            <Head title="Audit Trail" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* FILTER PENCARIAN */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                            🕵️‍♂️ Jejak Digital & Aktivitas Sistem
                        </div>
                        <form
                            onSubmit={handleSearch}
                            className="flex space-x-2"
                        >
                            <input
                                type="text"
                                placeholder="Cari user, modul, aksi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm w-64"
                            />
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-bold text-sm transition"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* TABEL LOG */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                            Waktu Akses
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                            Aktor / User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                            Modul & Aksi
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-1/3">
                                            Detail Perubahan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada jejak aktivitas
                                                terekam.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.data.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b whitespace-nowrap">
                                                    <div className="font-bold text-gray-800">
                                                        {new Date(
                                                            log.waktu,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(
                                                            log.waktu,
                                                        ).toLocaleTimeString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b whitespace-nowrap">
                                                    <span className="font-bold text-indigo-600">
                                                        {log.user?.name ||
                                                            "System Auto"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b whitespace-nowrap">
                                                    <div className="font-semibold text-gray-800">
                                                        {log.modul}
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 mt-1 inline-flex text-xs leading-5 font-bold rounded-full 
                                                        ${
                                                            log.aksi.includes(
                                                                "Create",
                                                            ) ||
                                                            log.aksi.includes(
                                                                "Tambah",
                                                            )
                                                                ? "bg-green-100 text-green-800"
                                                                : log.aksi.includes(
                                                                        "Delete",
                                                                    ) ||
                                                                    log.aksi.includes(
                                                                        "Hapus",
                                                                    )
                                                                  ? "bg-red-100 text-red-800"
                                                                  : "bg-blue-100 text-blue-800"
                                                        }`}
                                                    >
                                                        {log.aksi}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    {log.data_lama && (
                                                        <div className="mb-2">
                                                            <span className="text-xs font-bold text-red-500 block mb-1">
                                                                Data Lama:
                                                            </span>
                                                            <pre className="text-xs text-gray-600 bg-red-50 p-2 rounded border border-red-100 overflow-x-auto break-all">
                                                                {log.data_lama}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {log.data_baru && (
                                                        <div>
                                                            <span className="text-xs font-bold text-green-500 block mb-1">
                                                                Data Baru:
                                                            </span>
                                                            <pre className="text-xs text-gray-600 bg-green-50 p-2 rounded border border-green-100 overflow-x-auto break-all">
                                                                {log.data_baru}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {!log.data_lama &&
                                                        !log.data_baru && (
                                                            <span className="text-xs text-gray-400 italic">
                                                                Tidak ada
                                                                payload data
                                                            </span>
                                                        )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PAGINASI */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="flex justify-end space-x-1 mt-4">
                            {logs.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`px-3 py-1 border rounded text-sm 
                                        ${link.active ? "bg-indigo-600 text-white font-bold" : "bg-white text-gray-700 hover:bg-gray-50"} 
                                        ${!link.url && "opacity-50 cursor-not-allowed"}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
