import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import SignModal from "@/Components/SignModal";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import formatRupiah from "@/Utils/formatRupiah";
import { formatRentangTanggal, formatTanggal, WARNA_STATUS_SPJ } from "@/Utils/spj";

const WARNA_LANGKAH = {
    Menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    Disetujui: "bg-green-50 text-green-700 border-green-200",
    Ditolak: "bg-red-50 text-red-700 border-red-200",
};

function Kartu({ judul, children, kanan }) {
    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{judul}</h3>
                {kanan}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function Show({ spj, pesertas = [], approvals = [], bisaSetujui, atasNama, bisaUbah, alasanTidakBisa = null }) {
    const { flash } = usePage().props;
    const [modalSetuju, setModalSetuju] = useState(false);
    const [modalTolak, setModalTolak] = useState(false);
    const tolak = useForm({ alasan: "" });
    const rentang = formatRentangTanggal(spj.tgl_berangkat, spj.tgl_pulang);

    const kirimTolak = (e) => {
        e.preventDefault();
        tolak.post(route("spj.tolak", spj.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalTolak(false);
                tolak.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail SPJ Perjalanan Dinas</h2>}
        >
            <Head title={`SPJ ${spj.nomor_surat ?? "#" + spj.id}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {flash?.success && (
                        <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded text-sm">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">{flash.error}</div>
                    )}

                    {/* KEPALA */}
                    <div className="bg-white shadow sm:rounded-lg border-t-4 border-indigo-500 p-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase text-gray-500 tracking-wide">SPJ Biaya Perjalanan Dinas</div>
                            <div className="font-mono text-lg font-bold text-gray-800">
                                {spj.nomor_surat ?? <span className="italic text-gray-400 font-sans text-base">Nomor terbit setelah persetujuan terakhir</span>}
                            </div>
                            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded border ${WARNA_STATUS_SPJ[spj.status] || ""}`}>
                                {spj.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href={route("spj.index")}>
                                <SecondaryButton>Kembali</SecondaryButton>
                            </Link>
                            {bisaUbah && (
                                <Link
                                    href={route("spj.edit", spj.id)}
                                    className="text-sm bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-semibold border border-gray-300"
                                >
                                    {spj.status === "Ditolak" ? "Revisi & Ajukan Ulang" : "Ubah Draf"}
                                </Link>
                            )}
                            {bisaSetujui && (
                                <>
                                    <button
                                        onClick={() => setModalTolak(true)}
                                        className="text-sm bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md font-semibold border border-red-200"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => setModalSetuju(true)}
                                        className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold"
                                    >
                                        ✍️ Setujui
                                    </button>
                                </>
                            )}
                        </div>
                        {bisaSetujui && atasNama && (
                            <p className="w-full text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-3 py-2">
                                Anda menyetujui sebagai Plt. atas nama <strong>{atasNama}</strong> (Delegasi Wewenang aktif).
                            </p>
                        )}
                    </div>

                    {alasanTidakBisa && (
                        <div className="p-3 bg-gray-50 border border-gray-300 text-gray-700 rounded text-sm">
                            <strong>Anda tidak dapat menyetujui SPJ ini.</strong> {alasanTidakBisa}
                        </div>
                    )}

                    {spj.status === "Ditolak" && spj.catatan_revisi && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
                            <strong>Alasan penolakan:</strong> {spj.catatan_revisi}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-4">
                            {/* DETAIL PERJALANAN */}
                            <Kartu judul="Detail Perjalanan">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    <div>
                                        <dt className="text-gray-500 text-xs">Tujuan</dt>
                                        <dd className="font-semibold text-gray-800">{spj.kota}, {spj.provinsi}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Tanggal</dt>
                                        <dd className="font-semibold text-gray-800">
                                            {rentang} <span className="font-normal text-gray-500">({spj.jumlah_hari} hari · {spj.jumlah_malam} malam)</span>
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-gray-500 text-xs">Keperluan</dt>
                                        <dd className="text-gray-800 whitespace-pre-line">{spj.keperluan}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Tanggal Risalah Awal</dt>
                                        <dd className="text-gray-800">{spj.tanggal_risalah_awal ? formatTanggal(spj.tanggal_risalah_awal) : "-"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Yang Mengeluarkan</dt>
                                        <dd className="text-gray-800">{spj.unit_penerbit ?? "-"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Diajukan oleh</dt>
                                        <dd className="text-gray-800">
                                            {spj.pembuat}
                                            {spj.diajukan_pada && <span className="text-gray-500"> · {spj.diajukan_pada}</span>}
                                        </dd>
                                    </div>
                                    {spj.tanggal_terbit && (
                                        <div>
                                            <dt className="text-gray-500 text-xs">Terbit</dt>
                                            <dd className="text-gray-800">{spj.tanggal_terbit}</dd>
                                        </div>
                                    )}
                                </dl>
                            </Kartu>

                            {/* RINCIAN BIAYA */}
                            <Kartu judul="Rincian Biaya" kanan={<span className="text-xs text-gray-500">{pesertas.length} peserta</span>}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border border-gray-400">
                                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th rowSpan={2} className="px-2 py-2 border border-gray-400 w-10">No</th>
                                                <th rowSpan={2} className="px-2 py-2 border border-gray-400 text-left">Perincian Biaya</th>
                                                <th rowSpan={2} className="px-2 py-2 border border-gray-400">Tgl</th>
                                                <th colSpan={2} className="px-2 py-1 border border-gray-400">Jumlah</th>
                                                <th rowSpan={2} className="px-2 py-2 border border-gray-400 text-left">Ket</th>
                                            </tr>
                                            <tr>
                                                <th className="px-2 py-1 border border-gray-400">Harian</th>
                                                <th className="px-2 py-1 border border-gray-400">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-gray-50">
                                                <td className="px-2 py-1 border border-gray-400 text-center font-bold">A</td>
                                                <td colSpan={5} className="px-2 py-1 border border-gray-400 font-bold">UANG HARIAN ({spj.jumlah_hari} hari)</td>
                                            </tr>
                                            {pesertas.map((p, i) => (
                                                <tr key={p.karyawan_id}>
                                                    <td className="px-2 py-1 border border-gray-400 text-center">{i + 1}</td>
                                                    <td className="px-2 py-1 border border-gray-400">
                                                        Uang Harian {p.nama}
                                                        <span className="block text-xs text-gray-500">
                                                            {p.posisi} · {p.departemen} · {p.kategori_tarif}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-1 border border-gray-400 text-center whitespace-nowrap">{rentang}</td>
                                                    <td className="px-2 py-1 border border-gray-400 text-right tabular-nums">
                                                        {p.tarif_uang_harian === null ? "-" : formatRupiah(p.tarif_uang_harian)}
                                                    </td>
                                                    <td className="px-2 py-1 border border-gray-400 text-right tabular-nums">{formatRupiah(p.total_uang_harian)}</td>
                                                    <td className="px-2 py-1 border border-gray-400 text-xs">
                                                        {p.rekening ? `Transfer // ${p.rekening} (${p.nama})` : <span className="text-red-600">Rekening belum ada</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold">
                                                <td colSpan={4} className="px-2 py-1 border border-gray-400 text-right">TOTAL HARIAN</td>
                                                <td className="px-2 py-1 border border-gray-400 text-right tabular-nums">{formatRupiah(spj.total_uang_harian)}</td>
                                                <td className="px-2 py-1 border border-gray-400"></td>
                                            </tr>
                                            <tr className="bg-gray-50">
                                                <td className="px-2 py-1 border border-gray-400 text-center font-bold">B</td>
                                                <td colSpan={5} className="px-2 py-1 border border-gray-400 font-bold">AKOMODASI ({spj.jumlah_malam} malam)</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-1 border border-gray-400"></td>
                                                <td colSpan={5} className="px-2 py-2 border border-gray-400 text-xs text-gray-600">
                                                    <em>Diisi lewat reimburse setelah perjalanan.</em> Batas penginapan:
                                                    <ul className="mt-1 space-y-0.5">
                                                        {pesertas.map((p) => (
                                                            <li key={p.karyawan_id}>
                                                                • {p.nama}:{" "}
                                                                {p.batas_penginapan === null
                                                                    ? "tarif penginapan belum ada (validasi manual Finance)"
                                                                    : `${formatRupiah(p.tarif_penginapan)} x ${spj.jumlah_malam} malam = ${formatRupiah(p.batas_penginapan)}`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>
                                            <tr className="font-bold bg-indigo-50">
                                                <td colSpan={4} className="px-2 py-2 border border-gray-400 text-right">TOTAL</td>
                                                <td className="px-2 py-2 border border-gray-400 text-right tabular-nums">{formatRupiah(spj.total_uang_harian)}</td>
                                                <td className="px-2 py-2 border border-gray-400"></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="px-2 py-2 border border-gray-400 italic">
                                                    Terbilang: <strong>{spj.terbilang}</strong>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Akomodasi dan lainnya menggunakan sistem reimburse. SPJ ini dibayar langsung oleh Finance
                                    (tidak lewat payroll).
                                </p>
                            </Kartu>

                            <div className="p-4 rounded border border-dashed text-xs text-gray-500 bg-white">
                                Pembayaran uang harian, nota & reimburse, risalah, dan PDF SPJ tersedia di tahap berikutnya.
                            </div>
                        </div>

                        {/* TIMELINE PERSETUJUAN */}
                        <div>
                            <Kartu judul="Timeline Persetujuan">
                                {approvals.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        {spj.status === "Draft" ? "Langkah persetujuan dibuat saat SPJ diajukan." : "Belum ada langkah persetujuan."}
                                    </p>
                                ) : (
                                    <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                                        {approvals.map((a) => (
                                            <li key={a.id} className="ml-5">
                                                <span
                                                    className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ring-4 ring-white ${
                                                        a.status === "Disetujui"
                                                            ? "bg-green-500 text-white"
                                                            : a.status === "Ditolak"
                                                              ? "bg-red-500 text-white"
                                                              : a.aktif
                                                                ? "bg-amber-400 text-white animate-pulse"
                                                                : "bg-gray-200 text-gray-600"
                                                    }`}
                                                >
                                                    {a.urutan}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-800 text-sm">{a.label}</span>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${WARNA_LANGKAH[a.status] || ""}`}>
                                                        {a.aktif ? "Menunggu (aktif)" : a.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">{a.penyetuju}</div>
                                                {a.nama_aktual && (
                                                    <div className="text-xs text-gray-700 mt-1">
                                                        oleh <strong>{a.nama_aktual}</strong>
                                                        {a.atas_nama && <> (Plt. a.n. {a.atas_nama})</>}
                                                        {a.waktu && <span className="text-gray-400"> · {a.waktu}</span>}
                                                    </div>
                                                )}
                                                {a.catatan && <div className="text-xs italic text-gray-600 mt-1">"{a.catatan}"</div>}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </Kartu>
                        </div>
                    </div>
                </div>
            </div>

            {modalSetuju && (
                <SignModal isOpen={modalSetuju} onClose={() => setModalSetuju(false)} suratId={spj.id} approveUrl={route("spj.approve", spj.id)} />
            )}

            <Modal show={modalTolak} onClose={() => setModalTolak(false)} maxWidth="md">
                <form onSubmit={kirimTolak} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Tolak SPJ</h2>
                    <p className="text-sm text-gray-600 mb-3">SPJ akan dikembalikan ke pengaju untuk direvisi. Alasan wajib diisi.</p>
                    <textarea
                        rows={4}
                        value={tolak.data.alasan}
                        onChange={(e) => tolak.setData("alasan", e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                        placeholder="Mis. Tanggal perjalanan belum sesuai risalah"
                    />
                    <InputError message={tolak.errors.alasan} className="mt-1" />
                    <div className="flex justify-end gap-2 mt-4">
                        <SecondaryButton onClick={() => setModalTolak(false)}>Batal</SecondaryButton>
                        <button
                            disabled={tolak.processing}
                            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                        >
                            Tolak SPJ
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
