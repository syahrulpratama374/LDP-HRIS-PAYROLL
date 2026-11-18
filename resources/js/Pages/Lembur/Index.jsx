import React, { useMemo, useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Index({ auth, riwayatLembur = [] }) {
    const { flash } = usePage().props || {};

    // =========================================================
    // STATE
    // =========================================================
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    
    const [showFlash, setShowFlash] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // =========================================================
    // FORMAT & KALKULASI UI
    // =========================================================
    const formatTanggalLengkap = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    };

    const formatTanggalSingkat = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // PERBAIKAN: Memotong string agar hanya mengambil "HH:MM" (membuang detik)
    const formatJamSaja = (jam) => {
        if (!jam) return "--:--";
        return jam.substring(0, 5); 
    };

    // PERBAIKAN FUNGSI HITUNG DURASI
    const hitungDurasi = (mulai, selesai) => {
        if (!mulai || !selesai) return "-";
        
        // Ambil 5 karakter pertama (HH:MM) agar new Date() valid
        const startTime = mulai.substring(0, 5);
        const endTime = selesai.substring(0, 5);

        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        let diff = (end - start) / 1000 / 60; // dalam menit
        
        if (isNaN(diff)) return "-"; // Jaga-jaga jika format benar-benar rusak
        if (diff < 0) diff += 24 * 60; // Handle jika lewat tengah malam
        
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        
        if (hours === 0) return `${mins} Menit`;
        if (mins === 0) return `${hours} Jam`;
        return `${hours} Jam ${mins} Menit`;
    };

    const getStatusStyle = (status) => {
        if (status === "Disetujui") return "border-emerald-200 bg-emerald-50 text-emerald-700";
        if (status === "Ditolak") return "border-rose-200 bg-rose-50 text-rose-700";
        return "border-amber-200 bg-amber-50 text-amber-700";
    };

    // =========================================================
    // KALKULASI RINGKASAN
    // =========================================================
    const totalPengajuan = riwayatLembur.length;
    const totalDisetujui = riwayatLembur.filter(l => l.status_approval === "Disetujui").length;
    const totalPending = riwayatLembur.filter(l => l.status_approval === "Pending").length;
    const totalDitolak = riwayatLembur.filter(l => l.status_approval === "Ditolak").length;

    // =========================================================
    // SEARCH & FILTER
    // =========================================================
    const filteredLembur = useMemo(() => {
        let result = riwayatLembur;
        
        if (search.trim()) {
            const keyword = search.trim().toLowerCase();
            result = result.filter((lembur) => {
                const status = lembur.status_approval?.toLowerCase() || "";
                const deskripsi = lembur.deskripsi_pekerjaan?.toLowerCase() || "";
                const tanggalPengajuan = formatTanggalLengkap(lembur.created_at).toLowerCase();
                const tanggalLembur = formatTanggalLengkap(lembur.tanggal).toLowerCase();
                const jamMulai = lembur.jam_mulai?.toLowerCase() || "";
                const jamSelesai = lembur.jam_selesai?.toLowerCase() || "";
                return status.includes(keyword) || deskripsi.includes(keyword) || tanggalPengajuan.includes(keyword) || tanggalLembur.includes(keyword) || jamMulai.includes(keyword) || jamSelesai.includes(keyword);
            });
        }

        if (filterStatus !== "Semua") {
            result = result.filter((lembur) => lembur.status_approval === filterStatus);
        }

        return result;
    }, [search, riwayatLembur, filterStatus]);

    // =========================================================
    // MODAL
    // =========================================================
    const openDetailModal = (item) => {
        setSelectedDetail(item);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedDetail(null);
    };

    return (
        <AuthenticatedLayout header="Riwayat Pengajuan Lembur">
            <Head title="Riwayat Pengajuan Lembur" />

            <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
                
                {/* NOTIFIKASI */}
                {showFlash && flash?.success && (
                    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            {flash.success}
                        </div>
                        <button onClick={() => setShowFlash(false)} className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-200/50 hover:text-emerald-800 transition">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {/* KARTU RINGKASAN LEMBUR (4 KOLOM) */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Pengajuan */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#2A164E]/30">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#2A164E]/5 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-[#2A164E]">{totalPengajuan}</p>
                                    <span className="text-xs font-semibold text-gray-400">Kali</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A164E] text-white shadow-lg shadow-[#2A164E]/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Disetujui */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Disetujui</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-emerald-600">{totalDisetujui}</p>
                                    <span className="text-xs font-semibold text-gray-400">Kali</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Ditolak */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-rose-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Ditolak</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-rose-600">{totalDitolak}</p>
                                    <span className="text-xs font-semibold text-gray-400">Kali</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Pending</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-amber-600">{totalPending}</p>
                                    <span className="text-xs font-semibold text-gray-400">Kali</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CARD TABLE */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#2A164E]">Daftar Pengajuan Lembur</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Kelola riwayat pengajuan lembur Anda.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                            <div className="relative w-full sm:w-60">
                                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari pengajuan..."
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E]"
                                />
                            </div>

                            <div className="w-full sm:w-36">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E]"
                                >
                                    <option value="Semua">Semua Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Disetujui">Disetujui</option>
                                    <option value="Ditolak">Ditolak</option>
                                </select>
                            </div>

                            <Link
                                href={route("lembur.create")}
                                className="inline-flex h-9 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F3B817] px-4 text-sm font-bold text-[#2A164E] shadow-sm transition hover:bg-[#e0a80e]"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Ajukan Lembur
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full min-w-[900px] text-left text-sm text-gray-600">
                            <thead className="bg-[#F8F9FA] text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3">Tgl Pengajuan</th>
                                    <th className="px-5 py-3">Tanggal Lembur</th>
                                    <th className="px-5 py-3">Jam</th>
                                    <th className="px-5 py-3 text-center">Durasi</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredLembur.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#2A164E]/5 text-[#2A164E]">
                                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <h3 className="text-base font-bold text-[#2A164E]">
                                                    {search || filterStatus !== "Semua" ? "Pencarian Tidak Ditemukan" : "Belum Ada Riwayat Lembur"}
                                                </h3>
                                                <p className="mt-1 max-w-sm text-xs text-gray-500 text-center">
                                                    {search || filterStatus !== "Semua" ? "Coba sesuaikan kata kunci atau filter status Anda." : "Anda belum pernah mengajukan lembur. Silakan klik tombol di bawah untuk mulai mengajukan."}
                                                </p>
                                                
                                                {(search || filterStatus !== "Semua") ? (
                                                    <button onClick={() => { setSearch(""); setFilterStatus("Semua"); }} className="mt-5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition">Reset Filter</button>
                                                ) : (
                                                    <Link href={route("lembur.create")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2A164E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#431D6D]">
                                                        Buat Pengajuan Pertama
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLembur.map((lembur) => (
                                        <tr key={lembur.id} className="transition hover:bg-[#F8F9FA]">
                                            <td className="px-5 py-3 font-medium text-gray-800">
                                                {formatTanggalLengkap(lembur.created_at)}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-[#2A164E]">
                                                {formatTanggalSingkat(lembur.tanggal)}
                                            </td>
                                            {/* PERBAIKAN: Jam ditampilkan hanya HH:MM tanpa detik */}
                                            <td className="px-5 py-3 text-gray-600">
                                                {formatJamSaja(lembur.jam_mulai)} <span className="text-gray-400 mx-1">s/d</span> {formatJamSaja(lembur.jam_selesai)}
                                            </td>
                                            <td className="px-5 py-3 text-center font-medium">
                                                {hitungDurasi(lembur.jam_mulai, lembur.jam_selesai)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(lembur.status_approval)}`}>
                                                    {lembur.status_approval}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => openDetailModal(lembur)}
                                                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-[#2A164E] hover:text-white hover:border-[#2A164E]"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* =========================================================
                MODAL DETAIL LEMBUR
            ========================================================== */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                            <h3 className="text-lg font-bold text-[#2A164E]">Detail Pengajuan Lembur</h3>
                            <button onClick={closeDetailModal} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tanggal Lembur</p>
                                    <p className="text-sm font-bold text-[#2A164E]">{formatTanggalLengkap(selectedDetail.tanggal)}</p>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusStyle(selectedDetail.status_approval)}`}>
                                        {selectedDetail.status_approval}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Waktu & Durasi</p>
                                <div className="flex items-center gap-2 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    {/* PERBAIKAN: Jam di modal juga dibersihkan detiknya */}
                                    <span className="text-sm font-semibold text-gray-700">{formatJamSaja(selectedDetail.jam_mulai)}</span>
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    <span className="text-sm font-semibold text-gray-700">{formatJamSaja(selectedDetail.jam_selesai)}</span>
                                    <span className="ml-auto text-xs font-bold text-[#2A164E] bg-[#2A164E]/10 px-2 py-1 rounded-md">
                                        {hitungDurasi(selectedDetail.jam_mulai, selectedDetail.jam_selesai)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tanggal Pengajuan</p>
                                <p className="text-sm font-semibold text-gray-700 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    {formatTanggalLengkap(selectedDetail.created_at)}
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Deskripsi Pekerjaan</p>
                                <p className="text-sm leading-relaxed text-gray-700 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                                    {selectedDetail.deskripsi_pekerjaan || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end">
                            <button onClick={closeDetailModal} className="rounded-xl bg-[#2A164E] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#431D6D]">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}