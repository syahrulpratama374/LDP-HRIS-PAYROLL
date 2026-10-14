import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function IndexCuti({ auth, riwayatCuti }) {
    const { flash } = usePage().props;

    const [selectedCuti, setSelectedCuti] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedDocument, setSelectedDocument] = useState(null);

    // =========================================================
    // FORMAT TANGGAL
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

    const formatTanggalPeriode = (tanggal) => {
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
    // SEARCH
    // =========================================================

    const filteredCuti = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return riwayatCuti;
        }

        return riwayatCuti.filter((cuti) => {
            const jenis = cuti.jenis_cuti?.toLowerCase() || "";
            const status = cuti.status_approval?.toLowerCase() || "";
            const alasan = cuti.alasan?.toLowerCase() || "";

            const tanggalPengajuan = formatTanggalLengkap(
                cuti.created_at,
            ).toLowerCase();

            const periodeMulai = formatTanggalPeriode(
                cuti.tanggal_mulai,
            ).toLowerCase();

            const periodeSelesai = formatTanggalPeriode(
                cuti.tanggal_selesai,
            ).toLowerCase();

            return (
                jenis.includes(keyword) ||
                status.includes(keyword) ||
                alasan.includes(keyword) ||
                tanggalPengajuan.includes(keyword) ||
                periodeMulai.includes(keyword) ||
                periodeSelesai.includes(keyword)
            );
        });
    }, [search, riwayatCuti]);

    // =========================================================
    // LAMPIRAN
    // =========================================================

    const getDocumentUrl = (path) => {
        return `/storage/${path}`;
    };

    const getFileExtension = (path) => {
        if (!path) return "";

        return path.split(".").pop()?.toLowerCase() || "";
    };

    const isPdf = (path) => {
        return getFileExtension(path) === "pdf";
    };

    const isImage = (path) => {
        return ["jpg", "jpeg", "png", "webp", "gif"].includes(
            getFileExtension(path),
        );
    };

    const openDocument = (cuti) => {
        if (!cuti?.dokumen_bukti_path) return;

        setSelectedDocument({
            url: getDocumentUrl(cuti.dokumen_bukti_path),
            path: cuti.dokumen_bukti_path,
            jenis: cuti.jenis_cuti,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Riwayat Cuti" />

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
                                    Riwayat Cuti & Izin
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
                                        Daftar Pengajuan Cuti & Izin
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
                                            <circle
                                                cx="11"
                                                cy="11"
                                                r="7"
                                            />
                                            <path d="m20 20-3.5-3.5" />
                                        </svg>

                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Cari pengajuan..."
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20 sm:text-sm"
                                        />
                                    </div>

                                    {/* TAMBAH PENGAJUAN */}
                                    <Link
                                        href={route("cuti.create")}
                                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#2A164E] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431D6D] sm:px-4 sm:text-sm"
                                    >
                                        <span className="mr-1.5 text-base leading-none">
                                            +
                                        </span>
                                        <span className="hidden sm:inline">
                                            Ajukan Cuti Baru
                                        </span>
                                        <span className="sm:hidden">
                                            Ajukan Cuti
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* HASIL SEARCH */}
                            {search && (
                                <p className="mt-2 text-[11px] text-gray-400">
                                    Menampilkan {filteredCuti.length} dari{" "}
                                    {riwayatCuti.length} pengajuan
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
                                            Jenis Cuti
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Periode
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
                                    {filteredCuti.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-8 text-center"
                                            >
                                                <p className="text-sm font-semibold text-gray-500">
                                                    {search
                                                        ? "Data pengajuan tidak ditemukan."
                                                        : "Belum ada riwayat pengajuan cuti."}
                                                </p>

                                                {search && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSearch("")
                                                        }
                                                        className="mt-2 text-xs font-semibold text-[#431D6D] hover:underline"
                                                    >
                                                        Hapus pencarian
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCuti.map((cuti) => (
                                            <tr
                                                key={cuti.id}
                                                className="transition hover:bg-[#F7F7FA]"
                                            >
                                                {/* TANGGAL PENGAJUAN */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {formatTanggalLengkap(
                                                        cuti.created_at,
                                                    )}
                                                </td>

                                                {/* JENIS CUTI */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <span className="text-sm font-semibold text-[#431D6D]">
                                                        {cuti.jenis_cuti}
                                                    </span>
                                                </td>

                                                {/* PERIODE */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {formatTanggalPeriode(
                                                        cuti.tanggal_mulai,
                                                    )}

                                                    <span className="mx-1.5 text-gray-400">
                                                        -
                                                    </span>

                                                    {formatTanggalPeriode(
                                                        cuti.tanggal_selesai,
                                                    )}
                                                </td>

                                                {/* STATUS */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                                            cuti.status_approval,
                                                        )}`}
                                                    >
                                                        {
                                                            cuti.status_approval
                                                        }
                                                    </span>
                                                </td>

                                                {/* AKSI */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedCuti(
                                                                cuti,
                                                            )
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
                MODAL DETAIL CUTI
            ========================================================== */}
            {selectedCuti && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#2A164E] to-[#431D6D] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3B817]">
                                    LDP HRIS
                                </p>

                                <h3 className="mt-0.5 text-base font-bold text-white">
                                    Detail Pengajuan Cuti
                                </h3>
                            </div>
                        </div>

                        {/* MODAL CONTENT */}
                        <div className="space-y-4 px-5 py-5">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Jenis Cuti
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[#431D6D]">
                                        {selectedCuti.jenis_cuti}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Status
                                    </p>

                                    <span
                                        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                            selectedCuti.status_approval,
                                        )}`}
                                    >
                                        {selectedCuti.status_approval}
                                    </span>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Periode
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {formatTanggalPeriode(
                                            selectedCuti.tanggal_mulai,
                                        )}{" "}
                                        <span className="mx-1 text-gray-400">
                                            -
                                        </span>{" "}
                                        {formatTanggalPeriode(
                                            selectedCuti.tanggal_selesai,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* ALASAN */}
                            <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Alasan Pengajuan
                                </p>

                                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-[#F7F7FA] px-3.5 py-3 text-sm leading-relaxed text-gray-700">
                                    {selectedCuti.alasan || "-"}
                                </div>
                            </div>

                            {/* LAMPIRAN */}
                            {selectedCuti.dokumen_bukti_path && (
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Lampiran / Surat Dokter
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openDocument(selectedCuti)
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-[#431D6D]/20 bg-[#F3EDF8] px-3.5 py-2 text-xs font-semibold text-[#431D6D] transition hover:bg-[#EDE2F3]"
                                    >
                                        {/* DOWNLOAD ICON */}
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M12 3v12" />
                                            <path d="m7 10 5 5 5-5" />
                                            <path d="M5 21h14" />
                                        </svg>

                                        Lihat / Unduh Lampiran
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-5 py-3.5">
                            <button
                                type="button"
                                onClick={() => setSelectedCuti(null)}
                                className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg bg-[#2A164E] px-4 text-sm font-semibold text-white transition hover:bg-[#431D6D]"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL PREVIEW DOKUMEN
            ========================================================== */}
            {selectedDocument && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 sm:p-5">
                    <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* DOCUMENT HEADER */}
                        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#2A164E] to-[#431D6D] px-4 py-3 sm:px-5">
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#F3B817]">
                                    Lampiran Pengajuan
                                </p>

                                <h3 className="truncate text-sm font-bold text-white sm:text-base">
                                    {selectedDocument.jenis}
                                </h3>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {/* DOWNLOAD */}
                                <a
                                    href={selectedDocument.url}
                                    download
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-[#2A164E] transition hover:bg-gray-100"
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
                                        <path d="M12 3v12" />
                                        <path d="m7 10 5 5 5-5" />
                                        <path d="M5 21h14" />
                                    </svg>

                                    <span className="hidden sm:inline">
                                        Download
                                    </span>
                                </a>

                                {/* CLOSE */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedDocument(null)
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-white/80 transition hover:bg-white/10 hover:text-white"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* DOCUMENT PREVIEW */}
                        <div className="min-h-0 flex-1 bg-[#F7F7FA] p-2 sm:p-4">
                            {isImage(selectedDocument.path) ? (
                                <div className="flex h-full items-center justify-center overflow-auto rounded-lg border border-gray-200 bg-white p-2">
                                    <img
                                        src={selectedDocument.url}
                                        alt="Lampiran pengajuan cuti"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            ) : isPdf(selectedDocument.path) ? (
                                <iframe
                                    src={selectedDocument.url}
                                    title="Preview dokumen PDF"
                                    className="h-full w-full rounded-lg border border-gray-200 bg-white"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-center">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            Preview tidak tersedia
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Format file ini tidak dapat
                                            ditampilkan langsung.
                                        </p>

                                        <a
                                            href={selectedDocument.url}
                                            download
                                            className="mt-3 inline-flex h-9 items-center rounded-lg bg-[#2A164E] px-4 text-xs font-semibold text-white hover:bg-[#431D6D]"
                                        >
                                            Download File
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}