import React, { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import formatRupiah from "@/Utils/formatRupiah";
import { formatTanggal } from "@/Utils/spj";

const WARNA_NOTA = {
    Menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    Divalidasi: "bg-green-50 text-green-700 border-green-200",
    Ditolak: "bg-red-50 text-red-700 border-red-200",
};

function BadgeSelisih({ selisih }) {
    if (!selisih) return null;
    const lebih = selisih.tingkat === "peringatan";
    return (
        <span
            title={`Nota ${formatRupiah(selisih.nota_per_malam)}/malam vs tarif ${formatRupiah(selisih.tarif_per_malam)}/malam`}
            className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                lebih ? "bg-red-50 text-red-700 border-red-200" : "bg-sky-50 text-sky-700 border-sky-200"
            }`}
        >
            {lebih ? "⚠ Di atas tarif" : "ℹ Di bawah tarif"} {selisih.persen > 0 ? "+" : ""}
            {selisih.persen}%
        </span>
    );
}

/** Nota & reimburse per peserta: unggah (pengaju/koordinator/peserta), validasi & tolak (Finance). */
export default function NotaReimburse({ spj, pesertas, bisaValidasi, jenisBiaya }) {
    const [unggahUntuk, setUnggahUntuk] = useState(null); // peserta
    const [validasiNota, setValidasiNota] = useState(null); // { nota, peserta }
    const [tolakNota, setTolakNota] = useState(null);

    const unggah = useForm({
        spj_peserta_id: "", jenis: "penginapan", tanggal: "", keterangan: "", jumlah_malam: "",
        nominal_nota: "", file_nota: null,
    });
    const val = useForm({ nominal_dibayar: "", catatan: "" });
    const tolak = useForm({ alasan: "" });

    const bukaUnggah = (p) => {
        unggah.reset();
        unggah.clearErrors();
        unggah.setData((d) => ({
            ...d, spj_peserta_id: p.id, jenis: "penginapan", tanggal: String(spj.tgl_berangkat).slice(0, 10),
            jumlah_malam: spj.jumlah_malam || 1,
        }));
        setUnggahUntuk(p);
    };

    const kirimUnggah = (e) => {
        e.preventDefault();
        unggah.post(route("spj.nota.store", spj.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setUnggahUntuk(null),
        });
    };

    const kirimValidasi = (e) => {
        e.preventDefault();
        val.post(route("spj.nota.validasi", validasiNota.nota.id), {
            preserveScroll: true,
            onSuccess: () => setValidasiNota(null),
        });
    };

    const kirimTolak = (e) => {
        e.preventDefault();
        tolak.post(route("spj.nota.tolak", tolakNota.id), {
            preserveScroll: true,
            onSuccess: () => setTolakNota(null),
        });
    };

    const hapus = (nota) => {
        if (!confirm("Hapus nota ini?")) return;
        router.delete(route("spj.nota.destroy", nota.id), { preserveScroll: true });
    };

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Nota & Reimburse</h3>
                <span className="text-xs text-gray-500">Total reimburse divalidasi: {formatRupiah(spj.total_akomodasi)}</span>
            </div>
            <div className="p-5 space-y-5">
                <p className="text-xs text-gray-500">
                    Penginapan dibayar sesuai nota maksimal batas penginapan peserta (berlaku untuk total nota penginapan);
                    kelebihan ditanggung peserta. Tiket, transport, dan lainnya dibayar sesuai nota yang divalidasi Finance.
                </p>

                {pesertas.map((p) => {
                    const sisa = p.batas_penginapan === null ? null : Math.max(0, p.batas_penginapan - p.penginapan_terpakai);
                    return (
                        <div key={p.id} className="border rounded-lg">
                            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-gray-50 border-b rounded-t-lg">
                                <div>
                                    <div className="font-semibold text-gray-800 text-sm">{p.nama}</div>
                                    <div className="text-xs text-gray-500">
                                        Penginapan:{" "}
                                        {p.batas_penginapan === null ? (
                                            <span className="text-amber-700">tarif belum ada — nominal divalidasi manual Finance</span>
                                        ) : (
                                            <>
                                                terpakai {formatRupiah(p.penginapan_terpakai)} dari batas {formatRupiah(p.batas_penginapan)} · sisa{" "}
                                                <strong>{formatRupiah(sisa)}</strong>
                                            </>
                                        )}
                                        {" · "}Reimburse dibayar: <strong>{formatRupiah(p.reimburse_dibayar)}</strong>
                                    </div>
                                </div>
                                {p.bisa_unggah && (
                                    <button
                                        onClick={() => bukaUnggah(p)}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-semibold"
                                    >
                                        + Unggah Nota
                                    </button>
                                )}
                            </div>

                            {p.biayas.length === 0 ? (
                                <p className="px-4 py-3 text-xs text-gray-400">Belum ada nota.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead className="text-gray-500 uppercase">
                                            <tr className="border-b">
                                                <th className="px-3 py-2 text-left">Tanggal</th>
                                                <th className="px-3 py-2 text-left">Jenis</th>
                                                <th className="px-3 py-2 text-right">Nota</th>
                                                <th className="px-3 py-2 text-right">Dibayar</th>
                                                <th className="px-3 py-2 text-left">Status</th>
                                                <th className="px-3 py-2 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {p.biayas.map((b) => (
                                                <tr key={b.id} className="align-top">
                                                    <td className="px-3 py-2 whitespace-nowrap">{formatTanggal(b.tanggal)}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="font-semibold text-gray-800">
                                                            {b.label_jenis}
                                                            {b.jumlah_malam ? ` · ${b.jumlah_malam} malam` : ""}
                                                        </div>
                                                        {b.keterangan && <div className="text-gray-500">{b.keterangan}</div>}
                                                        <div className="text-gray-400">oleh {b.diunggah_oleh}</div>
                                                        <BadgeSelisih selisih={b.selisih} />
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{formatRupiah(b.nominal_nota)}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                                                        {b.nominal_dibayar === null ? "-" : formatRupiah(b.nominal_dibayar)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className={`inline-block font-semibold px-1.5 py-0.5 rounded border ${WARNA_NOTA[b.status] || ""}`}>
                                                            {b.status}
                                                        </span>
                                                        {b.catatan && <div className="text-gray-600 italic mt-1 max-w-[220px]">{b.catatan}</div>}
                                                        {b.divalidasi_oleh && (
                                                            <div className="text-gray-400 mt-0.5">
                                                                {b.divalidasi_oleh} · {b.divalidasi_pada}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                                                        <a
                                                            href={route("spj.nota.berkas", b.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-700 hover:underline font-semibold"
                                                        >
                                                            Lihat
                                                        </a>
                                                        {bisaValidasi && b.status === "Menunggu" && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        val.reset();
                                                                        val.clearErrors();
                                                                        setValidasiNota({ nota: b, peserta: p });
                                                                    }}
                                                                    className="text-green-700 hover:underline font-semibold"
                                                                >
                                                                    Validasi
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        tolak.reset();
                                                                        tolak.clearErrors();
                                                                        setTolakNota(b);
                                                                    }}
                                                                    className="text-red-700 hover:underline font-semibold"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </>
                                                        )}
                                                        {b.bisa_hapus && (
                                                            <button onClick={() => hapus(b)} className="text-gray-500 hover:underline">
                                                                Hapus
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

            {/* MODAL UNGGAH */}
            <Modal show={!!unggahUntuk} onClose={() => setUnggahUntuk(null)} maxWidth="md">
                <form onSubmit={kirimUnggah} className="p-6 space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">Unggah Nota — {unggahUntuk?.nama}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="text-sm">
                            <span className="text-gray-600">Jenis biaya</span>
                            <select
                                value={unggah.data.jenis}
                                onChange={(e) => unggah.setData("jenis", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            >
                                {Object.entries(jenisBiaya).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            <InputError message={unggah.errors.jenis} />
                        </label>
                        <label className="text-sm">
                            <span className="text-gray-600">Tanggal nota</span>
                            <input
                                type="date"
                                min={String(spj.tgl_berangkat).slice(0, 10)}
                                max={String(spj.tgl_pulang).slice(0, 10)}
                                value={unggah.data.tanggal}
                                onChange={(e) => unggah.setData("tanggal", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                            <InputError message={unggah.errors.tanggal} />
                        </label>
                        {unggah.data.jenis === "penginapan" && (
                            <label className="text-sm">
                                <span className="text-gray-600">Jumlah malam</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={spj.jumlah_malam || 1}
                                    value={unggah.data.jumlah_malam}
                                    onChange={(e) => unggah.setData("jumlah_malam", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                                />
                                <InputError message={unggah.errors.jumlah_malam} />
                            </label>
                        )}
                        <label className="text-sm">
                            <span className="text-gray-600">Nominal nota (Rp)</span>
                            <input
                                type="number"
                                min={1}
                                value={unggah.data.nominal_nota}
                                onChange={(e) => unggah.setData("nominal_nota", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                            <InputError message={unggah.errors.nominal_nota} />
                        </label>
                    </div>
                    <label className="text-sm block">
                        <span className="text-gray-600">Keterangan (opsional)</span>
                        <input
                            type="text"
                            maxLength={255}
                            value={unggah.data.keterangan}
                            onChange={(e) => unggah.setData("keterangan", e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            placeholder="Mis. Hotel Santika Malang"
                        />
                    </label>
                    <label className="text-sm block">
                        <span className="text-gray-600">Berkas nota (PDF/JPG/PNG, maks. 5 MB)</span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => unggah.setData("file_nota", e.target.files[0] ?? null)}
                            className="mt-1 block w-full text-sm"
                        />
                        <InputError message={unggah.errors.file_nota} />
                    </label>
                    <InputError message={unggah.errors.spj_peserta_id} />
                    <div className="flex justify-end gap-2 pt-2">
                        <SecondaryButton onClick={() => setUnggahUntuk(null)}>Batal</SecondaryButton>
                        <button
                            disabled={unggah.processing}
                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                        >
                            Unggah
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL VALIDASI */}
            <Modal show={!!validasiNota} onClose={() => setValidasiNota(null)} maxWidth="md">
                {validasiNota && (
                    <form onSubmit={kirimValidasi} className="p-6 space-y-3">
                        <h2 className="text-lg font-bold text-gray-900">Validasi Nota</h2>
                        <div className="text-sm text-gray-700 space-y-1">
                            <div>
                                {validasiNota.nota.label_jenis} — {validasiNota.peserta.nama} · {formatTanggal(validasiNota.nota.tanggal)}
                            </div>
                            <div>
                                Nominal nota: <strong>{formatRupiah(validasiNota.nota.nominal_nota)}</strong>
                            </div>
                            {validasiNota.nota.pratinjau?.batas != null && (
                                <div className="text-xs text-gray-500">
                                    Batas penginapan {formatRupiah(validasiNota.nota.pratinjau.batas)} · sisa{" "}
                                    {formatRupiah(validasiNota.nota.pratinjau.sisa)}
                                </div>
                            )}
                        </div>
                        {validasiNota.nota.pratinjau?.manual ? (
                            <label className="text-sm block">
                                <span className="text-gray-600">
                                    Nominal dibayar (Rp) — provinsi belum punya tarif penginapan, isi manual (maks. nominal nota)
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={validasiNota.nota.nominal_nota}
                                    value={val.data.nominal_dibayar}
                                    onChange={(e) => val.setData("nominal_dibayar", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                                />
                                <InputError message={val.errors.nominal_dibayar} />
                            </label>
                        ) : (
                            <div className="p-3 rounded bg-green-50 border border-green-200 text-sm">
                                Akan dibayar: <strong>{formatRupiah(validasiNota.nota.pratinjau?.dibayar ?? 0)}</strong>
                                {validasiNota.nota.pratinjau?.dibayar < validasiNota.nota.nominal_nota && (
                                    <div className="text-xs text-red-700 mt-1">
                                        Kelebihan {formatRupiah(validasiNota.nota.nominal_nota - validasiNota.nota.pratinjau.dibayar)} ditanggung
                                        peserta (melebihi batas penginapan).
                                    </div>
                                )}
                            </div>
                        )}
                        <label className="text-sm block">
                            <span className="text-gray-600">Catatan (opsional)</span>
                            <input
                                type="text"
                                maxLength={500}
                                value={val.data.catatan}
                                onChange={(e) => val.setData("catatan", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <SecondaryButton onClick={() => setValidasiNota(null)}>Batal</SecondaryButton>
                            <button
                                disabled={val.processing}
                                className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                            >
                                Validasi
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL TOLAK NOTA */}
            <Modal show={!!tolakNota} onClose={() => setTolakNota(null)} maxWidth="md">
                <form onSubmit={kirimTolak} className="p-6 space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">Tolak Nota</h2>
                    <textarea
                        rows={3}
                        value={tolak.data.alasan}
                        onChange={(e) => tolak.setData("alasan", e.target.value)}
                        className="block w-full border-gray-300 rounded-md text-sm"
                        placeholder="Mis. Nota tidak terbaca, mohon unggah ulang"
                    />
                    <InputError message={tolak.errors.alasan} />
                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setTolakNota(null)}>Batal</SecondaryButton>
                        <button
                            disabled={tolak.processing}
                            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                        >
                            Tolak Nota
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
