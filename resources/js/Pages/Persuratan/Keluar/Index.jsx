import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Index({ auth, suratKeluars }) {
    const { post } = useForm();

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
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold">
                                Manajemen Surat Keluar
                            </h3>

                            <Link
                                href={route("keluar.create")}
                                className="px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700"
                            >
                                Buat Surat Baru
                            </Link>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3">No. Surat</th>
                                    <th className="p-3">Tujuan (Karyawan)</th>
                                    <th className="p-3">Template</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suratKeluars.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="p-3 text-center text-gray-500"
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
                                            <td className="p-3">
                                                {surat.nomor_surat || (
                                                    <span className="text-red-500 italic">
                                                        Belum Terbit
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {surat.karyawan?.nama_lengkap}
                                            </td>
                                            <td className="p-3">
                                                {surat.template?.nama_template}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs text-white ${surat.status === "Terbit" ? "bg-green-500" : "bg-yellow-500"}`}
                                                >
                                                    {surat.status}
                                                </span>
                                            </td>
                                            <td className="p-3 space-x-2">
                                                {surat.status === "Draft" && (
                                                    <button
                                                        onClick={() =>
                                                            handleTerbitkan(
                                                                surat.id,
                                                            )
                                                        }
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Terbitkan
                                                    </button>
                                                )}
                                                {surat.status === "Terbit" && (
                                                    <a
                                                        href="#"
                                                        className="text-gray-600 hover:underline"
                                                    >
                                                        Unduh PDF
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
        </AuthenticatedLayout>
    );
}
