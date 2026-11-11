import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import BannerHeader from "@/Components/BannerHeader";

export default function Index({
    auth,
    absensiList = [],
    stats = {},
    filters = {},
    departemens = [],
}) {
    const [tanggal, setTanggal] = useState(
        filters.tanggal || new Date().toISOString().split("T")[0],
    );
    const [departemenId, setDepartemenId] = useState(
        filters.departemen_id || "",
    );
    const [search, setSearch] = useState(filters.search || "");
    const [activeTab, setActiveTab] = useState("semua");

    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            route("absensi.index"),
            { tanggal, departemen_id: departemenId, search },
            { preserveState: true, replace: true },
        );
    };

    // Filter data berdasarkan Tab
    const filteredList = absensiList.filter((item) => {
        if (activeTab === "hadir") {
            return (
                item.status_absensi === "Tepat Waktu" ||
                item.status_absensi === "Terlambat"
            );
        }
        if (activeTab === "cuti_spj") {
            return (
                item.status_absensi === "Cuti / Izin" ||
                item.status_absensi === "Dinas Luar"
            );
        }
        if (activeTab === "belum_absen") {
            return item.status_absensi === "Belum Absen";
        }
        if (activeTab === "terlambat_lembur") {
            return (
                item.status_absensi === "Terlambat" || item.info_lembur !== null
            );
        }
        return true;
    });

    return (
        <AuthenticatedLayout>
            <Head title="Monitor Absensi Karyawan" />

            <div className="min-h-screen bg-[#F8FAFC]">
                <BannerHeader
                    subtitle="LDP HRIS & ERP"
                    title="Monitor Absensi & Kehadiran Karyawan"
                />

                <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                    {/* STAT CARDS REKAPITULASI 6 KOLOM */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Karyawan
                            </p>
                            <h3 className="text-xl font-black text-slate-800 mt-1">
                                {stats.total_karyawan || 0}
                            </h3>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                                Tepat Waktu
                            </p>
                            <h3 className="text-xl font-black text-emerald-700 mt-1">
                                {stats.tepat_waktu || 0}
                            </h3>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                                Terlambat
                            </p>
                            <h3 className="text-xl font-black text-amber-700 mt-1">
                                {stats.terlambat || 0}{" "}
                                <span className="text-xs font-normal text-amber-600">
                                    ({stats.total_menit_terlambat || 0}m)
                                </span>
                            </h3>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                                Cuti / Izin
                            </p>
                            <h3 className="text-xl font-black text-purple-700 mt-1">
                                {stats.cuti_izin || 0}
                            </h3>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                                Dinas Luar (SPJ)
                            </p>
                            <h3 className="text-xl font-black text-indigo-700 mt-1">
                                {stats.dinas_luar || 0}
                            </h3>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                                Belum Absen
                            </p>
                            <h3 className="text-xl font-black text-rose-700 mt-1">
                                {stats.belum_absen || 0}
                            </h3>
                        </div>
                    </div>

                    {/* BAR FILTER */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
                        <form
                            onSubmit={handleFilterSubmit}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                    PILIH TANGGAL
                                </label>
                                <input
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    className="w-full border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                    DEPARTEMEN
                                </label>
                                <select
                                    value={departemenId}
                                    onChange={(e) =>
                                        setDepartemenId(e.target.value)
                                    }
                                    className="w-full border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Semua Departemen</option>
                                    {departemens.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.nama_departemen}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                    CARI KARYAWAN / NIK
                                </label>
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NIK..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm"
                                >
                                    🔍 Tampilkan Filter
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* TAB NAVIGATION & TABEL */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 space-x-2 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("semua")}
                                className={`py-2.5 px-4 rounded-t-lg font-bold text-xs uppercase tracking-wider transition ${
                                    activeTab === "semua"
                                        ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Semua ({stats.total_karyawan || 0})
                            </button>

                            <button
                                onClick={() => setActiveTab("hadir")}
                                className={`py-2.5 px-4 rounded-t-lg font-bold text-xs uppercase tracking-wider transition ${
                                    activeTab === "hadir"
                                        ? "bg-white text-emerald-600 border-t-2 border-emerald-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Hadir (
                                {(stats.tepat_waktu || 0) +
                                    (stats.terlambat || 0)}
                                )
                            </button>

                            <button
                                onClick={() => setActiveTab("cuti_spj")}
                                className={`py-2.5 px-4 rounded-t-lg font-bold text-xs uppercase tracking-wider transition ${
                                    activeTab === "cuti_spj"
                                        ? "bg-white text-purple-600 border-t-2 border-purple-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Cuti & SPJ (
                                {(stats.cuti_izin || 0) +
                                    (stats.dinas_luar || 0)}
                                )
                            </button>

                            <button
                                onClick={() => setActiveTab("belum_absen")}
                                className={`py-2.5 px-4 rounded-t-lg font-bold text-xs uppercase tracking-wider transition ${
                                    activeTab === "belum_absen"
                                        ? "bg-white text-rose-600 border-t-2 border-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Belum Absen ({stats.belum_absen || 0})
                            </button>

                            <button
                                onClick={() => setActiveTab("terlambat_lembur")}
                                className={`py-2.5 px-4 rounded-t-lg font-bold text-xs uppercase tracking-wider transition ${
                                    activeTab === "terlambat_lembur"
                                        ? "bg-white text-amber-600 border-t-2 border-amber-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Terlambat & Lembur (
                                {stats.terlambat + stats.total_lembur})
                            </button>
                        </div>

                        {/* TABEL DATA */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3.5">
                                            Karyawan & Jabatan
                                        </th>
                                        <th className="px-6 py-3.5">
                                            Departemen
                                        </th>
                                        <th className="px-6 py-3.5 text-center">
                                            Status Kehadiran
                                        </th>
                                        <th className="px-6 py-3.5 text-center">
                                            Clock In
                                        </th>
                                        <th className="px-6 py-3.5 text-center">
                                            Clock Out & Lembur
                                        </th>
                                        <th className="px-6 py-3.5">
                                            Lokasi & Keterangan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-sm">
                                    {filteredList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-10 text-center text-slate-400 italic"
                                            >
                                                Tidak ditemukan data absensi
                                                untuk kategori ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/80 transition"
                                            >
                                                {/* KARYAWAN */}
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">
                                                        {item.nama_lengkap}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        NIK: {item.nik_internal}
                                                    </div>
                                                </td>

                                                {/* DEPARTEMEN */}
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-700">
                                                        {item.departemen}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {item.jabatan}
                                                    </div>
                                                </td>

                                                {/* STATUS KEHADIRAN BADGE */}
                                                <td className="px-6 py-4 text-center">
                                                    {item.status_absensi ===
                                                        "Tepat Waktu" && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                            ✅ Tepat Waktu
                                                        </span>
                                                    )}
                                                    {item.status_absensi ===
                                                        "Terlambat" && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                            ⏰ Terlambat (
                                                            {
                                                                item.menit_terlambat
                                                            }
                                                            m)
                                                        </span>
                                                    )}
                                                    {item.status_absensi ===
                                                        "Cuti / Izin" && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                                            🏖️ Cuti / Izin
                                                        </span>
                                                    )}
                                                    {item.status_absensi ===
                                                        "Dinas Luar" && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                                            🚀 Dinas Luar (SPJ)
                                                        </span>
                                                    )}
                                                    {item.status_absensi ===
                                                        "Belum Absen" && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                                            ❌ Belum Absen
                                                        </span>
                                                    )}
                                                </td>

                                                {/* CLOCK IN */}
                                                <td className="px-6 py-4 text-center">
                                                    {item.waktu_masuk ? (
                                                        <div>
                                                            <span className="font-bold text-slate-800">
                                                                {new Date(
                                                                    item.waktu_masuk,
                                                                ).toLocaleTimeString(
                                                                    "id-ID",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}
                                                            </span>
                                                            {item.foto_masuk && (
                                                                <a
                                                                    href={`/storage/${item.foto_masuk}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="block text-[11px] text-indigo-600 hover:underline mt-0.5"
                                                                >
                                                                    Foto Masuk
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-mono">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* CLOCK OUT & LEMBUR */}
                                                <td className="px-6 py-4 text-center">
                                                    {item.waktu_keluar ? (
                                                        <div>
                                                            <span className="font-bold text-slate-800">
                                                                {new Date(
                                                                    item.waktu_keluar,
                                                                ).toLocaleTimeString(
                                                                    "id-ID",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}
                                                            </span>
                                                            {item.foto_keluar && (
                                                                <a
                                                                    href={`/storage/${item.foto_keluar}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="block text-[11px] text-indigo-600 hover:underline mt-0.5"
                                                                >
                                                                    Foto Keluar
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : item.waktu_masuk ? (
                                                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                            Belum Out
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-mono">
                                                            -
                                                        </span>
                                                    )}

                                                    {/* BADGE LEMBUR APPROVED */}
                                                    {item.info_lembur && (
                                                        <div className="mt-1">
                                                            <span
                                                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800"
                                                                title={
                                                                    item
                                                                        .info_lembur
                                                                        .deskripsi
                                                                }
                                                            >
                                                                ⚡ Lembur (
                                                                {
                                                                    item
                                                                        .info_lembur
                                                                        .jam_mulai
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    item
                                                                        .info_lembur
                                                                        .jam_selesai
                                                                }
                                                                )
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* LOKASI & CATATAN */}
                                                <td className="px-6 py-4">
                                                    {item.koordinat_masuk && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${item.koordinat_masuk}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded hover:bg-slate-200 mb-1 transition"
                                                        >
                                                            📍 Maps
                                                        </a>
                                                    )}
                                                    {item.catatan && (
                                                        <div
                                                            className="text-xs text-slate-500 italic max-w-xs truncate"
                                                            title={item.catatan}
                                                        >
                                                            {item.catatan}
                                                        </div>
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
