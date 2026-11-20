import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import formatRupiah from "@/Utils/formatRupiah";
import { formatTanggal } from "@/Utils/spj";

const WARNA_STATUS = {
    Lunas: "bg-green-50 text-green-700 border-green-200",
    Sebagian: "bg-amber-50 text-amber-700 border-amber-200",
    "Belum dibayar": "bg-red-50 text-red-700 border-red-200",
    "Tidak ada": "bg-gray-50 text-gray-500 border-gray-200",
};

const hariIni = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function StatusJenis({ judul, st }) {
    return (
        <div className="text-xs">
            <div className="text-gray-500">{judul}</div>
            <span className={`inline-block font-semibold px-1.5 py-0.5 rounded border ${WARNA_STATUS[st.status] || ""}`}>{st.status}</span>
            <div className="text-gray-700 mt-0.5 tabular-nums">
                {formatRupiah(st.dibayar)} / {formatRupiah(st.hak)}
                {st.sisa > 0 && <span className="text-gray-400"> · sisa {formatRupiah(st.sisa)}</span>}
            </div>
        </div>
    );
}

/** Pembayaran per peserta (Finance mencatat uang harian & reimburse dengan bukti transfer). */
export default function PembayaranSpj({ spj, pesertas, bisaCatat }) {
    const [catatUntuk, setCatatUntuk] = useState(null);
    const [batalkan, setBatalkan] = useState(null);
    const form = useForm({ spj_peserta_id: "", jenis: "uang_harian", nominal: "", tanggal_transfer: "", bukti_transfer: null, catatan: "" });
    const batal = useForm({ alasan: "" });

    const sisaUntuk = (p, jenis) => p.status_pembayaran[jenis]?.sisa ?? 0;

    const bukaCatat = (p) => {
        const jenis = sisaUntuk(p, "uang_harian") > 0 ? "uang_harian" : "reimburse";
        form.reset();
        form.clearErrors();
        form.setData((d) => ({ ...d, spj_peserta_id: p.id, jenis, nominal: sisaUntuk(p, jenis), tanggal_transfer: hariIni() }));
        setCatatUntuk(p);
    };

    const kirim = (e) => {
        e.preventDefault();
        form.post(route("spj.pembayaran.store", spj.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setCatatUntuk(null),
        });
    };

    const kirimBatal = (e) => {
        e.preventDefault();
        batal.delete(route("spj.pembayaran.destroy", batalkan.id), {
            preserveScroll: true,
            onSuccess: () => setBatalkan(null),
        });
    };

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Pembayaran</h3>
                <span className="text-xs text-gray-500">Dibayar langsung oleh Finance (tidak lewat payroll)</span>
            </div>
            <div className="p-5 space-y-4">
                {pesertas.map((p) => {
                    const st = p.status_pembayaran;
                    const adaSisa = st.uang_harian.sisa > 0 || st.reimburse.sisa > 0;
                    return (
                        <div key={p.id} className="border rounded-lg">
                            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 bg-gray-50 border-b rounded-t-lg">
                                <div>
                                    <div className="font-semibold text-gray-800 text-sm">{p.nama}</div>
                                    <div className="text-xs text-gray-500">
                                        Rekening: {p.rekening ?? <span className="text-red-600">belum ada</span>}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-6">
                                    <StatusJenis judul="Uang Harian" st={st.uang_harian} />
                                    <StatusJenis judul="Reimburse (nota tervalidasi)" st={st.reimburse} />
                                </div>
                                {bisaCatat && adaSisa && (
                                    <button
                                        onClick={() => bukaCatat(p)}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-semibold"
                                    >
                                        + Catat Pembayaran
                                    </button>
                                )}
                            </div>
                            {p.pembayarans.length === 0 ? (
                                <p className="px-4 py-3 text-xs text-gray-400">Belum ada pembayaran dicatat.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead className="text-gray-500 uppercase">
                                            <tr className="border-b">
                                                <th className="px-3 py-2 text-left">Tgl Transfer</th>
                                                <th className="px-3 py-2 text-left">Jenis</th>
                                                <th className="px-3 py-2 text-right">Nominal</th>
                                                <th className="px-3 py-2 text-left">Rekening Tujuan</th>
                                                <th className="px-3 py-2 text-left">Dicatat</th>
                                                <th className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {p.pembayarans.map((b) => (
                                                <tr key={b.id} className={`align-top ${b.dibatalkan ? "bg-gray-50 text-gray-400" : ""}`}>
                                                    <td className={`px-3 py-2 whitespace-nowrap ${b.dibatalkan ? "line-through" : ""}`}>
                                                        {formatTanggal(b.tanggal_transfer)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className={b.dibatalkan ? "line-through" : ""}>{b.label_jenis}</span>
                                                        {b.dibatalkan && (
                                                            <span className="ml-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200 no-underline">
                                                                Dibatalkan
                                                            </span>
                                                        )}
                                                        {b.catatan && <div className="text-gray-500 italic">{b.catatan}</div>}
                                                        {b.dibatalkan && (
                                                            <div className="text-red-700 mt-1">
                                                                Dibatalkan oleh {b.dibatalkan_oleh} · {b.dibatalkan_pada}
                                                                <div className="italic">Alasan: {b.alasan_batal}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={`px-3 py-2 text-right tabular-nums whitespace-nowrap ${b.dibatalkan ? "line-through" : ""}`}>
                                                        {formatRupiah(b.nominal)}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono">{b.rekening ?? "-"}</td>
                                                    <td className="px-3 py-2 text-gray-500">
                                                        {b.dicatat_oleh}
                                                        <div className="text-gray-400">{b.dicatat_pada}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                                                        {p.bisa_lihat_bukti && (
                                                            <a
                                                                href={route("spj.pembayaran.bukti", b.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-700 hover:underline font-semibold"
                                                            >
                                                                Bukti
                                                            </a>
                                                        )}
                                                        {bisaCatat && !b.dibatalkan && (
                                                            <button
                                                                onClick={() => {
                                                                    batal.reset();
                                                                    batal.clearErrors();
                                                                    setBatalkan(b);
                                                                }}
                                                                className="text-red-700 hover:underline"
                                                            >
                                                                Batalkan
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Modal show={!!catatUntuk} onClose={() => setCatatUntuk(null)} maxWidth="md">
                {catatUntuk && (
                    <form onSubmit={kirim} className="p-6 space-y-3">
                        <h2 className="text-lg font-bold text-gray-900">Catat Pembayaran — {catatUntuk.nama}</h2>
                        <p className="text-xs text-gray-500">
                            Transfer ke rekening <span className="font-mono">{catatUntuk.rekening ?? "-"}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="text-sm">
                                <span className="text-gray-600">Jenis</span>
                                <select
                                    value={form.data.jenis}
                                    onChange={(e) => form.setData((d) => ({ ...d, jenis: e.target.value, nominal: sisaUntuk(catatUntuk, e.target.value) }))}
                                    className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                                >
                                    <option value="uang_harian">Uang Harian (sisa {formatRupiah(sisaUntuk(catatUntuk, "uang_harian"))})</option>
                                    <option value="reimburse">Reimburse (sisa {formatRupiah(sisaUntuk(catatUntuk, "reimburse"))})</option>
                                </select>
                                <InputError message={form.errors.jenis} />
                            </label>
                            <label className="text-sm">
                                <span className="text-gray-600">Nominal (Rp)</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={sisaUntuk(catatUntuk, form.data.jenis)}
                                    value={form.data.nominal}
                                    onChange={(e) => form.setData("nominal", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                                />
                                <InputError message={form.errors.nominal} />
                            </label>
                            <label className="text-sm">
                                <span className="text-gray-600">Tanggal transfer</span>
                                <input
                                    type="date"
                                    max={hariIni()}
                                    value={form.data.tanggal_transfer}
                                    onChange={(e) => form.setData("tanggal_transfer", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                                />
                                <InputError message={form.errors.tanggal_transfer} />
                            </label>
                        </div>
                        <label className="text-sm block">
                            <span className="text-gray-600">Bukti transfer (PDF/JPG/PNG, maks. 5 MB)</span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => form.setData("bukti_transfer", e.target.files[0] ?? null)}
                                className="mt-1 block w-full text-sm"
                            />
                            <InputError message={form.errors.bukti_transfer} />
                        </label>
                        <label className="text-sm block">
                            <span className="text-gray-600">Catatan (opsional)</span>
                            <input
                                type="text"
                                maxLength={500}
                                value={form.data.catatan}
                                onChange={(e) => form.setData("catatan", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                        </label>
                        <InputError message={form.errors.spj_peserta_id} />
                        <div className="flex justify-end gap-2 pt-2">
                            <SecondaryButton onClick={() => setCatatUntuk(null)}>Batal</SecondaryButton>
                            <button
                                disabled={form.processing}
                                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                            >
                                Simpan Pembayaran
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal show={!!batalkan} onClose={() => setBatalkan(null)} maxWidth="md">
                <form onSubmit={kirimBatal} className="p-6 space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">Batalkan Pencatatan Pembayaran</h2>
                    <p className="text-sm text-gray-600">
                        {batalkan && `${batalkan.label_jenis} ${formatRupiah(batalkan.nominal)} (${formatTanggal(batalkan.tanggal_transfer)}).`} Pembayaran
                        ditandai "Dibatalkan" dan tidak dihitung ke total dibayar; riwayat dan bukti transfer tetap disimpan. Pembatalan dan
                        alasannya tercatat di Audit Trail.
                    </p>
                    <textarea
                        rows={3}
                        value={batal.data.alasan}
                        onChange={(e) => batal.setData("alasan", e.target.value)}
                        className="block w-full border-gray-300 rounded-md text-sm"
                        placeholder="Mis. Salah input nominal"
                    />
                    <InputError message={batal.errors.alasan} />
                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setBatalkan(null)}>Tutup</SecondaryButton>
                        <button
                            disabled={batal.processing}
                            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                        >
                            Batalkan Pembayaran
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
