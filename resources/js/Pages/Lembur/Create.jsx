import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: "",
        jam_mulai: "17:00",
        jam_selesai: "19:00",
        deskripsi_pekerjaan: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("lembur.store"));
    };

    return (
        <AuthenticatedLayout user={undefined}>
            <Head title="Ajukan Lembur" />

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
                                    Form Pengajuan Lembur
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* ERROR */}
                    {errors.error && (
                        <div
                            className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                            role="alert"
                        >
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
                                    Pengajuan Ditolak
                                </p>

                                <p className="mt-0.5 text-[11px] leading-relaxed text-red-600 sm:text-xs">
                                    {errors.error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* MAIN CARD */}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        {/* CARD HEADER */}
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-bold text-[#2A164E]">
                                Lengkapi Data Lembur
                            </h2>
                        </div>

                        <form onSubmit={submit}>
                            <div className="space-y-7 p-5 sm:p-6">
                                {/* WAKTU LEMBUR */}
                                <div>
                                    <h3 className="mb-4 text-sm font-bold text-[#431D6D]">
                                        Waktu Lembur
                                    </h3>

                                    <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        {/* TANGGAL */}
                                        <div>
                                            <label
                                                htmlFor="tanggal"
                                                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                            >
                                                Tanggal{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="tanggal"
                                                type="date"
                                                value={data.tanggal}
                                                onChange={(e) =>
                                                    setData(
                                                        "tanggal",
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                required
                                            />

                                            {errors.tanggal && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.tanggal}
                                                </p>
                                            )}
                                        </div>

                                        {/* JAM */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label
                                                    htmlFor="jam_mulai"
                                                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                                >
                                                    Jam Mulai{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    id="jam_mulai"
                                                    type="time"
                                                    value={data.jam_mulai}
                                                    onChange={(e) =>
                                                        setData(
                                                            "jam_mulai",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                    required
                                                />

                                                {errors.jam_mulai && (
                                                    <p className="mt-1 text-xs font-semibold text-red-500">
                                                        {errors.jam_mulai}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="jam_selesai"
                                                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                                >
                                                    Jam Selesai{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    id="jam_selesai"
                                                    type="time"
                                                    value={data.jam_selesai}
                                                    onChange={(e) =>
                                                        setData(
                                                            "jam_selesai",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                    required
                                                />

                                                {errors.jam_selesai && (
                                                    <p className="mt-1 text-xs font-semibold text-red-500">
                                                        {errors.jam_selesai}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* QUICK PRESET */}
                                        <div>
                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Pilihan Waktu Cepat
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData(
                                                            "jam_mulai",
                                                            "17:00",
                                                        );
                                                        setData(
                                                            "jam_selesai",
                                                            "19:00",
                                                        );
                                                    }}
                                                    className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                                                        data.jam_mulai ===
                                                            "17:00" &&
                                                        data.jam_selesai ===
                                                            "19:00"
                                                            ? "border-[#431D6D] bg-[#F3EDF8] text-[#431D6D]"
                                                            : "border-gray-200 bg-white text-gray-600 hover:border-[#431D6D]/30 hover:bg-[#F7F3FA]"
                                                    }`}
                                                >
                                                    17:00 - 19:00
                                                    <span className="ml-1 text-gray-400">
                                                        · 2 Jam
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData(
                                                            "jam_mulai",
                                                            "17:00",
                                                        );
                                                        setData(
                                                            "jam_selesai",
                                                            "21:00",
                                                        );
                                                    }}
                                                    className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                                                        data.jam_mulai ===
                                                            "17:00" &&
                                                        data.jam_selesai ===
                                                            "21:00"
                                                            ? "border-[#431D6D] bg-[#F3EDF8] text-[#431D6D]"
                                                            : "border-gray-200 bg-white text-gray-600 hover:border-[#431D6D]/30 hover:bg-[#F7F3FA]"
                                                    }`}
                                                >
                                                    17:00 - 21:00
                                                    <span className="ml-1 text-gray-400">
                                                        · 4 Jam
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PEKERJAAN */}
                                <div>
                                    <h3 className="mb-4 text-sm font-bold text-[#431D6D]">
                                        Pekerjaan
                                    </h3>

                                    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        <label
                                            htmlFor="deskripsi_pekerjaan"
                                            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                        >
                                            Deskripsi Pekerjaan{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            id="deskripsi_pekerjaan"
                                            rows="4"
                                            value={data.deskripsi_pekerjaan}
                                            onChange={(e) =>
                                                setData(
                                                    "deskripsi_pekerjaan",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Jelaskan pekerjaan yang dilakukan selama lembur..."
                                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                            required
                                        />

                                        {errors.deskripsi_pekerjaan && (
                                            <p className="mt-1 text-xs font-semibold text-red-500">
                                                {errors.deskripsi_pekerjaan}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                                <Link
                                    href={route("lembur.index")}
                                    className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Batal
                                </Link>

                                <button
                                    type="submit"
                                    disabled={processing}
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