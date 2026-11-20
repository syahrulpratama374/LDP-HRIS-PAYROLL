import React from "react";
import { Head } from "@inertiajs/react";
import formatRupiah from "@/Utils/formatRupiah";
import { formatRentangTanggal, formatTanggal } from "@/Utils/spj";

// Halaman publik dari QR di PDF SPJ: membuktikan SPJ resmi terbit. Tidak menampilkan rekening.
export default function Verifikasi({ spj, pesertas = [], approvals = [] }) {
    const Baris = ({ label, children }) => (
        <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">{label}</p>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">{children}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Head title={`Verifikasi SPJ ${spj.nomor_surat}`} />

            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-emerald-600 p-6 text-white text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-emerald-600 rounded-full shadow-lg mb-3">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-extrabold tracking-wide uppercase">SPJ Resmi Terverifikasi</h1>
                    <p className="text-emerald-100 text-xs mt-1">SPJ Biaya Perjalanan Dinas — PT Lintas Data Prima</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-700">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Nomor SPJ</p>
                            <p className="font-mono font-bold text-indigo-700 text-sm mt-0.5">{spj.nomor_surat}</p>
                        </div>
                        <Baris label="Status">{spj.status}</Baris>
                        <Baris label="Tujuan">{spj.tujuan}</Baris>
                        <Baris label="Tanggal Perjalanan">
                            {formatRentangTanggal(spj.tgl_berangkat, spj.tgl_pulang)} ({spj.jumlah_hari} hari)
                        </Baris>
                        <Baris label="Keperluan">{spj.keperluan}</Baris>
                        <Baris label="Tanggal Terbit">{formatTanggal(spj.tanggal_terbit)}</Baris>
                        <Baris label="Total Uang Harian">{formatRupiah(spj.total_uang_harian)}</Baris>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">Peserta</h3>
                        <ol className="list-decimal pl-5 space-y-1">
                            {pesertas.map((p, i) => (
                                <li key={i}>
                                    <span className="font-semibold">{p.nama}</span>
                                    {p.posisi && <span className="text-slate-500"> — {p.posisi}</span>}
                                    {p.departemen && <span className="text-slate-400"> ({p.departemen})</span>}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">Riwayat Persetujuan</h3>
                        <div className="space-y-2">
                            {approvals.map((a, i) => (
                                <div key={i} className="flex flex-wrap justify-between gap-2 border rounded-lg px-3 py-2">
                                    <div>
                                        <div className="text-xs uppercase text-slate-400 font-semibold">{a.label}</div>
                                        <div className="font-semibold">{a.nama ?? "-"}</div>
                                        {a.posisi && <div className="text-xs text-slate-500">{a.posisi}</div>}
                                    </div>
                                    <div className="text-right text-xs">
                                        <div className={a.status === "Disetujui" ? "text-emerald-700 font-semibold" : "text-slate-500"}>{a.status}</div>
                                        {a.waktu && <div className="text-slate-400">{a.waktu}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
