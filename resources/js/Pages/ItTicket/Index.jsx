import React from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Index({ tickets }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        judul: "",
        modul: "Hardware",
        deskripsi: "",
        prioritas: "Sedang",
        file_lampiran: null,
    });

    const { flash } = usePage().props;

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("ticket.store"), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    // =========================================================
    // PRIORITAS STYLE
    // =========================================================
    const getPrioritasStyle = (prioritas) => {
        const p = prioritas?.toLowerCase() || "";

        if (
            p.includes("darurat") ||
            p.includes("high") ||
            p.includes("tinggi")
        ) {
            return "bg-rose-50 text-rose-600 border-rose-100";
        }

        if (p.includes("sedang") || p.includes("medium")) {
            return "bg-amber-50 text-amber-600 border-amber-100";
        }

        return "bg-emerald-50 text-emerald-600 border-emerald-100";
    };

    return (
        <AuthenticatedLayout>
            <Head title="IT Ticket" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* =====================================================
                    HEADER
                ====================================================== */}
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[72px] items-center justify-center py-4 sm:min-h-[76px]">
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>

                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    IT Support Ticket
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}
                <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-5 lg:px-8">
                    {/* =================================================
                        FLASH SUCCESS
                    ================================================== */}
                    {flash?.success && (
                        <div
                            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:text-sm"
                            role="alert"
                        >
                            <span className="mt-0.5 font-bold">✓</span>

                            <span className="leading-relaxed">
                                {flash.success}
                            </span>
                        </div>
                    )}

                    {/* =================================================
                        FORM TIKET
                    ================================================== */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <span className="absolute left-0 top-0 h-full w-1 bg-[#F3B817]" />

                        {/* TITLE */}
                        <div className="mb-4 flex items-center gap-3 sm:mb-5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3EDF8] text-[#431D6D] sm:h-10 sm:w-10 sm:rounded-xl">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                                    Buat Tiket Baru
                                </h3>

                                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                                    Laporkan kendala perangkat atau sistem kepada tim IT.
                                </p>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2"
                        >
                            {/* JUDUL */}
                            <div className="min-w-0">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                                    Judul Kendala
                                </label>

                                <input
                                    type="text"
                                    value={data.judul}
                                    onChange={(e) =>
                                        setData("judul", e.target.value)
                                    }
                                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#431D6D] focus:ring focus:ring-[#431D6D]/20 sm:mt-2"
                                    placeholder="Contoh: Printer Rusak / Lupa Password"
                                    required
                                />

                                {errors.judul && (
                                    <div className="mt-1.5 text-xs font-medium text-rose-500">
                                        {errors.judul}
                                    </div>
                                )}
                            </div>

                            {/* MODUL */}
                            <div className="min-w-0">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                                    Kategori / Modul
                                </label>

                                <select
                                    value={data.modul}
                                    onChange={(e) =>
                                        setData("modul", e.target.value)
                                    }
                                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#431D6D] focus:ring focus:ring-[#431D6D]/20 sm:mt-2"
                                >
                                    <option value="Hardware">
                                        Hardware (Perangkat Keras)
                                    </option>
                                    <option value="Software">
                                        Software (Aplikasi)
                                    </option>
                                    <option value="Jaringan">
                                        Jaringan / Internet
                                    </option>
                                    <option value="Akun">
                                        Akun / Akses Login
                                    </option>
                                </select>
                            </div>

                            {/* DESKRIPSI */}
                            <div className="min-w-0 md:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                                    Deskripsi Detail
                                </label>

                                <textarea
                                    rows="3"
                                    value={data.deskripsi}
                                    onChange={(e) =>
                                        setData("deskripsi", e.target.value)
                                    }
                                    className="mt-1.5 block w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#431D6D] focus:ring focus:ring-[#431D6D]/20 placeholder:text-gray-400 sm:mt-2"
                                    placeholder="Jelaskan kendala secara detail..."
                                    required
                                />

                                {errors.deskripsi && (
                                    <div className="mt-1.5 text-xs font-medium text-rose-500">
                                        {errors.deskripsi}
                                    </div>
                                )}
                            </div>

                            {/* PRIORITAS */}
                            <div className="min-w-0">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                                    Prioritas
                                </label>

                                <select
                                    value={data.prioritas}
                                    onChange={(e) =>
                                        setData("prioritas", e.target.value)
                                    }
                                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#431D6D] focus:ring focus:ring-[#431D6D]/20 sm:mt-2"
                                >
                                    <option value="Rendah">
                                        Rendah (Bisa ditunda)
                                    </option>
                                    <option value="Sedang">
                                        Sedang (Mengganggu pekerjaan)
                                    </option>
                                    <option value="Tinggi">
                                        Tinggi (Pekerjaan terhenti)
                                    </option>
                                    <option value="Darurat">
                                        Darurat (Sistem lumpuh total)
                                    </option>
                                </select>
                            </div>

                            {/* LAMPIRAN */}
                            <div className="min-w-0">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                                    Lampiran
                                    <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">
                                        (opsional)
                                    </span>
                                </label>

                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setData(
                                            "file_lampiran",
                                            e.target.files[0]
                                        )
                                    }
                                    className="mt-1.5 block w-full min-w-0 text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-[#F3EDF8] file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-[#431D6D] hover:file:bg-[#431D6D] hover:file:text-white sm:mt-2 sm:text-sm sm:file:mr-4 sm:file:px-4 sm:file:text-xs"
                                />

                                {errors.file_lampiran && (
                                    <div className="mt-1.5 text-xs font-medium text-rose-500">
                                        {errors.file_lampiran}
                                    </div>
                                )}
                            </div>

                            {/* BUTTON */}
                            <div className="mt-1 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:mt-2 sm:flex-row sm:justify-end sm:pt-5 md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#2A164E] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#431D6D] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                >
                                    {processing
                                        ? "Mengirim..."
                                        : "Kirim Tiket"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* =================================================
                        RIWAYAT TIKET
                    ================================================== */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {/* HEADER */}
                        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base font-bold text-[#2A164E] sm:text-lg">
                                    Riwayat Tiket Saya
                                </h3>

                                <span className="rounded-full bg-[#F3EDF8] px-2.5 py-1 text-[10px] font-bold text-[#431D6D]">
                                    {tickets.length} Tiket
                                </span>
                            </div>
                        </div>

                        {/* =================================================
                            MOBILE - CARD
                        ================================================== */}
                        <div className="divide-y divide-slate-100 md:hidden">
                            {tickets.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.7"
                                                d="M9 12h6m-6 4h4m5 4H6a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>

                                    <p className="text-xs font-semibold text-slate-500">
                                        Belum ada pengajuan tiket IT.
                                    </p>
                                </div>
                            ) : (
                                tickets.map((t) => (
                                    <div
                                        key={t.id}
                                        className="p-4 transition active:bg-slate-50"
                                    >
                                        {/* TOP */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="break-words text-sm font-bold leading-snug text-slate-900">
                                                    {t.judul}
                                                </h4>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <span className="text-[10px] font-bold text-[#431D6D]">
                                                        {t.modul}
                                                    </span>

                                                    <span className="text-[10px] text-slate-300">
                                                        •
                                                    </span>

                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(
                                                            t.created_at
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${getPrioritasStyle(
                                                    t.prioritas
                                                )}`}
                                            >
                                                {t.prioritas}
                                            </span>
                                        </div>

                                        {/* STATUS */}
                                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                                <span className="text-[11px] font-bold text-slate-700">
                                                    {t.status}
                                                </span>

                                                <span className="text-[11px] font-bold text-[#431D6D]">
                                                    {t.persentase_progress}%
                                                </span>
                                            </div>

                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        t.persentase_progress ===
                                                        100
                                                            ? "bg-emerald-500"
                                                            : "bg-[#431D6D]"
                                                    }`}
                                                    style={{
                                                        width: `${t.persentase_progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* =================================================
                            DESKTOP - TABLE
                        ================================================== */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-left align-middle text-sm">
                                <thead className="bg-slate-50/80">
                                    <tr>
                                        <th className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Kendala & Kategori
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Prioritas
                                        </th>

                                        <th className="w-1/3 whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Status & Progress
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {tickets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-5 py-8 text-center"
                                            >
                                                <p className="text-sm font-semibold text-slate-500">
                                                    Belum ada pengajuan tiket IT.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="transition hover:bg-[#F7F7FA]"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="font-bold text-slate-900">
                                                        {t.judul}
                                                    </div>

                                                    <div className="mt-0.5 text-[11px] font-semibold text-[#431D6D]">
                                                        {t.modul}
                                                    </div>

                                                    <div className="mt-1 text-[11px] text-slate-400">
                                                        {new Date(
                                                            t.created_at
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getPrioritasStyle(
                                                            t.prioritas
                                                        )}`}
                                                    >
                                                        {t.prioritas}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-700">
                                                            {t.status}
                                                        </span>

                                                        <span className="font-bold text-[#431D6D]">
                                                            {
                                                                t.persentase_progress
                                                            }
                                                            %
                                                        </span>
                                                    </div>

                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                t.persentase_progress ===
                                                                100
                                                                    ? "bg-emerald-500"
                                                                    : "bg-[#431D6D]"
                                                            }`}
                                                            style={{
                                                                width: `${t.persentase_progress}%`,
                                                            }}
                                                        />
                                                    </div>
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