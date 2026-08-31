import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";

export default function Index({ payrolls, filters }) {
    // State untuk filter bulan dan tahun tampilan tabel
    const [bulanTampil, setBulanTampil] = useState(
        filters.bulan || new Date().getMonth() + 1,
    );
    const [tahunTampil, setTahunTampil] = useState(
        filters.tahun || new Date().getFullYear(),
    );

    // Form untuk men-generate payroll baru
    const { data, setData, post, processing } = useForm({
        periode_bulan: new Date().getMonth() + 1,
        periode_tahun: new Date().getFullYear(),
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(
            route("admin.payroll.index"),
            { bulan: bulanTampil, tahun: tahunTampil },
            { preserveState: true },
        );
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        if (
            confirm(
                `Peringatan: Aksi ini akan mengalkulasi ulang semua data kehadiran, SPJ, dan Kasbon Karyawan untuk periode Bulan ${data.periode_bulan} Tahun ${data.periode_tahun}. Lanjutkan?`,
            )
        ) {
            post(route("admin.payroll.generate"), {
                onSuccess: () => {
                    // Update tampilan tabel ke bulan yang baru saja di-generate
                    setBulanTampil(data.periode_bulan);
                    setTahunTampil(data.periode_tahun);
                    router.get(route("admin.payroll.index"), {
                        bulan: data.periode_bulan,
                        tahun: data.periode_tahun,
                    });
                },
            });
        }
    };

    const handleFinalize = (id, nama) => {
        if (
            confirm(
                `Terbitkan slip gaji untuk ${nama}? Karyawan akan bisa melihat dan mengunduh slip ini.`,
            )
        ) {
            router.post(route("admin.payroll.finalize", id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Mesin Kalkulator Payroll
                </h2>
            }
        >
            <Head title="Kalkulator Payroll" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* --- PANEL KENDALI (FILTER & GENERATE) --- */}
                    <div className="bg-white shadow-sm sm:rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-indigo-600">
                        {/* Filter Data Tampil */}
                        <form
                            onSubmit={handleFilter}
                            className="flex items-center space-x-2"
                        >
                            <span className="text-sm font-medium text-gray-700">
                                Tampilkan Data:
                            </span>
                            <select
                                value={bulanTampil}
                                onChange={(e) => setBulanTampil(e.target.value)}
                                className="border-gray-300 rounded-md text-sm"
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Bulan {i + 1}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={tahunTampil}
                                onChange={(e) => setTahunTampil(e.target.value)}
                                className="border-gray-300 rounded-md text-sm w-24"
                            />
                            <button
                                type="submit"
                                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2 px-4 rounded shadow"
                            >
                                Filter
                            </button>
                        </form>

                        {/* Mesin Generate Payroll */}
                        <form
                            onSubmit={handleGenerate}
                            className="flex items-center space-x-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100"
                        >
                            <span className="text-sm font-medium text-indigo-900">
                                Hitung Otomatis:
                            </span>
                            <select
                                value={data.periode_bulan}
                                onChange={(e) =>
                                    setData("periode_bulan", e.target.value)
                                }
                                className="border-indigo-300 bg-white rounded-md text-sm text-indigo-900"
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Bulan {i + 1}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={data.periode_tahun}
                                onChange={(e) =>
                                    setData("periode_tahun", e.target.value)
                                }
                                className="border-indigo-300 bg-white rounded-md text-sm w-24 text-indigo-900"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition-all"
                            >
                                🚀 Generate Payroll
                            </button>
                        </form>
                    </div>

                    {/* --- TABEL DATA PAYROLL --- */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-right text-xs font-semibold text-gray-600 uppercase">
                                            Gaji Pokok & Tunjangan
                                        </th>
                                        <th className="px-6 py-3 border-b text-right text-xs font-semibold text-green-600 uppercase">
                                            + Pemasukan Variabel
                                        </th>
                                        <th className="px-6 py-3 border-b text-right text-xs font-semibold text-red-600 uppercase">
                                            - Potongan
                                        </th>
                                        <th className="px-6 py-3 border-b text-right text-xs font-bold text-gray-800 uppercase">
                                            Take Home Pay
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
                                    {payrolls.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="px-6 py-12 text-center text-gray-500 bg-gray-50"
                                            >
                                                <p className="text-lg mb-2">
                                                    Belum ada data penggajian
                                                    untuk periode ini.
                                                </p>
                                                <p className="text-sm">
                                                    Silakan pilih bulan/tahun
                                                    pada kotak biru di atas,
                                                    lalu tekan "Generate
                                                    Payroll".
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        payrolls.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-gray-50 transition border-b last:border-b-0"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-800">
                                                        {p.karyawan
                                                            ? p.karyawan
                                                                  .nama_lengkap
                                                            : "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {p.karyawan?.departemen
                                                            ? p.karyawan
                                                                  .departemen
                                                                  .nama_departemen
                                                            : "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                    Rp{" "}
                                                    {Number(
                                                        p.gaji_pokok_saat_itu,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-green-600">
                                                    Rp{" "}
                                                    {Number(
                                                        p.total_pemasukan -
                                                            p.gaji_pokok_saat_itu,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-red-600">
                                                    Rp{" "}
                                                    {Number(
                                                        p.total_potongan,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 bg-gray-50">
                                                    Rp{" "}
                                                    {Number(
                                                        p.total_gaji_bersih,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${p.status === "Draft" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {p.status === "Draft" ? (
                                                        <button
                                                            onClick={() =>
                                                                handleFinalize(
                                                                    p.id,
                                                                    p.karyawan
                                                                        .nama_lengkap,
                                                                )
                                                            }
                                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                        >
                                                            Finalisasi
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-green-600 font-bold">
                                                            ✔ Diterbitkan
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
