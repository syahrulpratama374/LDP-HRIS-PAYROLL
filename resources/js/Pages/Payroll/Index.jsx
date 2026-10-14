import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, Link } from "@inertiajs/react";

export default function Index({ payrolls, filters }) {
    const [bulanTampil, setBulanTampil] = useState(
        filters.bulan || new Date().getMonth() + 1,
    );
    const [tahunTampil, setTahunTampil] = useState(
        filters.tahun || new Date().getFullYear(),
    );

    // State untuk Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    const { data, setData, post, processing } = useForm({
        periode_bulan: new Date().getMonth() + 1,
        periode_tahun: new Date().getFullYear(),
    });

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

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
                `Aksi ini akan menyedot semua data kehadiran, Lembur, SPJ, dan Kasbon Karyawan untuk dikalkulasi menjadi Gaji. Lanjutkan?`,
            )
        ) {
            post(route("admin.payroll.generate"), {
                onSuccess: () => {
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
                `Terbitkan slip gaji untuk ${nama}? Karyawan akan bisa melihat dan mengunduh slip PDF di dasbornya.`,
            )
        ) {
            router.post(route("admin.payroll.finalize", id));
        }
    };

    const openDetailModal = (payroll) => {
        setSelectedPayroll(payroll);
        setShowDetailModal(true);
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
                    {/* PANEL KENDALI */}
                    <div className="bg-white shadow-sm sm:rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-indigo-600">
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

                    {/* TABEL DATA PAYROLL */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Karyawan
                                        </th>
                                        <th className="px-6 py-3 border-b text-right text-xs font-semibold text-gray-600 uppercase">
                                            Gaji Pokok
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
                                            Status & Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-12 text-center text-gray-500 bg-gray-50"
                                            >
                                                <p className="text-lg mb-2">
                                                    Belum ada data penggajian
                                                    untuk periode ini.
                                                </p>
                                                <p className="text-sm">
                                                    Silakan pilih bulan/tahun
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
                                                        {
                                                            p.karyawan
                                                                ?.nama_lengkap
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {
                                                            p.karyawan
                                                                ?.departemen
                                                                ?.nama_departemen
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                    {formatRupiah(
                                                        p.gaji_pokok_saat_itu,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-green-600">
                                                    {formatRupiah(
                                                        p.total_pemasukan -
                                                            p.gaji_pokok_saat_itu,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-red-600">
                                                    {formatRupiah(
                                                        p.total_potongan,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 bg-gray-50">
                                                    {formatRupiah(
                                                        p.total_gaji_bersih,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            openDetailModal(p)
                                                        }
                                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                    >
                                                        Detail
                                                    </button>

                                                    {p.status === "Draft" ? (
                                                        <button
                                                            onClick={() =>
                                                                handleFinalize(
                                                                    p.id,
                                                                    p.karyawan
                                                                        .nama_lengkap,
                                                                )
                                                            }
                                                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                        >
                                                            Publish
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-green-600 font-bold ml-2">
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

            {/* Modal Detail Slip Gaji */}
            {showDetailModal && selectedPayroll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Draft Slip Gaji:{" "}
                                {selectedPayroll.karyawan?.nama_lengkap}
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-500 hover:text-red-500 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-green-700 border-b border-green-200 pb-1 mb-2">
                                    Pemasukan
                                </h4>
                                {selectedPayroll.detail_payrolls
                                    .filter((d) => d.jenis === "Pemasukan")
                                    .map((detail) => (
                                        <div
                                            key={detail.id}
                                            className="flex justify-between text-sm py-1"
                                        >
                                            <span className="text-gray-700">
                                                {detail.nama_komponen_snapshot}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {formatRupiah(detail.nominal)}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            <div>
                                <h4 className="font-bold text-red-700 border-b border-red-200 pb-1 mb-2 mt-4">
                                    Potongan
                                </h4>
                                {selectedPayroll.detail_payrolls
                                    .filter((d) => d.jenis === "Potongan")
                                    .map((detail) => (
                                        <div
                                            key={detail.id}
                                            className="flex justify-between text-sm py-1"
                                        >
                                            <span className="text-gray-700">
                                                {detail.nama_komponen_snapshot}
                                            </span>
                                            <span className="font-medium text-red-600">
                                                - {formatRupiah(detail.nominal)}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            <div className="bg-gray-100 p-4 rounded-md mt-6 flex justify-between items-center border border-gray-300">
                                <span className="font-bold text-gray-800 text-lg">
                                    Take Home Pay
                                </span>
                                <span className="font-bold text-2xl text-indigo-700">
                                    {formatRupiah(
                                        selectedPayroll.total_gaji_bersih,
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                Tutup Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
