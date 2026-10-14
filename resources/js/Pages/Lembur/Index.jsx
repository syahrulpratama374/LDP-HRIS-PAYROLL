import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Index({ auth, riwayatLembur = [] }) {
    const { flash } = usePage().props || {};

    // =========================================================
    // STATE
    // =========================================================

    const [search, setSearch] = useState("");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    // =========================================================
    // FORMAT
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
        if (status === "Disetujui") {
            return "border-green-200 bg-green-50 text-green-700";
        }

        if (status === "Ditolak") {
            return "border-red-200 bg-red-50 text-red-700";
        }

        return "border-yellow-200 bg-yellow-50 text-yellow-700";
    };

    // =========================================================
    // SEARCH
    // =========================================================

    const filteredLembur = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return riwayatLembur;

        return riwayatLembur.filter((lembur) => {
            const status = lembur.status_approval?.toLowerCase() || "";
            const deskripsi = lembur.deskripsi_pekerjaan?.toLowerCase() || "";

            const tanggalPengajuan = formatTanggalLengkap(
                lembur.created_at
            ).toLowerCase();

            const tanggalLembur = formatTanggalLengkap(
                lembur.tanggal
            ).toLowerCase();

            const jamMulai = lembur.jam_mulai?.toLowerCase() || "";
            const jamSelesai = lembur.jam_selesai?.toLowerCase() || "";

            return (
                status.includes(keyword) ||
                deskripsi.includes(keyword) ||
                tanggalPengajuan.includes(keyword) ||
                tanggalLembur.includes(keyword) ||
                jamMulai.includes(keyword) ||
                jamSelesai.includes(keyword)
            );
        });
    }, [search, riwayatLembur]);

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
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Riwayat Pengajuan Lembur" />

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
                                    Riwayat Pengajuan Lembur
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
                                        Daftar Pengajuan Lembur
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
                                        href={route("lembur.create")}
                                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#2A164E] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431D6D] sm:px-4 sm:text-sm"
                                    >
                                        <span className="mr-1.5 text-base leading-none">
                                            +
                                        </span>
                                        <span className="hidden sm:inline">
                                            Ajukan Lembur Baru
                                        </span>
                                        <span className="sm:hidden">
                                            Ajukan Lembur
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* HASIL SEARCH */}
                            {search && (
                                <p className="mt-2 text-[11px] text-gray-400">
                                    Menampilkan {filteredLembur.length} dari{" "}
                                    {riwayatLembur.length} pengajuan
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
                                            Tgl Pengajuan
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Tanggal Lembur
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Jam
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
                                    {filteredLembur.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-8 text-center"
                                            >
                                                <p className="text-sm font-semibold text-gray-500">
                                                    {search
                                                        ? "Data pengajuan tidak ditemukan."
                                                        : "Belum ada riwayat pengajuan lembur."}
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
                                        filteredLembur.map((lembur) => (
                                            <tr
                                                key={lembur.id}
                                                className="transition hover:bg-[#F7F7FA]"
                                            >
                                                {/* TANGGAL PENGAJUAN */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {formatTanggalLengkap(
                                                        lembur.created_at,
                                                    )}
                                                </td>

                                                {/* TANGGAL LEMBUR */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <span className="text-sm font-semibold text-[#431D6D]">
                                                        {formatTanggalSingkat(
                                                            lembur.tanggal,
                                                        )}
                                                    </span>
                                                </td>

                                                {/* JAM */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {lembur.jam_mulai}
                                                    <span className="mx-1.5 text-gray-400">
                                                        -
                                                    </span>
                                                    {lembur.jam_selesai}
                                                </td>

                                                {/* STATUS */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                                            lembur.status_approval,
                                                        )}`}
                                                    >
                                                        {lembur.status_approval}
                                                    </span>
                                                </td>

                                                {/* AKSI */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetailModal(lembur)
                                                        }
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
                MODAL DETAIL LEMBUR
            ========================================================== */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#2A164E] to-[#431D6D] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3B817]">
                                    LDP HRIS
                                </p>

                                <h3 className="mt-0.5 text-base font-bold text-white">
                                    Detail Pengajuan Lembur
                                </h3>
                            </div>
                        </div>

                        {/* MODAL CONTENT */}
                        <div className="space-y-4 px-5 py-5">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Tanggal Lembur
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[#431D6D]">
                                        {formatTanggalLengkap(
                                            selectedDetail.tanggal
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Status
                                    </p>

                                    <span
                                        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                            selectedDetail.status_approval,
                                        )}`}
                                    >
                                        {selectedDetail.status_approval}
                                    </span>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Jam Lembur
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {selectedDetail.jam_mulai}
                                        <span className="mx-1 text-gray-400">
                                            -
                                        </span>
                                        {selectedDetail.jam_selesai}
                                    </p>
                                </div>
                            </div>

                            {/* TANGGAL PENGAJUAN */}
                            <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Tanggal Pengajuan
                                </p>

                                <div className="rounded-lg border border-gray-100 bg-[#F7F7FA] px-3.5 py-3 text-sm leading-relaxed text-gray-700">
                                    {formatTanggalLengkap(selectedDetail.created_at)}
                                </div>
                            </div>

                            {/* DESKRIPSI */}
                            <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Deskripsi Pekerjaan
                                </p>

                                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-[#F7F7FA] px-3.5 py-3 text-sm leading-relaxed text-gray-700">
                                    {selectedDetail.deskripsi_pekerjaan || "-"}
                                </div>
                            </div>
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-5 py-3.5">
                            <button
                                type="button"
                                onClick={closeDetailModal}
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