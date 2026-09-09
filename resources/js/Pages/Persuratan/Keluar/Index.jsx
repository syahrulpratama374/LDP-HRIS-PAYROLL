import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Index({ auth, suratKeluars }) {
    const { post } = useForm();
    const { flash, errors } = usePage().props;

    const handleTerbitkan = (id) => {
        if (
            confirm(
                "Terbitkan surat ini? Nomor resmi akan di-generate dan tidak bisa dihapus.",
            )
        ) {
            post(route("keluar.terbitkan", id));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Daftar Surat Keluar HC
                </h2>
            }
        >
            <Head title="Surat Keluar" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {/* FLASH MESSAGES */}
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            {flash.success}
                        </div>
                    )}
                    {errors?.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {errors.error}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between mb-4 border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Manajemen Surat Keluar
                            </h3>
                            <Link
                                href={route("keluar.create")}
                                className="px-4 py-2 bg-indigo-600 rounded-md font-bold text-xs text-white uppercase hover:bg-indigo-700"
                            >
                                + Buat Draft Baru
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-gray-200 text-sm">
                                <thead className="bg-gray-100">
                                    <tr className="border-b">
                                        <th className="p-3 border-r">
                                            No. Surat
                                        </th>
                                        <th className="p-3 border-r">
                                            Tujuan (Karyawan)
                                        </th>
                                        <th className="p-3 border-r">
                                            Template
                                        </th>
                                        <th className="p-3 border-r text-center">
                                            Status
                                        </th>
                                        <th className="p-3 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suratKeluars.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="p-6 text-center text-gray-500"
                                            >
                                                Belum ada data surat.
                                            </td>
                                        </tr>
                                    ) : (
                                        suratKeluars.data.map((surat) => (
                                            <tr
                                                key={surat.id}
                                                className="border-b hover:bg-gray-50"
                                            >
                                                <td className="p-3 border-r font-bold text-gray-800">
                                                    {surat.nomor_surat || (
                                                        <span className="text-red-500 italic font-normal">
                                                            Menunggu Diterbitkan
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 border-r">
                                                    <div className="font-semibold text-indigo-600">
                                                        {
                                                            surat.karyawan
                                                                ?.nama_lengkap
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {
                                                            surat.karyawan
                                                                ?.nik_internal
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r">
                                                    {
                                                        surat.template
                                                            ?.nama_template
                                                    }
                                                </td>
                                                <td className="p-3 border-r text-center">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-bold text-white ${surat.status === "Terbit" ? "bg-green-500" : "bg-yellow-500"}`}
                                                    >
                                                        {surat.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center space-x-3">
                                                    {surat.status ===
                                                        "Draft" && (
                                                        <button
                                                            onClick={() =>
                                                                handleTerbitkan(
                                                                    surat.id,
                                                                )
                                                            }
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow transition"
                                                        >
                                                            Terbitkan Surat
                                                        </button>
                                                    )}
                                                    {surat.status ===
                                                        "Terbit" && (
                                                        <a
                                                            href={route(
                                                                "keluar.pdf",
                                                                surat.id,
                                                            )}
                                                            className="text-red-600 hover:text-red-800 font-bold text-xs hover:underline flex items-center justify-center gap-1"
                                                        >
                                                            📄 Unduh PDF
                                                        </a>
                                                    )}
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
