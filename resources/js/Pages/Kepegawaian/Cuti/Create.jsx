import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";

export default function CreateCuti({ auth, saldoCuti, masterJenisCuti }) {
    const { data, setData, post, processing, errors } = useForm({
        jenis_cuti_id: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        alasan: "",
        dokumen_bukti: null,
    });

    const [hariPengajuan, setHariPengajuan] = useState(0);
    const [melebihiKuota, setMelebihiKuota] = useState(false);
    const [selectedCuti, setSelectedCuti] = useState(null);

    // UI State untuk Preview
    const [filePreview, setFilePreview] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        const currentCuti = masterJenisCuti.find(
            (c) => c.id == data.jenis_cuti_id,
        );
        setSelectedCuti(currentCuti || null);
    }, [data.jenis_cuti_id, masterJenisCuti]);

    useEffect(() => {
        if (data.tanggal_mulai && data.tanggal_selesai && selectedCuti) {
            const start = new Date(data.tanggal_mulai);
            const end = new Date(data.tanggal_selesai);

            if (end >= start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setHariPengajuan(diffDays);

                if (selectedCuti.potong_cuti_tahunan) {
                    const sisaTahunan = saldoCuti.hak_cuti_tahunan - saldoCuti.cuti_terpakai;
                    setMelebihiKuota(diffDays > sisaTahunan);
                } else {
                    setMelebihiKuota(diffDays > selectedCuti.kuota_default);
                }
            } else {
                setHariPengajuan(0);
                setMelebihiKuota(false);
            }
        } else {
            setHariPengajuan(0);
            setMelebihiKuota(false);
        }
    }, [data.tanggal_mulai, data.tanggal_selesai, selectedCuti, saldoCuti]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("cuti.store"));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("dokumen_bukti", file);
        if (file) {
            if (file.type.startsWith("image/")) {
                setFilePreview(URL.createObjectURL(file));
            } else {
                setFilePreview(null);
            }
        } else {
            setFilePreview(null);
        }
    };

    const handleRemoveFile = () => {
        setData("dokumen_bukti", null);
        setFilePreview(null);
    };

    return (
        <AuthenticatedLayout header="Pengajuan Cuti & Izin">
            <Head title="Pengajuan Cuti" />

            {/* PERBAIKAN UTAMA: Gunakan max-w-4xl agar formulir di tengah dan tidak melebar aneh */}
            <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8 pb-12">
                
                                {/* WIDGET SALDO CUTI (PREMIUM GLASS) */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Total Hak Cuti */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#2A164E]/30">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#2A164E]/5 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Hak Cuti</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-4xl font-black text-[#2A164E]">{saldoCuti.hak_cuti_tahunan}</p>
                                    <span className="text-sm font-semibold text-gray-400">Hari</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2A164E] text-white shadow-lg shadow-[#2A164E]/30">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Cuti Terpakai */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-rose-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Cuti Terpakai</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-4xl font-black text-rose-600">{saldoCuti.cuti_terpakai}</p>
                                    <span className="text-sm font-semibold text-gray-400">Hari</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Sisa Saldo Cuti */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Sisa Saldo</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-4xl font-black text-emerald-600">{saldoCuti.hak_cuti_tahunan - saldoCuti.cuti_terpakai}</p>
                                    <span className="text-sm font-semibold text-gray-400">Hari</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    FORM PENGAJUAN
                ====================================================== */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-5">
                        <h2 className="text-lg font-bold text-[#2A164E]">Formulir Pengajuan</h2>
                        <p className="text-xs text-gray-500 mt-1">Pastikan data yang Anda isi sudah benar sebelum dikirim.</p>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Jenis Cuti <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.jenis_cuti_id}
                                    onChange={(e) => setData("jenis_cuti_id", e.target.value)}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E] outline-none transition"
                                    required
                                >
                                    <option value="">-- Pilih Jenis Cuti --</option>
                                    {masterJenisCuti.map((cuti) => (
                                        <option key={cuti.id} value={cuti.id}>
                                            {cuti.nama_cuti} (Maks: {cuti.kuota_default} Hari)
                                        </option>
                                    ))}
                                </select>
                                {errors.jenis_cuti_id && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.jenis_cuti_id}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tanggal Mulai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tanggal_mulai}
                                        onChange={(e) => setData("tanggal_mulai", e.target.value)}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E] outline-none transition"
                                        required
                                    />
                                    {errors.tanggal_mulai && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.tanggal_mulai}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tanggal Selesai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tanggal_selesai}
                                        onChange={(e) => setData("tanggal_selesai", e.target.value)}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E] outline-none transition"
                                        required
                                    />
                                    {errors.tanggal_selesai && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.tanggal_selesai}</p>}
                                </div>
                            </div>

                            {hariPengajuan > 0 && (
                                <div className={`p-4 rounded-xl border flex gap-3 ${melebihiKuota ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${melebihiKuota ? "bg-red-200 text-red-700" : "bg-blue-200 text-blue-700"}`}>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${melebihiKuota ? "text-red-800" : "text-blue-800"}`}>
                                            Lama Pengajuan: {hariPengajuan} Hari
                                        </p>
                                        {melebihiKuota && (
                                            <p className="text-sm mt-1 text-red-600">
                                                Peringatan: Jumlah hari yang diajukan melebihi batas maksimal / sisa saldo cuti ini.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Alasan / Keterangan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.alasan}
                                    onChange={(e) => setData("alasan", e.target.value)}
                                    rows="4"
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E] outline-none transition resize-none"
                                    placeholder="Jelaskan keperluan cuti Anda secara singkat..."
                                    required
                                ></textarea>
                                {errors.alasan && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.alasan}</p>}
                            </div>

                            {/* UPLOAD DOKUMEN */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Dokumen Bukti (Opsional)
                                </label>
                                
                                <div className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 hover:border-[#2A164E]/50 transition relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="space-y-1 text-center pointer-events-none">
                                        <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <span className="relative rounded-md font-semibold text-[#2A164E]">Pilih file</span>
                                            <p className="pl-1">atau drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Upload surat keterangan dokter/lampiran terkait jika diperlukan. (Maks 2MB, Format: JPG, PNG, PDF)</p>
                                    </div>
                                </div>
                                {errors.dokumen_bukti && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.dokumen_bukti}</p>}

                                {/* PREVIEW BESAR (Jika File Dipilih) */}
                                {data.dokumen_bukti && (
                                    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                                            <p className="text-xs font-bold uppercase tracking-widest text-[#2A164E]">Preview Dokumen Terpilih</p>
                                            <button 
                                                type="button" 
                                                onClick={() => { setData("dokumen_bukti", null); setFilePreview(null); }} 
                                                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Hapus File
                                            </button>
                                        </div>
                                        
                                        <div className="flex flex-col gap-4">
                                            {/* Info File */}
                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2A164E]/10 text-[#2A164E]">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-[#2A164E] truncate">{data.dokumen_bukti.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{(data.dokumen_bukti.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>

                                            {/* Gambar Preview (Besar & Jelas) */}
                                            {filePreview && (
                                                <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-[#F8F9FA] flex justify-center">
                                                    <img 
                                                        src={filePreview} 
                                                        alt="Preview Dokumen" 
                                                        className="max-h-[500px] w-auto object-contain" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                                <Link
                                    href={route("cuti.index")}
                                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#F3B817] px-6 py-2.5 text-sm font-bold text-[#2A164E] shadow-sm transition hover:bg-[#e0a80e] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#2A164E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    )}
                                    {processing ? "Menyimpan..." : "Ajukan Cuti"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* MODAL PREVIEW GAMBAR FULL SCREEN */}
            {isPreviewOpen && filePreview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsPreviewOpen(false)}>
                    <div className="relative max-h-[90vh] max-w-[90vw]">
                        <img src={filePreview} alt="Full Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
                        <button 
                            type="button" 
                            onClick={() => setIsPreviewOpen(false)} 
                            className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-200 transition"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}