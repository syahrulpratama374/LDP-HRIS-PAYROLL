import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function AdminIndex({ spj }) {
    const handleAction = (id, status) => {
        let confirmText =
            status === "Disetujui"
                ? "Setujui pengajuan perjalanan dinas (SPJ) ini? Dana akan siap ditarik ke dalam komponen Payroll."
                : "Tolak pengajuan SPJ ini?";

        if (confirm(confirmText)) {
            router.post(route("admin.spj.update", id), {
                status_approval: status,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Approval Perjalanan Dinas (SPJ)
                </h2>
            }
        >
            <Head title="Approval SPJ" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tujuan & Waktu
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase w-1/3">
                                            Rincian Estimasi Biaya
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
                                    {spj.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada pengajuan SPJ dari
                                                karyawan.
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
                                                        {item.karyawan
                                                            ? item.karyawan
                                                                  .nama_lengkap
                                                            : "Tidak Diketahui"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.karyawan
                                                            ?.departemen
                                                            ? item.karyawan
                                                                  .departemen
                                                                  .nama_departemen
                                                            : "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">
                                                        {item.tujuan}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {item.keperluan}
                                                    </div>
                                                    <div className="text-xs text-indigo-600 mt-2 font-semibold">
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
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <ul className="text-xs text-gray-600 space-y-1 mb-2 bg-gray-50 p-2 rounded">
                                                        {item.komponen_biaya &&
                                                            item.komponen_biaya.map(
                                                                (biaya) => (
                                                                    <li
                                                                        key={
                                                                            biaya.id
                                                                        }
                                                                        className="flex justify-between border-b border-gray-200 pb-1 last:border-0 last:pb-0"
                                                                    >
                                                                        <span>
                                                                            {
                                                                                biaya.jenis_biaya
                                                                            }{" "}
                                                                            {biaya.keterangan
                                                                                ? `(${biaya.keterangan})`
                                                                                : ""}
                                                                        </span>
                                                                        <span className="font-semibold text-gray-800">
                                                                            Rp{" "}
                                                                            {Number(
                                                                                biaya.nominal,
                                                                            ).toLocaleString(
                                                                                "id-ID",
                                                                            )}
                                                                        </span>
                                                                    </li>
                                                                ),
                                                            )}
                                                    </ul>
                                                    <div className="flex justify-between font-bold text-sm text-gray-900 px-2">
                                                        <span>Total:</span>
                                                        <span className="text-green-600">
                                                            Rp{" "}
                                                            {Number(
                                                                item.total_biaya,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </span>
                                                    </div>
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
                                                <td className="px-6 py-4 border-b text-center">
                                                    {item.status_approval ===
                                                    "Pending" ? (
                                                        <div className="flex justify-center items-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleAction(
                                                                        item.id,
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
                                                                        item.id,
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
