import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import formatRupiah from "@/Utils/formatRupiah";
import { formatRentangTanggal, WARNA_STATUS_SPJ } from "@/Utils/spj";

export default function Index({ spjs, filter = {}, statusList = [], jumlahMenungguSaya = 0 }) {
    const { flash, errors } = usePage().props;
    const [cari, setCari] = useState(filter.cari || "");

    const terapkan = (ubah) =>
        router.get(
            route("spj.index"),
            { cari, status: filter.status || "", menunggu: filter.menunggu ? 1 : undefined, ...ubah },
            { preserveState: true, replace: true },
        );

    const ajukan = (spj) => {
        if (confirm("Ajukan SPJ ini? Setelah diajukan, SPJ tidak bisa diubah.")) {
            router.post(route("spj.ajukan", spj.id), {}, { preserveScroll: true });
        }
    };

    const hapus = (spj) => {
        if (confirm("Hapus draf SPJ ini?")) {
            router.delete(route("spj.destroy", spj.id), { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Perjalanan Dinas (SPJ)</h2>}
        >
            <Head title="Perjalanan Dinas" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {flash?.success && (
                        <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded text-sm">{flash.success}</div>
                    )}
                    {flash?.error && <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">{flash.error}</div>}
                    {jumlahMenungguSaya > 0 && !filter.menunggu && (
                        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded text-sm">
                            Ada <strong>{jumlahMenungguSaya}</strong> SPJ yang menunggu persetujuan Anda (ditandai "Menunggu Anda").
                        </div>
                    )}
                    {errors?.ajukan && (
                        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">{errors.ajukan}</div>
                    )}

                    <div className="bg-white shadow sm:rounded-lg border-t-4 border-indigo-500">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    value={cari}
                                    onChange={(e) => setCari(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && terapkan({ cari })}
                                    placeholder="Cari nomor, tujuan, keperluan..."
                                    className="border-gray-300 rounded-md shadow-sm text-sm w-72"
                                />
                                <select
                                    value={filter.status || ""}
                                    onChange={(e) => terapkan({ status: e.target.value })}
                                    className="border-gray-300 rounded-md shadow-sm text-sm"
                                >
                                    <option value="">Semua status</option>
                                    {statusList.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => terapkan({ menunggu: filter.menunggu ? undefined : 1 })}
                                    className={`text-sm px-3 py-2 rounded-md border font-semibold ${
                                        filter.menunggu
                                            ? "bg-amber-500 text-white border-amber-500"
                                            : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                                    }`}
                                >
                                    Menunggu Anda ({jumlahMenungguSaya})
                                </button>
                            </div>
                            <Link href={route("spj.create")}>
                                <PrimaryButton className="!bg-indigo-600 hover:!bg-indigo-700">+ Buat SPJ</PrimaryButton>
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold">Nomor / Status</th>
                                        <th className="px-4 py-3 text-left font-bold">Tujuan</th>
                                        <th className="px-4 py-3 text-left font-bold">Tanggal</th>
                                        <th className="px-4 py-3 text-center font-bold">Peserta</th>
                                        <th className="px-4 py-3 text-right font-bold">Total Uang Harian</th>
                                        <th className="px-4 py-3 text-right font-bold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {spjs.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                                                Belum ada SPJ. Klik "+ Buat SPJ" untuk mengajukan perjalanan dinas.
                                            </td>
                                        </tr>
                                    )}
                                    {spjs.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-mono text-xs text-gray-700">
                                                    {s.nomor_surat || <span className="italic text-gray-400">Belum bernomor</span>}
                                                </div>
                                                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${WARNA_STATUS_SPJ[s.status] || ""}`}>
                                                    {s.status}
                                                </span>
                                                {s.menunggu_saya && (
                                                    <span className="inline-block mt-1 ml-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-600 text-white animate-pulse">
                                                        Menunggu Anda
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-800">{s.kota}</div>
                                                <div className="text-xs text-gray-500">{s.provinsi}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {formatRentangTanggal(s.tgl_berangkat, s.tgl_pulang)}
                                                <div className="text-xs text-gray-400">{s.jumlah_hari} hari · oleh {s.pembuat}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{s.jumlah_peserta}</td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(s.total_uang_harian)}</td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                                                <Link
                                                    href={route("spj.show", s.id)}
                                                    className={`text-xs px-3 py-1.5 rounded font-bold border ${s.menunggu_saya ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                                                >
                                                    {s.menunggu_saya ? "Tinjau" : "Detail"}
                                                </Link>
                                                {s.bisa_ubah && (
                                                    <>
                                                        <Link
                                                            href={route("spj.edit", s.id)}
                                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-bold border"
                                                        >
                                                            Ubah
                                                        </Link>
                                                        <button
                                                            onClick={() => ajukan(s)}
                                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-bold"
                                                        >
                                                            Ajukan
                                                        </button>
                                                        {s.status === "Draft" && (
                                                            <button
                                                                onClick={() => hapus(s)}
                                                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold border border-red-200"
                                                            >
                                                                Hapus
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {spjs.links && spjs.last_page > 1 && (
                            <div className="flex flex-wrap gap-1 p-4 border-t">
                                {spjs.links.map((l, i) => (
                                    <Link
                                        key={i}
                                        href={l.url || "#"}
                                        preserveScroll
                                        className={`px-3 py-1 text-xs rounded border ${l.active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600"} ${!l.url ? "opacity-40 pointer-events-none" : ""}`}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
