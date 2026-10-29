import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Index({ auth, pinjaman = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [selectedPinjaman, setSelectedPinjaman] = useState(null);

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
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
    };

    const filteredPinjaman = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return pinjaman;

        return pinjaman.filter((p) => {
            const status = p.status?.toLowerCase() || "";
            const tanggalPengajuan = formatTanggalLengkap(
                p.created_at,
            ).toLowerCase();
            const total = p.total_pinjaman?.toString() || "";
            const jenis = p.jenis_kasbon?.toLowerCase() || "";

            return (
                status.includes(keyword) ||
                tanggalPengajuan.includes(keyword) ||
                total.includes(keyword) ||
                jenis.includes(keyword)
            );
        });
    }, [search, pinjaman]);

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Riwayat Kasbon & Pinjaman" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* HEADER */}
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

                {/* CONTENT */}
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                    {flash?.success && (
                        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700 sm:text-sm">
                            <span className="font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <h2 className="text-base font-bold text-[#2A164E] sm:text-lg">
                                    Daftar Pengajuan Kasbon Anda
                                </h2>

                                <div className="flex w-full items-center gap-2 lg:w-auto">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari pengajuan..."
                                        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-xs text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20 sm:text-sm"
                                    />

                                    <Link
                                        href={route("pinjaman.create")}
                                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#2A164E] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431D6D] sm:px-4 sm:text-sm"
                                    >
                                        + Ajukan Pinjaman
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto">
                            <table className="min-w-[850px] w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                            Sumber & Tanggal
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                            Total Pinjaman
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                            Tenor
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                            Sisa Hutang
                                        </th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredPinjaman.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500 text-sm"
                                            >
                                                Belum ada riwayat pengajuan
                                                kasbon.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPinjaman.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="transition hover:bg-[#F7F7FA]"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <span className="font-bold text-[#2A164E]">
                                                        Kas{" "}
                                                        {p.jenis_kasbon ||
                                                            "Finance"}
                                                    </span>
                                                    <p className="text-xs text-gray-400">
                                                        {formatTanggalLengkap(
                                                            p.created_at,
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {formatRupiah(
                                                            p.total_pinjaman,
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {p.tenor_bulan} Bulan
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-semibold text-red-600">
                                                        {formatRupiah(
                                                            p.sisa_pinjaman,
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(p.status)}`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedPinjaman(
                                                                p,
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

            {/* MODAL DETAIL PINJAMAN & JADWAL CICILAN */}
            {selectedPinjaman && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D] px-5 py-4 text-white flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3B817]">
                                    LDP HRIS
                                </p>
                                <h3 className="text-base font-bold">
                                    Detail Kasbon (
                                    {selectedPinjaman.jenis_kasbon || "Finance"}
                                    )
                                </h3>
                            </div>
                            <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusStyle(selectedPinjaman.status)}`}
                            >
                                {selectedPinjaman.status}
                            </span>
                        </div>

                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border text-xs">
                                <div>
                                    <p className="text-gray-400 font-bold uppercase">
                                        Tanggal Pengajuan
                                    </p>
                                    <p className="font-semibold text-gray-800">
                                        {formatTanggalLengkap(
                                            selectedPinjaman.created_at,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase">
                                        Keperluan
                                    </p>
                                    <p className="font-semibold text-gray-800">
                                        {selectedPinjaman.alasan_pinjaman ||
                                            "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase">
                                        Total Pinjaman
                                    </p>
                                    <p className="font-bold text-indigo-600 text-sm">
                                        {formatRupiah(
                                            selectedPinjaman.total_pinjaman,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase">
                                        Sisa Hutang
                                    </p>
                                    <p className="font-bold text-red-600 text-sm">
                                        {formatRupiah(
                                            selectedPinjaman.sisa_pinjaman,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* TABEL JADWAL CICILAN */}
                            <div>
                                <h4 className="font-bold text-xs text-[#2A164E] uppercase mb-2">
                                    Jadwal Pemotongan / Angsuran
                                </h4>
                                {selectedPinjaman.cicilans &&
                                selectedPinjaman.cicilans.length > 0 ? (
                                    <table className="w-full text-xs text-left border">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 border">
                                                    Bulan Ke
                                                </th>
                                                <th className="p-2 border">
                                                    Jatuh Tempo
                                                </th>
                                                <th className="p-2 border">
                                                    Nominal
                                                </th>
                                                <th className="p-2 border">
                                                    Status
                                                </th>
                                                <th className="p-2 border">
                                                    Metode
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPinjaman.cicilans.map(
                                                (c, idx) => (
                                                    <tr
                                                        key={c.id}
                                                        className="border-b"
                                                    >
                                                        <td className="p-2 border font-bold">
                                                            #{idx + 1}
                                                        </td>
                                                        <td className="p-2 border">
                                                            {formatTanggalLengkap(
                                                                c.jatuh_tempo,
                                                            )}
                                                        </td>
                                                        <td className="p-2 border font-semibold">
                                                            {formatRupiah(
                                                                c.nominal_cicilan,
                                                            )}
                                                        </td>
                                                        <td className="p-2 border">
                                                            <span
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status_bayar === "Lunas" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                                                            >
                                                                {c.status_bayar}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 border text-gray-500">
                                                            {c.metode_pelunasan ||
                                                                "Potong Gaji"}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded text-center border">
                                        Jadwal cicilan akan otomatis dibuat
                                        setelah kasbon disetujui oleh Finance /
                                        Kepala Divisi.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end border-t bg-gray-50 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => setSelectedPinjaman(null)}
                                className="px-4 py-2 bg-[#2A164E] text-white text-xs font-bold rounded-lg hover:bg-[#431D6D]"
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
