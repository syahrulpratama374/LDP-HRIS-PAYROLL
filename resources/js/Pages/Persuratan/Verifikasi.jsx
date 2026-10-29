import React from "react";
import { Head } from "@inertiajs/react";

export default function Verifikasi({ surat, layout }) {
    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Head title={`Verifikasi Surat #${surat.nomor_surat}`} />

            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                {/* HEADER VALIDASI */}
                <div className="bg-emerald-600 p-6 text-white text-center relative">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-emerald-600 rounded-full shadow-lg mb-3">
                        <svg
                            className="w-10 h-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="text-xl font-extrabold tracking-wide uppercase">
                        Dokumen Resmi Terverifikasi
                    </h1>
                    <p className="text-emerald-100 text-xs mt-1">
                        Sistem Validasi Forensik E-Persuratan PT Lintas Data
                        Prima
                    </p>
                </div>

                <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-700">
                    {/* METADATA PERUSAHAAN */}
                    <div className="border-b pb-4 text-center">
                        <h2 className="font-bold text-base text-slate-900 uppercase">
                            {layout?.nama_perusahaan || "PT. LINTAS DATA PRIMA"}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {layout?.slogan ||
                                "Telecommunication & IT Managed Services"}
                        </p>
                    </div>

                    {/* DETAIL SURAT */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">
                                Nomor Surat Resmi
                            </p>
                            <p className="font-mono font-bold text-indigo-700 text-sm mt-0.5">
                                {surat.nomor_surat}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">
                                Jenis / Nama Template
                            </p>
                            <p className="font-semibold text-slate-800 text-sm mt-0.5">
                                {surat.template?.nama_template}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">
                                Penerima / Karyawan
                            </p>
                            <p className="font-semibold text-slate-800 text-sm mt-0.5">
                                {surat.karyawan?.nama_lengkap} (
                                {surat.karyawan?.nik_internal})
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">
                                Tanggal Penerbitan
                            </p>
                            <p className="font-semibold text-slate-800 text-sm mt-0.5">
                                {surat.tanggal_terbit
                                    ? new Date(
                                          surat.tanggal_terbit,
                                      ).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                      })
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    {/* RIWAYAT PENANDATANGAN */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-wider">
                            Daftar Pejabat Penandatangan Sah
                        </h3>
                        <div className="space-y-2">
                            {surat.approvals && surat.approvals.length > 0 ? (
                                surat.approvals.map((appr) => (
                                    <div
                                        key={appr.id}
                                        className="flex justify-between items-center bg-emerald-50/60 p-3 rounded-lg border border-emerald-100"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs">
                                                {appr.label_ttd}
                                            </p>
                                            <p className="text-xs text-emerald-800 font-medium">
                                                {appr.user_aktual?.name || "-"}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {appr.jabatan?.nama_jabatan}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                                VALIDATED
                                            </span>
                                            {appr.waktu_approval && (
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {new Date(
                                                        appr.waktu_approval,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">
                                    Disetujui secara otomatis oleh sistem.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4 text-center text-[11px] text-slate-400">
                        Dokumen ini diterbitkan secara elektronik oleh HRIS PT
                        Lintas Data Prima dan dinyatakan sah tanpa memerlukan
                        stempel basah manual.
                    </div>
                </div>
            </div>
        </div>
    );
}
