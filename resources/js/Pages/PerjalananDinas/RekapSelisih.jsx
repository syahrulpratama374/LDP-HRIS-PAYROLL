import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import formatRupiah from "@/Utils/formatRupiah";
import { formatTanggal } from "@/Utils/spj";

const persen = (n) => `${n > 0 ? "+" : ""}${Number(n).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;

/** Rekap selisih nota penginapan vs tarif per provinsi (HC, Finance, Admin). */
export default function RekapSelisih({ tahun, filter, perProvinsi = [], kejadian = [] }) {
    const ubah = (kunci, nilai) =>
        router.get(route("spj.rekap-selisih"), { tahun, ...filter, [kunci]: nilai || undefined }, { preserveState: true, preserveScroll: true });

    const tahunPilihan = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const total = perProvinsi.reduce(
        (a, r) => ({ kejadian: a.kejadian + r.kejadian, peringatan: a.peringatan + r.peringatan, info: a.info + r.info }),
        { kejadian: 0, peringatan: 0, info: 0 },
    );

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Rekap Selisih Penginapan SPJ</h2>}>
            <Head title="Rekap Selisih SPJ" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    <div className="bg-white shadow sm:rounded-lg p-5 flex flex-wrap items-end justify-between gap-4">
                        <div className="text-sm text-gray-600 max-w-2xl">
                            Perbandingan nota penginapan yang sudah divalidasi Finance dengan tarif penginapan (per malam), sesuai
                            provinsi dan kategori tarif peserta. <strong className="text-red-700">Peringatan</strong> = nota di atas
                            tarif; <strong className="text-sky-700">info</strong> = di bawah tarif.
                        </div>
                        <label className="text-sm">
                            <span className="text-gray-500 text-xs block">Tahun</span>
                            <select value={tahun} onChange={(e) => ubah("tahun", e.target.value)} className="border-gray-300 rounded-md text-sm">
                                {tahunPilihan.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            ["Kejadian selisih", total.kejadian, "text-gray-800"],
                            ["Peringatan (di atas tarif)", total.peringatan, "text-red-700"],
                            ["Info (di bawah tarif)", total.info, "text-sky-700"],
                        ].map(([label, nilai, warna]) => (
                            <div key={label} className="bg-white shadow sm:rounded-lg p-5">
                                <div className="text-xs uppercase text-gray-500 tracking-wide">{label}</div>
                                <div className={`text-2xl font-bold ${warna}`}>{nilai}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-5 py-3 border-b font-bold text-gray-800 text-sm uppercase tracking-wide">Per Provinsi</div>
                        {perProvinsi.length === 0 ? (
                            <p className="p-5 text-sm text-gray-400">Belum ada nota penginapan tervalidasi yang berbeda dari tarif pada {tahun}.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Provinsi</th>
                                            <th className="px-4 py-2 text-right">Kejadian</th>
                                            <th className="px-4 py-2 text-right">Peringatan / Info</th>
                                            <th className="px-4 py-2 text-right">Rata-rata Nota / Malam</th>
                                            <th className="px-4 py-2 text-right">Rata-rata Tarif / Malam</th>
                                            <th className="px-4 py-2 text-right">Rata-rata Selisih</th>
                                            <th className="px-4 py-2 text-right">Selisih Maks.</th>
                                            <th className="px-4 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {perProvinsi.map((r) => (
                                            <tr key={r.provinsi} className={filter.provinsi === r.provinsi ? "bg-indigo-50" : ""}>
                                                <td className="px-4 py-2 font-semibold text-gray-800">{r.provinsi}</td>
                                                <td className="px-4 py-2 text-right">{r.kejadian}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <span className="text-red-700">{r.peringatan}</span> / <span className="text-sky-700">{r.info}</span>
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(r.rata_nota)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(r.rata_tarif)}</td>
                                                <td className={`px-4 py-2 text-right tabular-nums font-semibold ${r.rata_persen > 0 ? "text-red-700" : "text-sky-700"}`}>
                                                    {formatRupiah(r.rata_selisih)} ({persen(r.rata_persen)})
                                                </td>
                                                <td className="px-4 py-2 text-right">{persen(r.maks_persen)}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        onClick={() => ubah("provinsi", filter.provinsi === r.provinsi ? "" : r.provinsi)}
                                                        className="text-xs text-indigo-700 hover:underline font-semibold"
                                                    >
                                                        {filter.provinsi === r.provinsi ? "Semua" : "Rincian"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                                Rincian Kejadian{filter.provinsi ? ` — ${filter.provinsi}` : ""}
                            </span>
                            <select
                                value={filter.tingkat ?? ""}
                                onChange={(e) => ubah("tingkat", e.target.value)}
                                className="border-gray-300 rounded-md text-xs"
                            >
                                <option value="">Semua tingkat</option>
                                <option value="peringatan">Peringatan</option>
                                <option value="info">Info</option>
                            </select>
                        </div>
                        {kejadian.length === 0 ? (
                            <p className="p-5 text-sm text-gray-400">Tidak ada kejadian.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">SPJ</th>
                                            <th className="px-4 py-2 text-left">Peserta</th>
                                            <th className="px-4 py-2 text-left">Provinsi / Kategori</th>
                                            <th className="px-4 py-2 text-right">Nota / Malam</th>
                                            <th className="px-4 py-2 text-right">Tarif / Malam</th>
                                            <th className="px-4 py-2 text-right">Selisih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {kejadian.map((k) => (
                                            <tr key={k.id}>
                                                <td className="px-4 py-2">
                                                    <Link href={route("spj.show", k.spj_id)} className="font-mono text-xs text-indigo-700 hover:underline">
                                                        {k.nomor_surat ?? `#${k.spj_id}`}
                                                    </Link>
                                                    <div className="text-xs text-gray-400">{formatTanggal(k.tanggal)}</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {k.peserta}
                                                    <div className="text-xs text-gray-400">{k.jumlah_malam} malam</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {k.provinsi}
                                                    <div className="text-xs text-gray-400">{k.kategori_tarif}</div>
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(k.nota_per_malam)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(k.tarif_per_malam)}</td>
                                                <td className={`px-4 py-2 text-right tabular-nums font-semibold ${k.tingkat === "peringatan" ? "text-red-700" : "text-sky-700"}`}>
                                                    {formatRupiah(k.selisih_per_malam)} ({persen(k.persen)})
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
