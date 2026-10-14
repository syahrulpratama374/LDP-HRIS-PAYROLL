import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function AdminIndex({ auth, pengajuan = [] }) {
    // =========================================================
    // STATE
    // =========================================================
    const [search, setSearch] = useState("");

    // =========================================================
    // FUNGSI ACTION
    // =========================================================
    const handleApproval = (id, status, namaKaryawan) => {
        if (
            confirm(
                `Anda yakin ingin ${status.toUpperCase()} pengajuan cuti dari ${namaKaryawan}?`
            )
        ) {
            router.patch(
                route("admin.cuti.status", id),
                {
                    status_approval: status,
                },
                {
                    preserveScroll: true,
                }
            );
        }
    };

    // =========================================================
    // FORMAT TANGGAL
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

    // =========================================================
    // STATUS
    // =========================================================
    const getStatusStyle = (status) => {
        if (status === "Disetujui") {
            return "border-green-200 bg-green-50 text-green-700";
        }
        if (status === "Ditolak") {
            return "border-red-200 bg-red-50 text-red-700";
        }
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
    };

    // =========================================================
    // SEARCH FILTER
    // =========================================================
    const filteredPengajuan = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return pengajuan;

        return pengajuan.filter((item) => {
            const nama = item.karyawan?.nama_lengkap?.toLowerCase() || "";
            const jabatan = item.karyawan?.jabatan?.nama_jabatan?.toLowerCase() || "";
            const jenisCuti = item.jenis_cuti?.toLowerCase() || "";
            const status = item.status_approval?.toLowerCase() || "";
            const alasan = item.alasan?.toLowerCase() || "";
            const tglMulai = formatTanggalSingkat(item.tanggal_mulai).toLowerCase();
            const tglSelesai = formatTanggalSingkat(item.tanggal_selesai).toLowerCase();

            return (
                nama.includes(keyword) ||
                jabatan.includes(keyword) ||
                jenisCuti.includes(keyword) ||
                status.includes(keyword) ||
                alasan.includes(keyword) ||
                tglMulai.includes(keyword) ||
                tglSelesai.includes(keyword)
            );
        });
    }, [search, pengajuan]);

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Approval Cuti Tim" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* =====================================================
                    HEADER
                ====================================================== */}
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[76px] items-center justify-center py-4">
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>

                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    Approval Cuti Tim (Tier-1)
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                    
                    {/* =================================================
                        MAIN CARD
                    ================================================== */}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        
                        {/* CARD HEADER & SEARCHBAR */}
                        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                {/* TITLE & SUBTITLE */}
                                <div className="shrink-0">
                                    <h2 className="text-base font-bold text-[#2A164E] sm:text-lg">
                                        Daftar Pengajuan Cuti Bawahan
                                    </h2>
                                    <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                                        Persetujuan ini akan memicu sistem untuk memotong saldo cuti tahunan Karyawan terkait.
                                    </p>
                                </div>

                                {/* SEARCHBAR */}
                                <div className="flex w-full items-center gap-2 lg:w-auto">
                                    <div className="relative min-w-0 flex-1 lg:w-[300px] lg:flex-none">
                                        <svg
                                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="11" cy="11" r="7" />
                                            <path d="m20 20-3.5-3.5" />
                                        </svg>

                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari karyawan atau cuti..."
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20 sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* HASIL SEARCH */}
                            {search && (
                                <p className="mt-2 text-[11px] text-gray-400">
                                    Menampilkan {filteredPengajuan.length} dari {pengajuan.length} pengajuan
                                </p>
                            )}
                        </div>

                        {/* =================================================
                            TABLE
                        ================================================== */}
                        <div className="overflow-x-auto">
                            <table className="min-w-[760px] w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Karyawan
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Detail Cuti
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5 w-1/3">
                                            Alasan
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Status
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredPengajuan.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-8 text-center">
                                                <p className="text-sm font-semibold text-gray-500">
                                                    {search
                                                        ? "Data pengajuan tidak ditemukan."
                                                        : "Tidak ada pengajuan cuti dari tim Anda saat ini."}
                                                </p>

                                                {search && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearch("")}
                                                        className="mt-2 text-xs font-semibold text-[#431D6D] hover:underline"
                                                    >
                                                        Hapus pencarian
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPengajuan.map((item) => (
                                            <tr key={item.id} className="transition hover:bg-[#F7F7FA]">
                                                {/* KARYAWAN */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <div className="text-sm font-bold text-gray-800">
                                                        {item.karyawan?.nama_lengkap}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-gray-500">
                                                        {item.karyawan?.jabatan?.nama_jabatan || "Staff"}
                                                    </div>
                                                </td>

                                                {/* DETAIL CUTI */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <div className="text-sm font-semibold text-[#431D6D]">
                                                        {item.jenis_cuti}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-gray-600">
                                                        {formatTanggalSingkat(item.tanggal_mulai)} 
                                                        <span className="mx-1 text-gray-400">-</span> 
                                                        {formatTanggalSingkat(item.tanggal_selesai)}
                                                    </div>
                                                </td>

                                                {/* ALASAN */}
                                                <td className="px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    <p className="line-clamp-2 max-w-xs text-xs" title={item.alasan}>
                                                        {item.alasan || "-"}
                                                    </p>
                                                </td>

                                                {/* STATUS */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(item.status_approval)}`}>
                                                        {item.status_approval}
                                                    </span>
                                                </td>

                                                {/* AKSI */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    {item.status_approval === "Pending" ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* Tombol Setuju */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApproval(item.id, "Disetujui", item.karyawan?.nama_lengkap)}
                                                                className="flex h-7 w-7 items-center justify-center rounded border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-600 hover:text-white"
                                                                title="Setujui"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>

                                                            {/* Tombol Tolak */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApproval(item.id, "Ditolak", item.karyawan?.nama_lengkap)}
                                                                className="flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                                                                title="Tolak"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] italic text-gray-400 font-medium">
                                                            Sudah Diproses
                                                        </span>
                                                    )}
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