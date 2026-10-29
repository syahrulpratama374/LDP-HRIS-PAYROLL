import React, { useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create({ auth, karyawan, departemen }) {
    const { data, setData, post, processing, errors } = useForm({
        jenis_kasbon: "Finance", // Default ke Finance
        total_pinjaman: "",
        tenor_bulan: "1",
        alasan_pinjaman: "",
    });

    // =========================================================
    // ESTIMASI CICILAN
    // =========================================================
    const estimasiCicilan = useMemo(() => {
        const total = parseFloat(data.total_pinjaman) || 0;
        const tenor = parseInt(data.tenor_bulan, 10) || 1;
        if (total <= 0 || tenor <= 0) return 0;
        return Math.round(total / tenor);
    }, [data.total_pinjaman, data.tenor_bulan]);

    // Handle perubahan jenis kasbon
    const handleJenisKasbonChange = (jenis) => {
        setData((prev) => ({
            ...prev,
            jenis_kasbon: jenis,
            // Jika memilih Kasbon Divisi, tenor otomatis dikunci 1 bulan
            tenor_bulan: jenis === "Divisi" ? "1" : prev.tenor_bulan,
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("pinjaman.store"));
    };

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Ajukan Kasbon Baru" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[76px] items-center justify-center py-4">
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>
                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    Form Pengajuan Kasbon
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-3.5">
                            <h2 className="text-base font-bold text-[#2A164E]">
                                Lengkapi Data Kasbon
                            </h2>
                        </div>

                        <form onSubmit={submit}>
                            <div className="space-y-5 p-5">
                                {/* OPSI SUMBER DANA KASBON */}
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                        Sumber Dana Kasbon{" "}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* KASBON FINANCE */}
                                        <div
                                            onClick={() =>
                                                handleJenisKasbonChange(
                                                    "Finance",
                                                )
                                            }
                                            className={`cursor-pointer rounded-lg border p-4 transition ${
                                                data.jenis_kasbon === "Finance"
                                                    ? "border-[#431D6D] bg-[#431D6D]/5 ring-1 ring-[#431D6D]"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-[#2A164E]">
                                                    Kas Utama Finance
                                                </span>
                                                <input
                                                    type="radio"
                                                    name="jenis_kasbon"
                                                    checked={
                                                        data.jenis_kasbon ===
                                                        "Finance"
                                                    }
                                                    onChange={() =>
                                                        handleJenisKasbonChange(
                                                            "Finance",
                                                        )
                                                    }
                                                    className="text-[#431D6D] focus:ring-[#431D6D]"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Untuk pinjaman nominal
                                                sedang/besar. Pilihan tenor 1–12
                                                bulan.
                                            </p>
                                        </div>

                                        {/* KASBON DIVISI */}
                                        <div
                                            onClick={() =>
                                                handleJenisKasbonChange(
                                                    "Divisi",
                                                )
                                            }
                                            className={`cursor-pointer rounded-lg border p-4 transition ${
                                                data.jenis_kasbon === "Divisi"
                                                    ? "border-[#431D6D] bg-[#431D6D]/5 ring-1 ring-[#431D6D]"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-[#2A164E]">
                                                    Kas Divisi / Departemen
                                                </span>
                                                <input
                                                    type="radio"
                                                    name="jenis_kasbon"
                                                    checked={
                                                        data.jenis_kasbon ===
                                                        "Divisi"
                                                    }
                                                    onChange={() =>
                                                        handleJenisKasbonChange(
                                                            "Divisi",
                                                        )
                                                    }
                                                    className="text-[#431D6D] focus:ring-[#431D6D]"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Petty cash divisi (
                                                {departemen?.nama_departemen ||
                                                    "Divisi Anda"}
                                                ). Pelunasan singkat (1 bulan).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* RINCIAN KASBON */}
                                <div>
                                    <h3 className="mb-3 text-sm font-bold text-[#431D6D]">
                                        Rincian Pengajuan
                                    </h3>

                                    <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        {/* NOMINAL */}
                                        <div>
                                            <label
                                                htmlFor="total_pinjaman"
                                                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                            >
                                                Nominal Pinjaman{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                                                    Rp
                                                </span>

                                                <input
                                                    id="total_pinjaman"
                                                    type="number"
                                                    value={data.total_pinjaman}
                                                    onChange={(e) =>
                                                        setData(
                                                            "total_pinjaman",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Contoh: 1000000"
                                                    min="50000"
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                    required
                                                />
                                            </div>

                                            {errors.total_pinjaman && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.total_pinjaman}
                                                </p>
                                            )}
                                        </div>

                                        {/* TENOR */}
                                        <div>
                                            <label
                                                htmlFor="tenor_bulan"
                                                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                            >
                                                Tenor Cicilan{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                id="tenor_bulan"
                                                value={data.tenor_bulan}
                                                disabled={
                                                    data.jenis_kasbon ===
                                                    "Divisi"
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "tenor_bulan",
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20 disabled:bg-gray-100 disabled:text-gray-500"
                                                required
                                            >
                                                <option value="1">
                                                    1 Bulan
                                                </option>
                                                <option value="2">
                                                    2 Bulan
                                                </option>
                                                <option value="3">
                                                    3 Bulan
                                                </option>
                                                <option value="6">
                                                    6 Bulan
                                                </option>
                                                <option value="12">
                                                    12 Bulan
                                                </option>
                                            </select>

                                            {data.jenis_kasbon === "Divisi" && (
                                                <p className="mt-1 text-[10px] text-gray-400">
                                                    *Kasbon divisi wajib
                                                    dilunasi dalam periode 1
                                                    bulan.
                                                </p>
                                            )}

                                            {errors.tenor_bulan && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.tenor_bulan}
                                                </p>
                                            )}
                                        </div>

                                        {/* ALASAN PINJAMAN */}
                                        <div>
                                            <label
                                                htmlFor="alasan_pinjaman"
                                                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                                            >
                                                Alasan / Keperluan{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <textarea
                                                id="alasan_pinjaman"
                                                rows="3"
                                                value={data.alasan_pinjaman}
                                                onChange={(e) =>
                                                    setData(
                                                        "alasan_pinjaman",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Tuliskan keperluan pinjaman/kasbon..."
                                                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                required
                                            ></textarea>

                                            {errors.alasan_pinjaman && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.alasan_pinjaman}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ESTIMASI CICILAN */}
                                {data.total_pinjaman > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-bold text-[#431D6D]">
                                            Estimasi Cicilan
                                        </h3>

                                        <div className="flex items-center justify-between rounded-lg border border-[#F3B817]/30 bg-[#F3B817]/10 px-4 py-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                                    Potongan / Bulan
                                                </p>
                                                <p className="mt-0.5 text-lg font-extrabold text-[#2A164E]">
                                                    Rp{" "}
                                                    {estimasiCicilan.toLocaleString(
                                                        "id-ID",
                                                    )}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                                    Tenor
                                                </p>
                                                <p className="mt-0.5 text-sm font-bold text-[#431D6D]">
                                                    {data.tenor_bulan} Bulan
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FOOTER BUTTONS */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-3">
                                <Link
                                    href={route("pinjaman.index")}
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
