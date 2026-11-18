import React, { useMemo, useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function IndexCuti({ auth, riwayatCuti, saldoCuti = { hak_cuti_tahunan: 0, cuti_terpakai: 0 } }) {
    const { flash } = usePage().props;
    const [selectedCuti, setSelectedCuti] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua");
    const [selectedDocument, setSelectedDocument] = useState(null);

    const [showFlash, setShowFlash] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const sisaSaldo = saldoCuti.hak_cuti_tahunan - saldoCuti.cuti_terpakai;

    const dataCuti = riwayatCuti?.data ? riwayatCuti.data : (riwayatCuti || []);
    const paginationLinks = riwayatCuti?.links ? riwayatCuti.links : null;

    // =========================================================
    // FORMAT TANGGAL
    // =========================================================
    const formatTanggalLengkap = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    };

    const formatTanggalPeriode = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const hitungDurasi = (mulai, selesai) => {
        if (!mulai || !selesai) return 0;
        const start = new Date(mulai);
        const end = new Date(selesai);
        if (end < start) return 0;
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const getStatusStyle = (status) => {
        if (status === "Disetujui") return { className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
        if (status === "Ditolak") return { className: "border-rose-200 bg-rose-50 text-rose-700" };
        return { className: "border-amber-200 bg-amber-50 text-amber-700" };
    };

    const filteredCuti = useMemo(() => {
        let result = dataCuti;
        if (search.trim()) {
            const keyword = search.trim().toLowerCase();
            result = result.filter((cuti) => {
                const jenis = cuti.master_jenis_cuti?.nama_cuti?.toLowerCase() || cuti.jenis_cuti?.toLowerCase() || "";
                const status = cuti.status_approval?.toLowerCase() || "";
                return jenis.includes(keyword) || status.includes(keyword);
            });
        }
        if (filterStatus !== "Semua") {
            result = result.filter((cuti) => cuti.status_approval === filterStatus);
        }
        return result;
    }, [search, dataCuti, filterStatus]);

    const getDocumentUrl = (path) => `/storage/${path}`;
    const getFileExtension = (path) => path ? path.split(".").pop()?.toLowerCase() || "" : "";
    const isPdf = (path) => getFileExtension(path) === "pdf";
    const isImage = (path) => ["jpg", "jpeg", "png", "webp", "gif"].includes(getFileExtension(path));
    
    const openDocument = (cuti) => {
        if (!cuti?.dokumen_bukti_path) return;
        setSelectedDocument({ url: getDocumentUrl(cuti.dokumen_bukti_path), path: cuti.dokumen_bukti_path, jenis: cuti.master_jenis_cuti?.nama_cuti || cuti.jenis_cuti || "-" });
    };

    return (
        <AuthenticatedLayout header="Riwayat Cuti & Izin">
            <Head title="Riwayat Cuti & Izin" />

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

                                {/* KARTU RINGKASAN SALDO (PREMIUM GLASS) */}
                <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {/* Total Hak Cuti */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#2A164E]/30">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#2A164E]/5 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Hak Cuti</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-4xl font-black text-[#2A164E]">{saldoCuti?.hak_cuti_tahunan || 0}</p>
                                    <span className="text-sm font-semibold text-gray-400">Hari</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2A164E] text-white shadow-lg shadow-[#2A164E]/30">
                                {/* Ikon Kalender */}
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
                                    <p className="text-4xl font-black text-rose-600">{saldoCuti?.cuti_terpakai || 0}</p>
                                    <span className="text-sm font-semibold text-gray-400">Hari</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                                {/* Ikon Jam Lewat */}
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Sisa Saldo Cuti */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Sisa Saldo Cuti</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-4xl font-black text-emerald-600">{sisaSaldo}</p>
                                    <span className="text-sm font-semibold text-gray-400">Hari</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                                {/* Ikon Matahari (Libur) */}
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CARD TABLE */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#2A164E]">Daftar Pengajuan</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Kelola riwayat pengajuan cuti dan izin Anda.</p>
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
                                href={route("cuti.create")}
                                className="inline-flex h-9 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F3B817] px-4 text-sm font-bold text-[#2A164E] shadow-sm transition hover:bg-[#e0a80e]"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Ajukan Cuti
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full min-w-[900px] text-left text-sm text-gray-600">
                            {/* Padding tabel dirapatkan dari py-4 ke py-3 */}
                            <thead className="bg-[#F8F9FA] text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3">Tgl Pengajuan</th>
                                    <th className="px-5 py-3">Jenis Cuti</th>
                                    <th className="px-5 py-3">Periode</th>
                                    <th className="px-5 py-3 text-center">Durasi</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-center">Aksi</th> {/* Diubah ke center agar tidak mepet kanan */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredCuti.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#2A164E]/5 text-[#2A164E]">
                                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <h3 className="text-base font-bold text-[#2A164E]">
                                                    {search || filterStatus !== "Semua" ? "Pencarian Tidak Ditemukan" : "Belum Ada Riwayat Pengajuan"}
                                                </h3>
                                                <p className="mt-1 max-w-sm text-xs text-gray-500 text-center">
                                                    {search || filterStatus !== "Semua" ? "Coba sesuaikan kata kunci atau filter status Anda." : "Anda belum pernah mengajukan cuti. Silakan klik tombol di bawah untuk mulai mengajukan."}
                                                </p>
                                                
                                                {(search || filterStatus !== "Semua") ? (
                                                    <button onClick={() => { setSearch(""); setFilterStatus("Semua"); }} className="mt-5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition">Reset Filter</button>
                                                ) : (
                                                    <Link href={route("cuti.create")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2A164E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#431D6D]">
                                                        Buat Pengajuan Pertama
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCuti.map((cuti) => {
                                        const statusStyle = getStatusStyle(cuti.status_approval);
                                        const durasi = hitungDurasi(cuti.tanggal_mulai, cuti.tanggal_selesai);
                                        
                                        return (
                                            <tr key={cuti.id} className="transition hover:bg-[#F8F9FA]">
                                                <td className="px-5 py-3 font-medium text-gray-800">{formatTanggalLengkap(cuti.created_at)}</td>
                                                <td className="px-5 py-3"><span className="font-semibold text-[#2A164E]">{cuti.master_jenis_cuti?.nama_cuti || cuti.jenis_cuti || "-"}</span></td>
                                                <td className="px-5 py-3 text-gray-600">{formatTanggalPeriode(cuti.tanggal_mulai)} <span className="text-gray-400 mx-1">s/d</span> {formatTanggalPeriode(cuti.tanggal_selesai)}</td>
                                                <td className="px-5 py-3 text-center font-medium">{durasi} Hari</td>
                                                <td className="px-5 py-3 text-center">
                                                    {/* Dot (bulatan) dihapus, desain badge dibuat lebih tipis */}
                                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle.className}`}>
                                                        {cuti.status_approval}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <button type="button" onClick={() => setSelectedCuti(cuti)} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-[#2A164E] hover:text-white hover:border-[#2A164E]">
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* UI PAGINATION */}
                    {paginationLinks && paginationLinks.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 bg-white px-5 py-3 gap-3">
                            <div className="text-xs text-gray-500">
                                Menampilkan <span className="font-bold text-[#2A164E]">{riwayatCuti.from || 0}</span> - <span className="font-bold text-[#2A164E]">{riwayatCuti.to || 0}</span> dari <span className="font-bold text-[#2A164E]">{riwayatCuti.total || 0}</span> pengajuan
                            </div>
                            <div className="flex items-center gap-1">
                                {paginationLinks.map((link, index) => {
                                    if (!link.url) {
                                        return (
                                            <span key={index} className="flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-100 bg-gray-50 px-2 text-xs font-medium text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            preserveScroll
                                            className={`flex h-7 min-w-[28px] items-center justify-center rounded border px-2 text-xs font-bold transition ${
                                                link.active ? "border-[#2A164E] bg-[#2A164E] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-[#2A164E]"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DETAIL CUTI */}
            {selectedCuti && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                            <h3 className="text-lg font-bold text-[#2A164E]">Detail Pengajuan</h3>
                            <button onClick={() => setSelectedCuti(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Jenis Cuti</p>
                                    <p className="text-sm font-bold text-[#2A164E]">{selectedCuti.master_jenis_cuti?.nama_cuti || selectedCuti.jenis_cuti || "-"}</p>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusStyle(selectedCuti.status_approval).className}`}>
                                        {selectedCuti.status_approval}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Periode & Durasi</p>
                                <div className="flex items-center gap-2 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-gray-700">{formatTanggalLengkap(selectedCuti.tanggal_mulai)}</span>
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    <span className="text-sm font-semibold text-gray-700">{formatTanggalLengkap(selectedCuti.tanggal_selesai)}</span>
                                    <span className="ml-auto text-xs font-bold text-[#2A164E] bg-[#2A164E]/10 px-2 py-1 rounded-md">
                                        {hitungDurasi(selectedCuti.tanggal_mulai, selectedCuti.tanggal_selesai)} Hari
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Alasan Pengajuan</p>
                                <p className="text-sm leading-relaxed text-gray-700 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">{selectedCuti.alasan || "-"}</p>
                            </div>

                            {selectedCuti.dokumen_bukti_path && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Lampiran</p>
                                    <button
                                        type="button"
                                        onClick={() => openDocument(selectedCuti)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#2A164E]/20 bg-[#2A164E]/5 px-4 py-2.5 text-xs font-bold text-[#2A164E] transition hover:bg-[#2A164E]/10"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        Lihat Lampiran
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end">
                            <button onClick={() => setSelectedCuti(null)} className="rounded-xl bg-[#2A164E] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#431D6D]">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PREVIEW DOKUMEN */}
            {selectedDocument && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
                            <div>
                                <h3 className="text-sm font-bold text-[#2A164E]">Lampiran: {selectedDocument.jenis}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href={selectedDocument.url} download className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3B817] px-4 py-2 text-xs font-bold text-[#2A164E] hover:bg-[#e0a80e] transition">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download
                                </a>
                                <button onClick={() => setSelectedDocument(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 p-4 sm:p-6 flex justify-center items-center overflow-auto">
                            {isImage(selectedDocument.path) ? (
                                <img src={selectedDocument.url} alt="Lampiran" className="max-h-full max-w-full object-contain rounded-lg shadow-md bg-white" />
                            ) : isPdf(selectedDocument.path) ? (
                                <iframe src={selectedDocument.url} className="h-full w-full rounded-lg border border-gray-300 bg-white" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-500 bg-white p-8 rounded-xl border border-gray-200">
                                    <svg className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p className="text-sm font-semibold">Preview tidak tersedia</p>
                                    <p className="text-xs text-gray-400 mt-1">Silakan download file untuk melihatnya.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}