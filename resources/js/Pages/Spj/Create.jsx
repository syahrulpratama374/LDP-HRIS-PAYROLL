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
                jenis_biaya: "Transportasi", // Default disesuaikan dengan pilihan
                nominal: "",
                keterangan: "",
            },
        ],
    });

    // =========================================================
    // HANDLERS (TIDAK DIUBAH)
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
        post(route("spj.lama.store"));
    };

    return (
        <AuthenticatedLayout header="Ajukan SPJ">
            <Head title="Ajukan SPJ" />

            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8 pb-16">
                
                {/* ERROR FLASH MESSAGE */}
                {errors.error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm" role="alert">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-rose-800">Pengajuan SPJ Ditolak!</h4>
                            <p className="text-xs text-rose-600 mt-1">{errors.error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    
                    {/* =====================================================
                        SECTION 1: DETAIL PERJALANAN
                    ====================================================== */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
                            <svg className="h-5 w-5 text-[#2A164E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <h2 className="text-sm font-bold text-[#2A164E] uppercase tracking-wider">Detail Perjalanan</h2>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* KOTA TUJUAN */}
                            <div>
                                <label className="mb-2 block text-xs font-bold text-gray-600">
                                    Kota Tujuan & Instansi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.tujuan}
                                    onChange={(e) => setData("tujuan", e.target.value)}
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-[#2A164E] focus:ring-2 focus:ring-[#2A164E]/20"
                                    placeholder="Contoh: Jakarta - PT Maju Jaya"
                                    required
                                />
                                {errors.tujuan && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.tujuan}</p>}
                            </div>

                            {/* TANGGAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-gray-600">Tanggal Mulai <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={data.tgl_mulai}
                                        onChange={(e) => setData("tgl_mulai", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-[#2A164E] focus:ring-2 focus:ring-[#2A164E]/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-gray-600">Tanggal Selesai <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={data.tgl_selesai}
                                        onChange={(e) => setData("tgl_selesai", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-[#2A164E] focus:ring-2 focus:ring-[#2A164E]/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* KEPERLUAN */}
                            <div>
                                <label className="mb-2 block text-xs font-bold text-gray-600">Keperluan Perjalanan <span className="text-rose-500">*</span></label>
                                <textarea
                                    rows="4"
                                    value={data.keperluan}
                                    onChange={(e) => setData("keperluan", e.target.value)}
                                    className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2A164E] focus:bg-white focus:ring-2 focus:ring-[#2A164E]/20"
                                    placeholder="Jelaskan agenda perjalanan dinas secara lengkap..."
                                    required
                                ></textarea>
                                {errors.keperluan && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.keperluan}</p>}
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        SECTION 2: RINCIAN BIAYA
                    ====================================================== */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-[#2A164E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h2 className="text-sm font-bold text-[#2A164E] uppercase tracking-wider">Rincian Estimasi Biaya</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addBiaya}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border-[#431D6D]/20 bg-[#F3EDF8] px-3 text-xs font-bold text-[#431D6D] transition hover:bg-[#EDE2F3]"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Tambah Biaya
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {data.komponen_biaya.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-[#F8F9FA] p-4 sm:grid-cols-12 sm:items-end relative">
                                    
                                    <div className="sm:col-span-4">
                                        <label className="mb-1.5 block text-[11px] font-bold text-gray-600">Jenis Biaya</label>
                                        <select
                                            value={item.jenis_biaya}
                                            onChange={(e) => handleBiayaChange(index, "jenis_biaya", e.target.value)}
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E]"
                                        >
                                            <option value="Transportasi">Transportasi</option>
                                            <option value="Penginapan">Penginapan/Hotel</option>
                                            <option value="Uang Makan">Uang Makan</option>
                                            <option value="Lain-lain">Lain-lain</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-4">
                                        <label className="mb-1.5 block text-[11px] font-bold text-gray-600">Keterangan</label>
                                        <input
                                            type="text"
                                            value={item.keterangan}
                                            onChange={(e) => handleBiayaChange(index, "keterangan", e.target.value)}
                                            placeholder="Cth: Hotel 2 Malam"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E]"
                                            required
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="mb-1.5 block text-[11px] font-bold text-gray-600">Nominal (Rp)</label>
                                        <input
                                            type="number"
                                            value={item.nominal}
                                            onChange={(e) => handleBiayaChange(index, "nominal", e.target.value)}
                                            placeholder="0"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E]"
                                            required
                                        />
                                    </div>

                                    <div className="sm:col-span-1 flex justify-end sm:justify-center pb-1">
                                        {data.komponen_biaya.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeBiaya(index)}
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 transition hover:bg-rose-200"
                                                title="Hapus"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* TOTAL ESTIMASI (Live) */}
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-[#2A164E]/5 border border-[#2A164E]/10 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2A164E]/10 text-[#2A164E] shadow-sm">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#2A164E]/70">Total Estimasi Biaya</p>
                                        <p className="text-xs font-semibold text-[#2A164E] mt-0.5">Berdasarkan rincian di atas</p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-2xl font-black text-[#2A164E]">
                                        Rp {totalEstimasi.toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href={route("spj.lama.index")}
                            className="inline-flex h-12 min-w-[120px] items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-[#F3B817] px-8 text-sm font-bold text-[#2A164E] shadow-lg shadow-[#F3B817]/30 transition hover:bg-[#e0a80e] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-[#2A164E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Memproses...
                                </>
                            ) : (
                                "Kirim Pengajuan SPJ"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}