import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: "",
        jam_mulai: "", 
        jam_selesai: "", 
        deskripsi_pekerjaan: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("lembur.store"));
    };

    // =========================================================
    // LOGIKA UI: FORMAT TANGGAL & KALKULASI DURASI
    // =========================================================
    const formatTanggalIndo = (tanggal) => {
        if (!tanggal) return "Pilih tanggal lembur";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        return date.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    };

    const hitungDurasi = (mulai, selesai) => {
        if (!mulai || !selesai) return "0 Jam";
        const start = new Date(`1970-01-01T${mulai}:00`);
        const end = new Date(`1970-01-01T${selesai}:00`);
        let diff = (end - start) / 1000 / 60;
        if (diff < 0) diff += 24 * 60;
        
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        
        if (hours === 0 && mins === 0) return "0 Jam";
        if (hours === 0) return `${mins} Menit`;
        if (mins === 0) return `${hours} Jam`;
        return `${hours} Jam ${mins} Menit`;
    };

    // Jam selesai < jam mulai berarti lintas tengah malam (+1 hari); batas maksimal 12 jam
    const keMenit = (jam) => {
        const [h, m] = (jam || "").split(":").map(Number);
        return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
    };
    const menitMulai = keMenit(data.jam_mulai);
    const menitSelesai = keMenit(data.jam_selesai);
    const lintasHari = menitMulai !== null && menitSelesai !== null && menitSelesai < menitMulai;
    const durasiMenit =
        menitMulai !== null && menitSelesai !== null
            ? (menitSelesai - menitMulai + 24 * 60) % (24 * 60)
            : null;
    const durasiTidakValid = durasiMenit !== null && (durasiMenit === 0 || durasiMenit > 12 * 60);

    return (
        <AuthenticatedLayout header="Ajukan Lembur">
            <Head title="Ajukan Lembur" />

            <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8 pb-20">
                
                {/* ERROR FLASH MESSAGE */}
                {errors.error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm" role="alert">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-rose-800">Terjadi Kesalahan</h4>
                            <p className="text-xs text-rose-600 mt-1">{errors.error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    
                    {/* =====================================================
                        SECTION 1: WAKTU LEMBUR
                    ====================================================== */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
                            <svg className="h-5 w-5 text-[#2A164E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <h2 className="text-sm font-bold text-[#2A164E] uppercase tracking-wider">Waktu Pelaksanaan</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Tanggal */}
                                <div>
                                    <label htmlFor="tanggal" className="mb-2 block text-xs font-bold text-gray-600">
                                        Tanggal <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="tanggal"
                                        type="date"
                                        value={data.tanggal}
                                        onChange={(e) => setData("tanggal", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-[#2A164E] focus:ring-2 focus:ring-[#2A164E]/20"
                                        required
                                    />
                                    {errors.tanggal && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.tanggal}</p>}
                                </div>

                                {/* Jam Mulai */}
                                <div>
                                    <label htmlFor="jam_mulai" className="mb-2 block text-xs font-bold text-gray-600">
                                        Jam Mulai <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="jam_mulai"
                                        type="time"
                                        value={data.jam_mulai}
                                        onChange={(e) => setData("jam_mulai", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-[#2A164E] focus:ring-2 focus:ring-[#2A164E]/20"
                                        required
                                    />
                                    {errors.jam_mulai && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.jam_mulai}</p>}
                                </div>

                                {/* Jam Selesai */}
                                <div>
                                    <label htmlFor="jam_selesai" className="mb-2 block text-xs font-bold text-gray-600">
                                        Jam Selesai <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="jam_selesai"
                                        type="time"
                                        value={data.jam_selesai}
                                        onChange={(e) => setData("jam_selesai", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-[#2A164E] focus:ring-2 focus:ring-[#2A164E]/20"
                                        required
                                    />
                                    {errors.jam_selesai && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.jam_selesai}</p>}
                                </div>
                            </div>

                            {/* Live Duration Highlight (Lebih Ringkas & Elegan) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-[#2A164E]/5 border border-[#2A164E]/15 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm text-[#2A164E]">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Durasi</p>
                                        <p className="text-sm font-semibold text-[#2A164E]">{formatTanggalIndo(data.tanggal)}</p>
                                    </div>
                                </div>
                                {/* Teks Durasi Diperkecil */}
                                <div className="text-left sm:text-right">
                                    <span className={`text-lg font-bold ${durasiTidakValid ? "text-rose-600" : "text-[#2A164E]"}`}>{hitungDurasi(data.jam_mulai, data.jam_selesai)}</span>
                                    {lintasHari && (
                                        <p className="text-xs font-semibold text-[#2A164E]/70">+1 hari (lintas tengah malam)</p>
                                    )}
                                    {durasiMenit !== null && durasiMenit > 12 * 60 && (
                                        <p className="text-xs font-semibold text-rose-600">Maksimal 12 jam</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        SECTION 2: PEKERJAAN
                    ====================================================== */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
                            <svg className="h-5 w-5 text-[#2A164E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <h2 className="text-sm font-bold text-[#2A164E] uppercase tracking-wider">Detail Pekerjaan</h2>
                        </div>

                        <div className="p-6">
                            <label htmlFor="deskripsi_pekerjaan" className="mb-2 block text-xs font-bold text-gray-600">
                                Deskripsi Pekerjaan <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                id="deskripsi_pekerjaan"
                                rows="5"
                                value={data.deskripsi_pekerjaan}
                                onChange={(e) => setData("deskripsi_pekerjaan", e.target.value)}
                                placeholder="Ceritakan secara detail apa saja yang Anda kerjakan selama lembur..."
                                className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2A164E] focus:bg-white focus:ring-2 focus:ring-[#2A164E]/20"
                                required
                            />
                            {errors.deskripsi_pekerjaan && <p className="mt-2 text-xs font-medium text-rose-600">{errors.deskripsi_pekerjaan}</p>}
                        </div>
                    </div>

                    {/* =====================================================
                        ACTIONS (Tombol)
                    ====================================================== */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href={route("lembur.index")}
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
                                "Kirim Pengajuan"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}   