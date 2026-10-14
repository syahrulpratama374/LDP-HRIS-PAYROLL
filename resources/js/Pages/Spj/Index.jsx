import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

export default function Index({ auth, spj = [], adaUtangLaporan }) {
    const { flash } = usePage().props || {};

    // =========================================================
    // STATE
    // =========================================================
    const [search, setSearch] = useState("");

    // State untuk Laporan
    const [showModalLapor, setShowModalLapor] = useState(false);
    const [selectedSpjId, setSelectedSpjId] = useState(null);

    // State untuk Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        laporan_hasil: "",
        file_bukti: null,
    });

    // =========================================================
    // FORMATTERS
    // =========================================================
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
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
        switch (status) {
            case "Selesai":
            case "Disetujui":
                return "border-green-200 bg-green-50 text-green-700";
            case "Pending":
                return "border-yellow-200 bg-yellow-50 text-yellow-700";
            case "Menunggu Pelaporan":
                return "border-orange-200 bg-orange-50 text-orange-700";
            case "Menunggu Validasi Finance":
                return "border-[#431D6D]/20 bg-[#F3EDF8] text-[#431D6D]";
            case "Ditolak":
                return "border-red-200 bg-red-50 text-red-700";
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

            return (
                tujuan.includes(keyword) ||
                keperluan.includes(keyword) ||
                status.includes(keyword)
            );
        });
    }, [search, spj]);

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
        reset();
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
        <AuthenticatedLayout user={auth?.user}>
            <Head title="SPJ Karyawan" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* =====================================================
                    HEADER BANNER
                ====================================================== */}
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[76px] items-center justify-center py-4">
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>
                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    Riwayat Perjalanan Dinas (SPJ)
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                    {/* FLASH MESSAGE */}
                    {flash?.success && (
                        <div
                            className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700 sm:text-sm"
                            role="alert"
                        >
                            <span className="font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* BANNER PERINGATAN UTANG LAPORAN */}
                    {adaUtangLaporan && (
                        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-red-800">
                                    Akses Pengajuan Baru Dikunci!
                                </h3>
                                <p className="mt-1 text-xs text-red-700 sm:text-sm">
                                    Anda memiliki jadwal perjalanan dinas yang
                                    sudah selesai namun{" "}
                                    <strong>belum dilaporkan</strong>. Harap
                                    unggah laporan hasil dan bukti bon pada
                                    tabel di bawah agar Anda dapat membuat
                                    pengajuan SPJ baru.
                                </p>
                            </div>
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
                                        Daftar Pengajuan SPJ
                                    </h2>
                                </div>

                                {/* SEARCH & ACTION BUTTON */}
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
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Cari pengajuan..."
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20 sm:text-sm"
                                        />
                                    </div>

                                    {/* TAMBAH PENGAJUAN */}
                                    {!adaUtangLaporan ? (
                                        <Link
                                            href={route("spj.create")}
                                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#2A164E] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431D6D] sm:px-4 sm:text-sm"
                                        >
                                            <span className="mr-1.5 text-base leading-none">
                                                +
                                            </span>
                                            <span className="hidden sm:inline">
                                                Ajukan SPJ Baru
                                            </span>
                                            <span className="sm:hidden">
                                                Ajukan SPJ
                                            </span>
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-gray-300 px-3 text-xs font-semibold text-gray-500 shadow-sm sm:px-4 sm:text-sm"
                                        >
                                            <span className="mr-1.5 text-base leading-none">
                                                +
                                            </span>
                                            <span className="hidden sm:inline">
                                                Ajukan SPJ Baru
                                            </span>
                                            <span className="sm:hidden">
                                                Ajukan SPJ
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* HASIL SEARCH */}
                            {search && (
                                <p className="mt-2 text-[11px] text-gray-400">
                                    Menampilkan {filteredSpj.length} dari{" "}
                                    {spj.length} pengajuan
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
                                            Tujuan & Keperluan
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Periode Dinas
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:px-5">
                                            Total Biaya
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
                                    {filteredSpj.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-8 text-center"
                                            >
                                                <p className="text-sm font-semibold text-gray-500">
                                                    {search
                                                        ? "Data pengajuan SPJ tidak ditemukan."
                                                        : "Belum ada riwayat pengajuan SPJ."}
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
                                        filteredSpj.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-[#F7F7FA]"
                                            >
                                                {/* TUJUAN & KEPERLUAN */}
                                                <td className="px-4 py-3 sm:px-5">
                                                    <p className="text-sm font-bold text-[#431D6D]">
                                                        {item.tujuan}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-gray-500 max-w-[200px] sm:max-w-[250px]">
                                                        {item.keperluan}
                                                    </p>
                                                </td>

                                                {/* PERIODE */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-5">
                                                    {formatTanggalSingkat(
                                                        item.tgl_mulai,
                                                    )}
                                                    <span className="mx-1.5 text-gray-400">
                                                        -
                                                    </span>
                                                    {formatTanggalSingkat(
                                                        item.tgl_selesai,
                                                    )}
                                                </td>

                                                {/* TOTAL BIAYA */}
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {formatRupiah(
                                                            item.total_biaya,
                                                        )}
                                                    </span>
                                                </td>

                                                {/* STATUS */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                                                            item.status_approval,
                                                        )}`}
                                                    >
                                                        {item.status_approval}
                                                    </span>
                                                </td>

                                                {/* AKSI */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center sm:px-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDetailModal(
                                                                    item,
                                                                )
                                                            }
                                                            className="rounded-lg border border-[#431D6D]/20 bg-[#F3EDF8] px-3 py-1.5 text-xs font-semibold text-[#431D6D] transition hover:bg-[#EDE2F3]"
                                                        >
                                                            Lihat Detail
                                                        </button>

                                                        {item.status_approval ===
                                                            "Menunggu Pelaporan" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openModalLapor(
                                                                        item.id,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-100"
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
            </div>

            {/* =========================================================
                MODAL DETAIL SPJ
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
                                    Detail Perjalanan Dinas (SPJ)
                                </h3>
                            </div>
                        </div>

                        {/* MODAL CONTENT */}
                        <div className="space-y-4 px-5 py-5">
                            {/* TUJUAN & STATUS */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        Tujuan / Kota
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[#431D6D]">
                                        {selectedDetail.tujuan}
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
                                        Periode Pelaksanaan
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {formatTanggalSingkat(
                                            selectedDetail.tgl_mulai,
                                        )}{" "}
                                        <span className="mx-1 text-gray-400">
                                            -
                                        </span>{" "}
                                        {formatTanggalSingkat(
                                            selectedDetail.tgl_selesai,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* KEPERLUAN */}
                            <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Tugas & Keperluan
                                </p>
                                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-[#F7F7FA] px-3.5 py-3 text-sm leading-relaxed text-gray-700">
                                    {selectedDetail.keperluan || "-"}
                                </div>
                            </div>

                            {/* RINCIAN KOMPONEN BIAYA (TAMBAHAN DARI ADMIN) */}
                            <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Rincian Anggaran
                                </p>
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                                    {selectedDetail.komponen_biaya &&
                                    selectedDetail.komponen_biaya.length > 0 ? (
                                        <ul className="space-y-3">
                                            {selectedDetail.komponen_biaya.map(
                                                (biaya) => (
                                                    <li
                                                        key={biaya.id}
                                                        className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                                                    >
                                                        <div>
                                                            <span className="block text-xs font-bold text-[#431D6D]">
                                                                {
                                                                    biaya.jenis_biaya
                                                                }
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 line-clamp-1">
                                                                {biaya.keterangan ||
                                                                    "-"}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {formatRupiah(
                                                                biaya.nominal,
                                                            )}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-xs italic text-gray-400 py-2">
                                            Tidak ada rincian komponen biaya.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* TOTAL BIAYA */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3.5 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                    Total Anggaran
                                </p>
                                <p className="text-lg font-extrabold text-[#2A164E]">
                                    {formatRupiah(selectedDetail.total_biaya)}
                                </p>
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

            {/* =========================================================
                MODAL LAPORAN PASCA-SPJ
            ========================================================== */}
            {showModalLapor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#2A164E] to-[#431D6D] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3B817]">
                                    LDP HRIS
                                </p>
                                <h3 className="mt-0.5 text-base font-bold text-white">
                                    Form Laporan & Bon SPJ
                                </h3>
                            </div>
                        </div>

                        {/* MODAL CONTENT */}
                        <form onSubmit={submitLaporan}>
                            <div className="space-y-4 px-5 py-5">
                                {/* TEXTAREA LAPORAN */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                        Hasil Kunjungan / Evaluasi Pekerjaan
                                    </label>
                                    <textarea
                                        rows="4"
                                        value={data.laporan_hasil}
                                        onChange={(e) =>
                                            setData(
                                                "laporan_hasil",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-200 bg-[#F7F7FA] px-3.5 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                        placeholder="Ketikkan kesimpulan dan hasil perjalanan dinas di sini..."
                                        required
                                    ></textarea>
                                    {errors.laporan_hasil && (
                                        <p className="mt-1 text-xs text-red-500 font-semibold">
                                            {errors.laporan_hasil}
                                        </p>
                                    )}
                                </div>

                                {/* FILE BUKTI */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                        Unggah Bukti Bon / Nota
                                    </label>
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-[#F7F7FA] p-4 text-center">
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                setData(
                                                    "file_bukti",
                                                    e.target.files[0],
                                                )
                                            }
                                            className="block w-full text-xs text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#F3EDF8] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#431D6D] hover:file:bg-[#EDE2F3] cursor-pointer"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-gray-400">
                                        Maksimal ukuran file: 2MB (JPG, PNG,
                                        PDF)
                                    </p>
                                    {errors.file_bukti && (
                                        <p className="mt-1 text-xs text-red-500 font-semibold">
                                            {errors.file_bukti}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-3.5">
                                <button
                                    type="button"
                                    onClick={closeModalLapor}
                                    className="inline-flex h-10 min-w-[90px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg bg-[#2A164E] px-4 text-sm font-semibold text-white transition hover:bg-[#431D6D] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {processing
                                        ? "Memproses..."
                                        : "Kirim Laporan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
