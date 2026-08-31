import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react"; // 1. Ubah useForm menjadi router

export default function AdminIndex({ pinjaman }) {
    // 2. Hapus const { post } = useForm();

    const handleAction = (id, status) => {
        let confirmText =
            status === "Disetujui"
                ? "Setujui pengajuan ini? Sistem akan otomatis membuat jadwal pemotongan gaji (cicilan) sesuai tenor."
                : "Tolak pengajuan kasbon ini?";

        if (confirm(confirmText)) {
            // 3. Gunakan router.post agar data 'status' benar-benar terkirim
            router.post(route("admin.pinjaman.update", id), {
                status: status,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Approval Kasbon & Pinjaman Karyawan
                </h2>
            }
        >
            <Head title="Approval Kasbon" />

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
                                            Tgl Pengajuan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total & Tenor
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Sisa Hutang
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
                                    {pinjaman.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada pengajuan kasbon dari
                                                karyawan.
                                            </td>
                                        </tr>
                                    ) : (
                                        pinjaman.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">
                                                        {p.karyawan
                                                            ? p.karyawan
                                                                  .nama_lengkap
                                                            : "Tidak Diketahui"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {p.karyawan?.departemen
                                                            ? p.karyawan
                                                                  .departemen
                                                                  .nama_departemen
                                                            : "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(
                                                        p.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-800">
                                                    <span className="font-bold">
                                                        Rp{" "}
                                                        {Number(
                                                            p.total_pinjaman,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </span>{" "}
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {p.tenor_bulan} Bulan
                                                        Cicilan
                                                    </span>
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
                                                                    "Disetujui"
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
                                                <td className="px-6 py-4 border-b text-center">
                                                    {p.status === "Pending" ? (
                                                        <div className="flex justify-center items-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleAction(
                                                                        p.id,
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
                                                                        p.id,
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
