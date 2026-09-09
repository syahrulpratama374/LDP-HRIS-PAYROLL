import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function Index({ karyawans }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (
            confirm(
                "Yakin ingin menghapus data karyawan beserta akun loginnya secara permanen?",
            )
        ) {
            destroy(route("karyawan.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Kepegawaian - Data Karyawan
                </h2>
            }
        >
            <Head title="Data Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-700">
                                Daftar Karyawan Terdaftar
                            </h3>
                            <Link href={route("karyawan.create")}>
                                <PrimaryButton className="bg-indigo-600 hover:bg-indigo-700">
                                    + Tambah Karyawan
                                </PrimaryButton>
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 border">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 border-r">
                                            NIK
                                        </th>
                                        <th className="px-6 py-3 border-r">
                                            Nama Lengkap
                                        </th>
                                        <th className="px-6 py-3 border-r">
                                            Departemen
                                        </th>
                                        <th className="px-6 py-3 border-r">
                                            Atasan Langsung
                                        </th>
                                        <th className="px-6 py-3 border-r text-center">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {karyawans.length > 0 ? (
                                        karyawans.map((karyawan) => (
                                            <tr
                                                key={karyawan.id}
                                                className="bg-white border-b hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 border-r font-medium text-gray-900">
                                                    {karyawan.nik_internal}
                                                </td>
                                                <td className="px-6 py-4 border-r font-bold text-indigo-600">
                                                    {karyawan.nama_lengkap}
                                                </td>
                                                <td className="px-6 py-4 border-r">
                                                    {
                                                        karyawan.departemen
                                                            ?.nama_departemen
                                                    }{" "}
                                                    <br />
                                                    <span className="text-xs text-gray-400">
                                                        {
                                                            karyawan.jabatan
                                                                ?.nama_jabatan
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-r text-gray-700 font-medium">
                                                    {karyawan.atasan ? (
                                                        karyawan.atasan
                                                            .nama_lengkap
                                                    ) : (
                                                        <span className="text-red-400 italic">
                                                            BOD (Highest)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-r text-center">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs text-white font-bold ${karyawan.status_aktif ? "bg-green-500" : "bg-red-500"}`}
                                                    >
                                                        {karyawan.status_aktif
                                                            ? "Aktif"
                                                            : "Resign"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                                                    <Link
                                                        href={route(
                                                            "karyawan.show",
                                                            karyawan.id,
                                                        )}
                                                    >
                                                        <PrimaryButton className="!bg-blue-600 hover:!bg-blue-700 !py-1 !px-2">
                                                            Detail
                                                        </PrimaryButton>
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            "karyawan.edit",
                                                            karyawan.id,
                                                        )}
                                                    >
                                                        <SecondaryButton className="!py-1 !px-2">
                                                            Edit
                                                        </SecondaryButton>
                                                    </Link>
                                                    <DangerButton
                                                        onClick={() =>
                                                            handleDelete(
                                                                karyawan.id,
                                                            )
                                                        }
                                                        className="!py-1 !px-2"
                                                    >
                                                        Hapus
                                                    </DangerButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada data karyawan.
                                            </td>
                                        </tr>
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
