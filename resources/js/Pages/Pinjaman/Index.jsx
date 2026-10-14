import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Index({ auth, pinjaman = [] }) {
    const { flash } = usePage().props;

    // =========================================================
    // STATE
    // =========================================================
    const [search, setSearch] = useState("");
    const [selectedPinjaman, setSelectedPinjaman] = useState(null);

    // =========================================================
    // FORMATTERS
    // =========================================================
    const formatTanggalLengkap = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date)) return tanggal;
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka || 0);
    };

    const getStatusStyle = (status) => {
        if (status === "Lunas" || status === "Disetujui") {
            return "border-green-200 bg-green-50 text-green-700";
        }
        if (status === "Berjalan") {
            return "border-blue-200 bg-blue-50 text-blue-700";
        }
        if (status === "Ditolak") {
            return "border-red-200 bg-red-50 text-red-700";
        }
        if (status === "Menunggu Pencairan") {
            return "border-orange-200 bg-orange-50 text-orange-700";
        }
        if (status === "Menunggu Approval Direktur") {
            return "border-[#431D6D]/20 bg-[#F3EDF8] text-[#431D6D]";
        }
        return "border-yellow-200 bg-yellow-50 text-yellow-700"; // Pending
    };

    // =========================================================
    // SEARCH
    // =========================================================
    const filteredPinjaman = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return pinjaman;
        }

        return pinjaman.filter((p) => {
            const status = p.status?.toLowerCase() || "";
            const tanggalPengajuan = formatTanggalLengkap(p.created_at).toLowerCase();
            const total = p.total_pinjaman?.toString() || "";

            return (
                status.includes(keyword) ||
                tanggalPengajuan.includes(keyword) ||
                total.includes(keyword)
            );
        });
    }, [search, pinjaman]);

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Riwayat Kasbon & Pinjaman" />

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
                                    Riwayat Kasbon & Pinjaman
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                    {/* FLASH */}
                    {flash?.success && (
                        <div
                            className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700 sm:text-sm"
                            role="alert"
                        >
                            <span className="font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* =================================================
                        MAIN CARD
                    ================================================== */}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        {/* CARD HEADER */}
                        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                {/* TITLE */}
                                <div className="shrink-0">
                                    <h2 className="text-base font-bold text-[#2A164E] sm:text-lg">
                                        Daftar Pengajuan Kasbon
                                    </h2>
                                </div>

                                {/* SEARCH + BUTTON */}
                                <div className="flex w-full items-center gap-2 lg:w-auto">
                                    {/* SEARCH */}
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
                                            placeholder="Cari pengajuan..."
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20 sm:text-sm"
                                        />
                                    </div>

                                    {/* TAMBAH PENGAJUAN */}
                                    <Link
                                        href={route("pinjaman.create")}
                                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#2A164E] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431D6D] sm:px-4 sm:text-sm"
                                    >
                                        <span className="mr-1.5 text-base leading-none">
                                            +
                                        </span>
                                        <span className="hidden sm:inline">
                                            Ajukan Pinjaman Baru
                                        </span>
                                        <span className="sm:hidden">
                                            Ajukan Pinjaman
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* HASIL SEARCH */}
                            {search && (
                                <p className="mt-2 text-[11px] text-gray-400">
                                    Menampilkan {filteredPinjaman.length} dari{" "}
                                    {pinjaman.length} pengajuan
                                </p>
                            )}
                        </div>

                        {/* =================================================
                            TABLE
                        ================================================== */}
                        <div className="overflow-x-auto">
                            <table className="min-w-[850px] w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Tgl Pengajuan
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Total Pinjaman
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Tenor
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Sisa Hutang
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredPinjaman.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"   
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                <p className="text-sm font-semibold text-gray-500">
                                                    {search
                                                        ? "Data pengajuan tidak ditemukan."
                                                        : "Belum ada riwayat pengajuan pinjaman/kasbon."}
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
                                        filteredPinjaman.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="transition hover:bg-[#F7F7FA]"
                                            >
                                                {/* TANGGAL PENGAJUAN */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {formatTanggalLengkap(p.created_at)}
                                                </td>

                                                {/* TOTAL PINJAMAN */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {formatRupiah(p.total_pinjaman)}
                                                    </span>
                                                </td>

                                                {/* TENOR */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {p.tenor_bulan} Bulan
                                                </td>

                                                {/* SISA HUTANG */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <span className="text-sm font-semibold text-red-600">
                                                        {formatRupiah(p.sisa_pinjaman)}
                                                    </span>
                                                </td>

                                                {/* STATUS */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                                            p.status
                                                        )}`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>

                                                {/* AKSI */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPinjaman(p)}
                                                        className="rounded-lg border border-[#431D6D]/20 bg-[#F3EDF8] px-3 py-1.5 text-xs font-semibold text-[#431D6D] transition hover:bg-[#EDE2F3]"
                                                    >
                                                        Lihat Detail
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
            </div>

            {/* =========================================================
                MODAL DETAIL PINJAMAN
            ========================================================== */}
            {selectedPinjaman && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#2A164E] to-[#431D6D] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3B817]">
                                    LDP HRIS
                                </p>
                                <h3 className="mt-0.5 text-base font-bold text-white">
                                    Detail Pengajuan Pinjaman
                                </h3>
                            </div>
                        </div>

                        {/* MODAL CONTENT */}
                        <div className="space-y-4 px-5 py-5">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Tanggal Pengajuan
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[#431D6D]">
                                        {formatTanggalLengkap(selectedPinjaman.created_at)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Status
                                    </p>
                                    <span
                                        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                            selectedPinjaman.status
                                        )}`}
                                    >
                                        {selectedPinjaman.status}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Total Pinjaman
                                    </p>
                                    <p className="mt-1 text-base font-bold text-gray-800">
                                        {formatRupiah(selectedPinjaman.total_pinjaman)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Tenor Cicilan
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {selectedPinjaman.tenor_bulan} Bulan
                                    </p>
                                </div>
                            </div>

                            {/* SISA HUTANG */}
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                    Sisa Hutang Saat Ini
                                </p>
                                <p className="text-lg font-extrabold text-red-700">
                                    {formatRupiah(selectedPinjaman.sisa_pinjaman)}
                                </p>
                            </div>
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-5 py-3.5">
                            <button
                                type="button"
                                onClick={() => setSelectedPinjaman(null)}
                                className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg bg-[#2A164E] px-4 text-sm font-semibold text-white transition hover:bg-[#431D6D]"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}