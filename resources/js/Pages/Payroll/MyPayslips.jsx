import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function MyPayslips({ payrolls }) {
    const getNamaBulan = (angka) => {
        const bulan = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
        ];
        return bulan[angka - 1];
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Riwayat Slip Gaji
                </h2>
            }
        >
            <Head title="Slip Gaji Saya" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {payrolls.length === 0 ? (
                                <div className="col-span-3 text-center py-12 text-gray-500 bg-gray-50 rounded border border-dashed">
                                    Belum ada slip gaji yang diterbitkan untuk
                                    Anda.
                                </div>
                            ) : (
                                payrolls.map((p) => (
                                    <div
                                        key={p.id}
                                        className="border rounded-lg p-5 shadow-sm hover:shadow-md transition bg-gradient-to-br from-white to-gray-50"
                                    >
                                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                {getNamaBulan(p.periode_bulan)}{" "}
                                                {p.periode_tahun}
                                            </h3>
                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                                Resmi
                                            </span>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                Take Home Pay
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                Rp{" "}
                                                {Number(
                                                    p.total_gaji_bersih,
                                                ).toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                        <Link
                                            href={route("slip.show", p.id)}
                                            className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition"
                                        >
                                            Buka Slip Gaji
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
