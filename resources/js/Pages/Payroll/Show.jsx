import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import formatRupiah from "@/Utils/formatRupiah";

export default function Show({ payroll }) {
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

    const handlePrint = () => {
        window.print();
    };

    // Filter komponen
    const pemasukan = payroll.detail_payrolls.filter(
        (d) => d.jenis === "Pemasukan",
    );
    const potongan = payroll.detail_payrolls.filter(
        (d) => d.jenis === "Potongan",
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight print:hidden">
                    Detail Slip Gaji
                </h2>
            }
        >
            <Head title={`Slip Gaji ${getNamaBulan(payroll.periode_bulan)}`} />

            <div className="py-12 print:py-0">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Tombol Print (Sembunyi saat dicetak) */}
                    <div className="mb-4 flex justify-end gap-2 print:hidden">
                        <a
                            href={route("slip.download", payroll.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow flex items-center gap-2"
                        >
                            Unduh PDF
                        </a>
                        <button
                            onClick={handlePrint}
                            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded shadow flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                ></path>
                            </svg>
                            Cetak / Simpan PDF
                        </button>
                    </div>

                    {/* Dokumen Kertas Slip Gaji */}
                    <div className="bg-white shadow-lg sm:rounded-lg p-10 print:shadow-none print:p-0 print:border-none border">
                        {/* KOP SURAT */}
                        <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                    LDP HRIS PAYROLL
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Jl. Teknologi No. 1, Kediri, Jawa Timur
                                </p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
                                    Slip Gaji
                                </h2>
                                <p className="text-gray-600 font-semibold mt-1">
                                    Periode:{" "}
                                    {getNamaBulan(payroll.periode_bulan)}{" "}
                                    {payroll.periode_tahun}
                                </p>
                            </div>
                        </div>

                        {/* DATA KARYAWAN */}
                        <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded border border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                    Nama Karyawan
                                </p>
                                <p className="font-bold text-gray-900">
                                    {payroll.karyawan.nama_lengkap}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                    Departemen / Jabatan
                                </p>
                                <p className="font-bold text-gray-900">
                                    {
                                        payroll.karyawan.departemen
                                            ?.nama_departemen
                                    }{" "}
                                    / {payroll.karyawan.jabatan?.nama_jabatan}
                                </p>
                            </div>
                        </div>

                        {/* RINCIAN KOMPONEN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Kiri: Pemasukan */}
                            <div>
                                <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3 text-sm uppercase tracking-wider">
                                    Pemasukan
                                </h3>
                                <ul className="space-y-2">
                                    {pemasukan.map((p) => (
                                        <li
                                            key={p.id}
                                            className="flex justify-between text-sm"
                                        >
                                            <span className="text-gray-700">
                                                {p.nama_komponen_snapshot}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                Rp{" "}
                                                {Number(
                                                    p.nominal,
                                                ).toLocaleString("id-ID")}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between border-t border-gray-300 mt-4 pt-2 font-bold text-sm">
                                    <span>Total Pemasukan</span>
                                    <span className="text-green-600">
                                        Rp{" "}
                                        {Number(
                                            payroll.total_pemasukan,
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            {/* Kanan: Potongan */}
                            <div>
                                <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3 text-sm uppercase tracking-wider">
                                    Potongan
                                </h3>
                                <ul className="space-y-2">
                                    {potongan.length === 0 && (
                                        <li className="text-sm text-gray-400 italic">
                                            - Tidak ada potongan -
                                        </li>
                                    )}
                                    {potongan.map((p) => (
                                        <li
                                            key={p.id}
                                            className="flex justify-between text-sm"
                                        >
                                            <span className="text-gray-700">
                                                {p.nama_komponen_snapshot}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                Rp{" "}
                                                {Number(
                                                    p.nominal,
                                                ).toLocaleString("id-ID")}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between border-t border-gray-300 mt-4 pt-2 font-bold text-sm">
                                    <span>Total Potongan</span>
                                    <span className="text-red-600">
                                        Rp{" "}
                                        {Number(
                                            payroll.total_potongan,
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RINCIAN PPh 21 & BPJS PERUSAHAAN */}
                        {payroll.rincian_pajak && (
                            <div className="mb-6 border border-gray-200 rounded p-4 text-xs text-gray-600">
                                <h3 className="font-bold text-gray-800 uppercase tracking-wider mb-2">
                                    Rincian PPh 21 — {payroll.rincian_pajak.metode}
                                    {payroll.rincian_pajak.kategori &&
                                        ` (Kategori ${payroll.rincian_pajak.kategori})`}
                                </h3>
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                                    {payroll.rincian_pajak.bruto_bulanan !==
                                        undefined && (
                                        <>
                                            <dt>Penghasilan bruto bulan ini</dt>
                                            <dd className="text-right">
                                                {formatRupiah(payroll.rincian_pajak.bruto_bulanan)}
                                            </dd>
                                            <dt>Tarif efektif (TER)</dt>
                                            <dd className="text-right">
                                                {payroll.rincian_pajak.tarif}%
                                            </dd>
                                        </>
                                    )}
                                    {payroll.rincian_pajak.bruto_setahun !==
                                        undefined && (
                                        <>
                                            <dt>Bruto setahun</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.bruto_setahun)}</dd>
                                            <dt>Biaya jabatan</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.biaya_jabatan)}</dd>
                                            <dt>Iuran JHT + JP setahun</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.iuran_pensiun)}</dd>
                                            <dt>PTKP</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.ptkp)}</dd>
                                            <dt>PKP</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.pkp)}</dd>
                                            <dt>PPh 21 setahun (Pasal 17)</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.pph_setahun)}</dd>
                                            <dt>Dikurangi PPh Jan–Nov</dt>
                                            <dd className="text-right">{formatRupiah(payroll.rincian_pajak.pph_jan_nov)}</dd>
                                        </>
                                    )}
                                    <dt className="font-bold">PPh 21 dipotong</dt>
                                    <dd className="text-right font-bold">{formatRupiah(payroll.pph21)}</dd>
                                    <dt>Iuran BPJS porsi perusahaan (info)</dt>
                                    <dd className="text-right">{formatRupiah(payroll.bpjs_perusahaan)}</dd>
                                </dl>
                            </div>
                        )}

                        {/* TOTAL TAKE HOME PAY */}
                        <div className="bg-gray-800 text-white rounded p-6 flex justify-between items-center print:border print:border-gray-800 print:bg-white print:text-black">
                            <div>
                                <h3 className="text-sm uppercase tracking-wider text-gray-300 print:text-gray-600">
                                    Gaji Bersih (Take Home Pay)
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 print:text-gray-500">
                                    Ditransfer ke rekening karyawan terdaftar.
                                </p>
                            </div>
                            <div className="text-3xl font-black">
                                Rp{" "}
                                {Number(
                                    payroll.total_gaji_bersih,
                                ).toLocaleString("id-ID")}
                            </div>
                        </div>

                        {/* TTD */}
                        <div className="mt-16 flex justify-end">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-16">
                                    Finance & HC Manager
                                </p>
                                <p className="font-bold text-gray-900 uppercase underline">
                                    Syahrul Pratama
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
