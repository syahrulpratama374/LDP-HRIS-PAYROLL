import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";

export default function CreateCuti({ auth, saldoCuti }) {
    const { data, setData, post, processing, errors } = useForm({
        jenis_cuti: "Tahunan",
        tanggal_mulai: "",
        tanggal_selesai: "",
        alasan: "",
        dokumen_bukti: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("cuti.store"));
    };

    const sisaCuti = saldoCuti
        ? saldoCuti.hak_cuti_tahunan - saldoCuti.cuti_terpakai
        : 0;

    const hitungJumlahHari = () => {
        if (!data.tanggal_mulai || !data.tanggal_selesai) return 0;

        const mulai = new Date(data.tanggal_mulai);
        const selesai = new Date(data.tanggal_selesai);

        if (isNaN(mulai) || isNaN(selesai)) return 0;
        if (selesai < mulai) return 0;

        return Math.floor((selesai - mulai) / (1000 * 60 * 60 * 24)) + 1;
    };

    const jumlahHari = hitungJumlahHari();
    const sisaSetelahPengajuan = Math.max(sisaCuti - jumlahHari, 0);
    const melebihiKuota = jumlahHari > sisaCuti && jumlahHari > 0;

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Ajukan Cuti" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[76px] items-center justify-center py-4">
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>

                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    Form Pengajuan Cuti
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* MAIN CARD */}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-bold text-[#2A164E]">
                                Lengkapi Data Cuti
                            </h2>
                        </div>

                        <form onSubmit={submit}>
                            <div className="space-y-7 p-5 sm:p-6">
                                {/* JENIS CUTI */}
                                <div>
                                    <h3 className="mb-4 text-sm font-bold text-[#431D6D]">
                                        Informasi Cuti
                                    </h3>

                                    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                            Jenis Cuti{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            id="jenis_cuti"
                                            value={data.jenis_cuti}
                                            onChange={(e) =>
                                                setData(
                                                    "jenis_cuti",
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                            required
                                        >
                                            <option value="Tahunan">
                                                Cuti Tahunan
                                            </option>
                                            <option value="Sakit">Sakit</option>
                                            <option value="Menikah">
                                                Izin Menikah
                                            </option>
                                            <option value="Melahirkan">
                                                Cuti Melahirkan
                                            </option>
                                            <option value="Urusan Keluarga">
                                                Urusan Keluarga
                                            </option>
                                        </select>

                                        {errors.jenis_cuti && (
                                            <p className="mt-1 text-xs font-semibold text-red-500">
                                                {errors.jenis_cuti}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* SALDO & PERIODE */}
                                <div>
                                    <h3 className="mb-4 text-sm font-bold text-[#431D6D]">
                                        Periode Cuti
                                    </h3>

                                    <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        {/* SALDO */}
                                        <div className="flex items-center justify-between rounded-lg border border-[#F3B817]/30 bg-[#F3B817]/10 px-4 py-3">
                                            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
                                                Sisa Cuti
                                            </span>

                                            <span className="text-lg font-extrabold text-[#2A164E]">
                                                {sisaCuti}{" "}
                                                <span className="text-xs font-medium text-gray-500">
                                                    Hari
                                                </span>
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {/* MULAI */}
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                    Tanggal Mulai{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    type="date"
                                                    value={data.tanggal_mulai}
                                                    onChange={(e) =>
                                                        setData(
                                                            "tanggal_mulai",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                    required
                                                />

                                                {errors.tanggal_mulai && (
                                                    <p className="mt-1 text-xs font-semibold text-red-500">
                                                        {errors.tanggal_mulai}
                                                    </p>
                                                )}
                                            </div>

                                            {/* SELESAI */}
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                    Tanggal Selesai{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    type="date"
                                                    value={data.tanggal_selesai}
                                                    onChange={(e) =>
                                                        setData(
                                                            "tanggal_selesai",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                    required
                                                />

                                                {errors.tanggal_selesai && (
                                                    <p className="mt-1 text-xs font-semibold text-red-500">
                                                        {errors.tanggal_selesai}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* RINGKASAN */}
                                        <div className="grid grid-cols-3 gap-3 rounded-lg bg-[#F7F7FA] px-4 py-3">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                                                    Sisa
                                                </p>
                                                <p className="mt-0.5 text-base font-bold text-[#2A164E]">
                                                    {sisaCuti}
                                                    <span className="ml-1 text-[10px] font-medium text-gray-500">
                                                        Hari
                                                    </span>
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                                                    Diajukan
                                                </p>
                                                <p className="mt-0.5 text-base font-bold text-[#431D6D]">
                                                    {jumlahHari}
                                                    <span className="ml-1 text-[10px] font-medium text-gray-500">
                                                        Hari
                                                    </span>
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                                                    Sisa Akhir
                                                </p>
                                                <p
                                                    className={`mt-0.5 text-base font-bold ${
                                                        melebihiKuota
                                                            ? "text-red-600"
                                                            : "text-[#2A164E]"
                                                    }`}
                                                >
                                                    {sisaSetelahPengajuan}
                                                    <span className="ml-1 text-[10px] font-medium text-gray-500">
                                                        Hari
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {melebihiKuota && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                                <p className="text-xs font-bold text-red-700">
                                                    Kuota cuti tidak mencukupi
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ALASAN & DOKUMEN */}
                                <div>
                                    <h3 className="mb-4 text-sm font-bold text-[#431D6D]">
                                        Keterangan
                                    </h3>

                                    <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        {/* ALASAN */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Alasan{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <textarea
                                                rows="3"
                                                value={data.alasan}
                                                onChange={(e) =>
                                                    setData(
                                                        "alasan",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Jelaskan alasan pengajuan cuti..."
                                                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                required
                                            />

                                            {errors.alasan && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.alasan}
                                                </p>
                                            )}
                                        </div>

                                        {/* DOKUMEN */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Dokumen Bukti{" "}
                                                <span className="font-normal normal-case text-gray-400">
                                                    (Opsional)
                                                </span>
                                            </label>

                                            <input
                                                id="dokumen_bukti"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) =>
                                                    setData(
                                                        "dokumen_bukti",
                                                        e.target.files[0],
                                                    )
                                                }
                                                className="block w-full cursor-pointer rounded-lg border border-gray-200 bg-[#F7F7FA] text-xs text-gray-500 file:mr-3 file:border-0 file:bg-[#2A164E] file:px-3.5 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#431D6D]"
                                            />

                                            {errors.dokumen_bukti && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.dokumen_bukti}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* PERHATIAN */}
                                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 8v4m0 4h.01M10.3 3.5l-7.2 12.5A2 2 0 004.8 19h14.4a2 2 0 001.7-3L13.7 3.5a2 2 0 00-3.4 0z"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-red-700">
                                            Perhatian!
                                        </p>

                                        <p className="mt-0.5 text-[11px] leading-relaxed text-red-600">
                                            Pastikan jenis cuti, periode,
                                            alasan, dan dokumen pendukung sudah
                                            sesuai sebelum pengajuan dikirim.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                                <Link
                                    href={route("cuti.index")}
                                    className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Batal
                                </Link>

                                <button
                                    type="submit"
                                    disabled={processing || melebihiKuota}
                                    className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg bg-[#2A164E] px-6 text-sm font-semibold text-white transition hover:bg-[#431D6D] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {processing
                                        ? "Memproses..."
                                        : "Kirim Pengajuan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
