import React, { useMemo, useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import formatRupiah from "@/Utils/formatRupiah";

export default function Index({ auth, spj = [], adaUtangLaporan }) {
    const { flash } = usePage().props || {};

    // =========================================================
    // STATE
    // =========================================================
    const [search, setSearch] = useState("");
    const [showModalLapor, setShowModalLapor] = useState(false);
    const [selectedSpjId, setSelectedSpjId] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showFlash, setShowFlash] = useState(!!flash?.success);

    // STATE BARU UNTUK PREVIEW FILE
    const [filePreview, setFilePreview] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        laporan_hasil: "",
        file_bukti: null,
    });

    useEffect(() => {
        if (flash?.success) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // =========================================================
    // FORMATTERS
    // =========================================================
    const formatTanggalSingkat = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Selesai":
            case "Disetujui":
                return "border-emerald-200 bg-emerald-50 text-emerald-700";
            case "Pending":
                return "border-amber-200 bg-amber-50 text-amber-700";
            case "Menunggu Pelaporan":
                return "border-orange-200 bg-orange-50 text-orange-700";
            case "Menunggu Validasi Finance":
                return "border-[#2A164E]/20 bg-[#2A164E]/5 text-[#2A164E]";
            case "Ditolak":
                return "border-rose-200 bg-rose-50 text-rose-700";
            default:
                return "border-gray-200 bg-gray-50 text-gray-700";
        }
    };

    // =========================================================
    // SEARCH
    // =========================================================
    const filteredSpj = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return spj;

        return spj.filter((item) => {
            const tujuan = item.tujuan?.toLowerCase() || "";
            const keperluan = item.keperluan?.toLowerCase() || "";
            const status = item.status_approval?.toLowerCase() || "";
            return tujuan.includes(keyword) || keperluan.includes(keyword) || status.includes(keyword);
        });
    }, [search, spj]);

    // =========================================================
    // KALKULASI SUMMARY
    // =========================================================
    const totalSpj = spj.length;
    const totalSelesai = spj.filter(s => ["Selesai", "Disetujui"].includes(s.status_approval)).length;
    const totalMenungguLapor = spj.filter(s => s.status_approval === "Menunggu Pelaporan").length;

    // =========================================================
    // HANDLERS
    // =========================================================
    const openModalLapor = (id) => {
        setSelectedSpjId(id);
        setShowModalLapor(true);
    };

    const closeModalLapor = () => {
        setShowModalLapor(false);
        setSelectedSpjId(null);
        reset(); // Reset form
        setFilePreview(null); // Bersihkan preview
    };

    // FUNGSI BARU UNTUK HANDLE FILE & PREVIEW
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("file_bukti", file);

        if (file) {
            if (file.type.startsWith("image/")) {
                setFilePreview(URL.createObjectURL(file)); // Buat URL preview jika gambar
            } else {
                setFilePreview(null); // Jika PDF, set null
            }
        } else {
            setFilePreview(null);
        }
    };

    const submitLaporan = (e) => {
        e.preventDefault();
        post(route("spj.laporan", selectedSpjId), {
            forceFormData: true,
            onSuccess: () => closeModalLapor(),
        });
    };

    const openDetailModal = (item) => {
        setSelectedDetail(item);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedDetail(null);
    };

    return (
        <AuthenticatedLayout header="Riwayat Perjalanan Dinas (SPJ)">
            <Head title="SPJ Karyawan" />

            <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 pb-12">
                
                {/* FLASH MESSAGE */}
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

                {/* BANNER PERINGATAN UTANG LAPORAN */}
                {adaUtangLaporan && (
                    <div className="mb-6 flex items-start gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-200 text-rose-700">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-rose-800">Akses Pengajuan Baru Dikunci!</h3>
                            <p className="mt-1 text-xs leading-relaxed text-rose-700 sm:text-sm">
                                Anda memiliki jadwal perjalanan dinas yang sudah selesai namun <strong>belum dilaporkan</strong>. Harap unggah laporan hasil dan bukti bon pada tabel di bawah agar Anda dapat membuat pengajuan SPJ baru.
                            </p>
                        </div>
                    </div>
                )}

                {/* KARTU RINGKASAN (PREMIUM GLASS) */}
                <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#2A164E]/30">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#2A164E]/5 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total SPJ</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-[#2A164E]">{totalSpj}</p>
                                    <span className="text-xs font-semibold text-gray-400">Pengajuan</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A164E] text-white shadow-lg shadow-[#2A164E]/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Selesai / Disetujui</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-emerald-600">{totalSelesai}</p>
                                    <span className="text-xs font-semibold text-gray-400">SPJ</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-300">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-50 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Menunggu Laporan</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <p className="text-3xl font-black text-orange-600">{totalMenungguLapor}</p>
                                    <span className="text-xs font-semibold text-gray-400">SPJ</span>
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CARD TABLE */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#2A164E]">Daftar Pengajuan SPJ</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Kelola riwayat perjalanan dinas Anda.</p>
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

                            {!adaUtangLaporan ? (
                                <Link
                                    href={route("spj.create")}
                                    className="inline-flex h-9 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F3B817] px-4 text-sm font-bold text-[#2A164E] shadow-sm transition hover:bg-[#e0a80e]"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    Ajukan SPJ
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex h-9 w-full sm:w-auto shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 text-sm font-bold text-gray-400"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    Ajukan SPJ
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full min-w-[900px] text-left text-sm text-gray-600">
                            <thead className="bg-[#F8F9FA] text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3">Tujuan & Keperluan</th>
                                    <th className="px-5 py-3">Periode Dinas</th>
                                    <th className="px-5 py-3">Total Biaya</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredSpj.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#2A164E]/5 text-[#2A164E]">
                                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                </div>
                                                <h3 className="text-base font-bold text-[#2A164E]">
                                                    {search ? "Pencarian Tidak Ditemukan" : "Belum Ada Riwayat SPJ"}
                                                </h3>
                                                <p className="mt-1 max-w-sm text-xs text-gray-500 text-center">
                                                    {search ? "Coba gunakan kata kunci lain." : "Anda belum pernah mengajukan perjalanan dinas."}
                                                </p>
                                                {search && (
                                                    <button onClick={() => setSearch("")} className="mt-5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition">Reset Pencarian</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSpj.map((item) => (
                                        <tr key={item.id} className="transition hover:bg-[#F8F9FA]">
                                            <td className="px-5 py-3">
                                                <p className="text-sm font-bold text-[#2A164E]">{item.tujuan}</p>
                                                <p className="mt-0.5 truncate text-xs text-gray-500 max-w-[250px]">{item.keperluan}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-700">
                                                {formatTanggalSingkat(item.tgl_mulai)} <span className="text-gray-400 mx-1">s/d</span> {formatTanggalSingkat(item.tgl_selesai)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-sm font-bold text-gray-800">
                                                {formatRupiah(item.total_biaya)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(item.status_approval)}`}>
                                                    {item.status_approval}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetailModal(item)}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-[#2A164E] hover:text-white hover:border-[#2A164E]"
                                                    >
                                                        Detail
                                                    </button>

                                                    {item.status_approval === "Menunggu Pelaporan" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openModalLapor(item.id)}
                                                            className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                                                        >
                                                            Lapor
                                                        </button>
                                                    )}
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

            {/* MODAL DETAIL SPJ */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                            <h3 className="text-lg font-bold text-[#2A164E]">Detail Perjalanan Dinas</h3>
                            <button onClick={closeDetailModal} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tujuan</p>
                                    <p className="text-sm font-bold text-[#2A164E]">{selectedDetail.tujuan}</p>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusStyle(selectedDetail.status_approval)}`}>
                                        {selectedDetail.status_approval}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Periode Pelaksanaan</p>
                                <div className="flex items-center gap-2 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-gray-700">{formatTanggalSingkat(selectedDetail.tgl_mulai)}</span>
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    <span className="text-sm font-semibold text-gray-700">{formatTanggalSingkat(selectedDetail.tgl_selesai)}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tugas & Keperluan</p>
                                <p className="text-sm leading-relaxed text-gray-700 bg-[#F8F9FA] p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">{selectedDetail.keperluan || "-"}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Rincian Anggaran</p>
                                <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                                    {selectedDetail.komponen_biaya && selectedDetail.komponen_biaya.length > 0 ? (
                                        <ul className="space-y-3">
                                            {selectedDetail.komponen_biaya.map((biaya) => (
                                                <li key={biaya.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                    <div>
                                                        <span className="block text-xs font-bold text-[#2A164E]">{biaya.jenis_biaya}</span>
                                                        <span className="text-[11px] text-gray-500 line-clamp-1">{biaya.keterangan || "-"}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-800">{formatRupiah(biaya.nominal)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-xs italic text-gray-400 py-2">Tidak ada rincian komponen biaya.</p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-[#2A164E]/20 bg-[#2A164E]/5 px-4 py-3.5 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#2A164E]">Total Anggaran</p>
                                <p className="text-xl font-black text-[#2A164E]">{formatRupiah(selectedDetail.total_biaya)}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end">
                            <button onClick={closeDetailModal} className="rounded-xl bg-[#2A164E] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#431D6D]">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LAPORAN PASCA-SPJ */}
            {showModalLapor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                            <h3 className="text-lg font-bold text-[#2A164E]">Form Laporan & Bon SPJ</h3>
                            <button onClick={closeModalLapor} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={submitLaporan}>
                            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-gray-700">Hasil Kunjungan / Evaluasi Pekerjaan <span className="text-rose-500">*</span></label>
                                    <textarea
                                        rows="4"
                                        value={data.laporan_hasil}
                                        onChange={(e) => setData("laporan_hasil", e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2A164E] focus:bg-white focus:ring-2 focus:ring-[#2A164E]/20"
                                        placeholder="Ketikkan kesimpulan dan hasil perjalanan dinas di sini..."
                                        required
                                    ></textarea>
                                    {errors.laporan_hasil && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.laporan_hasil}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold text-gray-700">Unggah Bukti Bon / Nota <span className="text-rose-500">*</span></label>
                                    
                                    {/* AREA UPLOAD YANG SUDAH DIPERBAIKI */}
                                    <div className={`rounded-xl border-2 border-dashed transition relative p-4 text-center ${data.file_bukti ? 'border-[#2A164E] bg-[#2A164E]/5' : 'border-gray-300 bg-gray-50 hover:border-[#2A164E]/50'}`}>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <div className="pointer-events-none">
                                            {data.file_bukti ? (
                                                // Tampilan Jika File Sudah Dipilih
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="mx-auto h-8 w-8 text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <p className="text-sm font-bold text-[#2A164E] break-all">{data.file_bukti.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{(data.file_bukti.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    <p className="text-[10px] text-emerald-600 font-bold mt-2">Klik untuk mengganti file</p>
                                                </div>
                                            ) : (
                                                // Tampilan Awal Sebelum Pilih File
                                                <>
                                                    <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    <p className="text-sm font-semibold text-[#2A164E]">Pilih File</p>
                                                    <p className="text-xs text-gray-500 mt-1">Maksimal 2MB (JPG, PNG, PDF)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {errors.file_bukti && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.file_bukti}</p>}

                                    {/* PREVIEW GAMBAR JIKA YANG DIUPLOAD ADALAH FOTO */}
                                    {filePreview && (
                                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Preview Gambar:</p>
                                            <img src={filePreview} alt="Preview Bon" className="w-full max-h-48 object-contain rounded-lg" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                                <button type="button" onClick={closeModalLapor} className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={processing} className="rounded-xl bg-[#F3B817] px-6 py-2.5 text-sm font-bold text-[#2A164E] shadow-sm transition hover:bg-[#e0a80e] disabled:opacity-70">
                                    {processing ? "Memproses..." : "Kirim Laporan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}