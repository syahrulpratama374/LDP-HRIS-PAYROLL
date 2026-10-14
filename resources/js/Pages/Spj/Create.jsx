import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        tujuan: "",
        keperluan: "",
        tgl_mulai: "",
        tgl_selesai: "",
        komponen_biaya: [
            {
                jenis_biaya: "Tiket Pesawat/Kereta",
                nominal: "",
                keterangan: "",
            },
        ],
    });

    // =========================================================
    // HANDLERS
    // =========================================================
    const addBiaya = () => {
        setData("komponen_biaya", [
            ...data.komponen_biaya,
            { jenis_biaya: "Penginapan", nominal: "", keterangan: "" },
        ]);
    };

    const removeBiaya = (index) => {
        const newBiaya = [...data.komponen_biaya];
        newBiaya.splice(index, 1);
        setData("komponen_biaya", newBiaya);
    };

    const handleBiayaChange = (index, field, value) => {
        const newBiaya = [...data.komponen_biaya];
        newBiaya[index][field] = value;
        setData("komponen_biaya", newBiaya);
    };

    // Hitung Total Otomatis
    const totalEstimasi = data.komponen_biaya.reduce(
        (sum, item) => sum + (Number(item.nominal) || 0),
        0,
    );

    const submit = (e) => {
        e.preventDefault();
        post(route("spj.store"));
    };

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Ajukan SPJ" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* =====================================================
                    HEADER BANNER
                ====================================================== */}
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[76px] items-center justify-center py-4">
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>

                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    Form Pengajuan SPJ
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Notifikasi Error Validasi Plafon dari Backend */}
                    {errors.error && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-red-800">
                                    Pengajuan SPJ Ditolak!
                                </h3>
                                <p className="mt-1 text-xs text-red-700 sm:text-sm">
                                    {errors.error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* =================================================
                        MAIN CARD FORM
                    ================================================== */}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-bold text-[#2A164E]">
                                Lengkapi Data Perjalanan Dinas
                            </h2>
                        </div>

                        <form onSubmit={submit}>
                            <div className="p-5 sm:p-6 space-y-8">
                                {/* --- BAGIAN 1: DETAIL PERJALANAN --- */}
                                <div>
                                    <h3 className="mb-4 flex items-center text-sm font-bold text-[#431D6D]">
                                        <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F3EDF8] text-[10px]">
                                            1
                                        </span>
                                        Detail Perjalanan
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        {/* KOTA TUJUAN */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Kota Tujuan - Nama Instansi atau
                                                Perusahaan{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.tujuan}
                                                onChange={(e) =>
                                                    setData(
                                                        "tujuan",
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                placeholder="Contoh: Jakarta - PT Maju Jaya"
                                                required
                                            />
                                            {errors.tujuan && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.tujuan}
                                                </p>
                                            )}
                                        </div>

                                        {/* TANGGAL MULAI */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Tanggal Mulai{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                value={data.tgl_mulai}
                                                onChange={(e) =>
                                                    setData(
                                                        "tgl_mulai",
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                required
                                            />
                                        </div>

                                        {/* TANGGAL SELESAI */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Tanggal Selesai{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                value={data.tgl_selesai}
                                                onChange={(e) =>
                                                    setData(
                                                        "tgl_selesai",
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                required
                                            />
                                        </div>

                                        {/* KEPERLUAN */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                Keperluan Perjalanan{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                rows="3"
                                                value={data.keperluan}
                                                onChange={(e) =>
                                                    setData(
                                                        "keperluan",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                placeholder="Jelaskan agenda perjalanan dinas secara lengkap..."
                                                required
                                            ></textarea>
                                            {errors.keperluan && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">
                                                    {errors.keperluan}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* --- BAGIAN 2: RINCIAN BIAYA DINAMIS --- */}
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="flex items-center text-sm font-bold text-[#431D6D]">
                                            <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F3EDF8] text-[10px]">
                                                2
                                            </span>
                                            Rincian Estimasi Biaya
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addBiaya}
                                            className="inline-flex h-8 items-center justify-center rounded-md border border-[#431D6D]/20 bg-[#F3EDF8] px-3 text-xs font-bold text-[#431D6D] transition hover:bg-[#EDE2F3]"
                                        >
                                            + Tambah Biaya
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {data.komponen_biaya.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="relative grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-[#F7F7FA] p-3 sm:grid-cols-12 sm:items-center sm:p-4"
                                                >
                                                    {/* JENIS BIAYA */}
                                                    <div className="sm:col-span-4">
                                                        <select
                                                            value={
                                                                item.jenis_biaya
                                                            }
                                                            onChange={(e) =>
                                                                handleBiayaChange(
                                                                    index,
                                                                    "jenis_biaya",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                        >
                                                            <option value="Transportasi">
                                                                Transportasi
                                                            </option>
                                                            <option value="Penginapan">
                                                                Penginapan/Hotel
                                                            </option>
                                                            <option value="Uang Makan">
                                                                Uang Makan
                                                            </option>
                                                            <option value="Lain-lain">
                                                                Lain-lain
                                                            </option>
                                                        </select>
                                                    </div>

                                                    {/* KETERANGAN */}
                                                    <div className="sm:col-span-4">
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.keterangan
                                                            }
                                                            onChange={(e) =>
                                                                handleBiayaChange(
                                                                    index,
                                                                    "keterangan",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Keterangan (Cth: Hotel 2 Malam)"
                                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                            required
                                                        />
                                                    </div>

                                                    {/* NOMINAL */}
                                                    <div className="sm:col-span-3">
                                                        <input
                                                            type="number"
                                                            value={item.nominal}
                                                            onChange={(e) =>
                                                                handleBiayaChange(
                                                                    index,
                                                                    "nominal",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Nominal (Rp)"
                                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                                            required
                                                        />
                                                    </div>

                                                    {/* TOMBOL HAPUS */}
                                                    <div className="flex justify-end sm:col-span-1 sm:justify-center">
                                                        {data.komponen_biaya
                                                            .length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeBiaya(
                                                                        index,
                                                                    )
                                                                }
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-700"
                                                                title="Hapus baris"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <path d="M3 6h18" />
                                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    {/* TOTAL ESTIMASI */}
                                    <div className="mt-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-5 py-4">
                                        <span className="text-xs font-bold uppercase tracking-wide text-green-700">
                                            Total Estimasi SPJ
                                        </span>
                                        <span className="text-xl font-extrabold text-[#2A164E]">
                                            Rp{" "}
                                            {totalEstimasi.toLocaleString(
                                                "id-ID",
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL FOOTER / AKSI */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                                <Link
                                    href={route("spj.index")}
                                    className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg bg-[#2A164E] px-6 text-sm font-semibold text-white transition hover:bg-[#431D6D] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {processing
                                        ? "Memproses..."
                                        : "Kirim Pengajuan SPJ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
