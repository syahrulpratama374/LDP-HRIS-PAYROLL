import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function AdminIndex({ lemburs }) {
    const { post } = useForm();

    const handleAction = (id, status) => {
        if (
            confirm(
                `Apakah Anda yakin ingin mengubah status pengajuan ini menjadi ${status}?`,
            )
        ) {
            post(route("admin.lembur.update", id), {
                status_approval: status,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Persetujuan (Approval) Lembur Karyawan
                </h2>
            }
        >
            <Head title="Approval Lembur" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Nama Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Departemen
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tanggal / Jam
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Deskripsi
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lemburs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada pengajuan lembur yang
                                                masuk.
                                            </td>
                                        </tr>
                                    ) : (
                                        lemburs.map((lembur) => (
                                            <tr
                                                key={lembur.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b text-sm font-bold text-gray-800">
                                                    {lembur.karyawan
                                                        ? lembur.karyawan
                                                              .nama_lengkap
                                                        : "Tidak Diketahui"}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-600">
                                                    {lembur.karyawan?.departemen
                                                        ? lembur.karyawan
                                                              .departemen
                                                              .nama_departemen
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(
                                                        lembur.tanggal,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}{" "}
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {lembur.jam_mulai} -{" "}
                                                        {lembur.jam_selesai}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-600">
                                                    {lembur.deskripsi_pekerjaan}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {lembur.status_approval ===
                                                    "Pending" ? (
                                                        <div className="flex justify-center items-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleAction(
                                                                        lembur.id,
                                                                        "Disetujui",
                                                                    )
                                                                }
                                                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                            >
                                                                Setuju
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleAction(
                                                                        lembur.id,
                                                                        "Ditolak",
                                                                    )
                                                                }
                                                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Selesai
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
