import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import { formatRentangTanggal } from "@/Utils/spj";

/** Isi Risalah Perjalanan Dinas: kepala + kegiatan bernomor per tanggal + lampiran gambar per tanggal. */
export default function Risalah({ spj, risalah, hari = [], pesertas = [], maksLampiran = 10 }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        topik: risalah.topik,
        tempat: risalah.tempat,
        waktu: risalah.waktu,
        // { "2026-11-27": ["kegiatan 1", ...] } — minimal satu baris kosong per tanggal untuk diisi
        kegiatan: Object.fromEntries(hari.map((h) => [h.tanggal, h.kegiatan.length ? h.kegiatan : [""]])),
    });
    const [unggah, setUnggah] = useState({}); // tanggal -> File[]
    const [mengunggah, setMengunggah] = useState(null);
    const [galatUnggah, setGalatUnggah] = useState({});

    const ubahKegiatan = (tgl, i, nilai) =>
        setData("kegiatan", { ...data.kegiatan, [tgl]: data.kegiatan[tgl].map((k, j) => (j === i ? nilai : k)) });
    const tambahKegiatan = (tgl) => setData("kegiatan", { ...data.kegiatan, [tgl]: [...data.kegiatan[tgl], ""] });
    const hapusKegiatan = (tgl, i) => {
        const sisa = data.kegiatan[tgl].filter((_, j) => j !== i);
        setData("kegiatan", { ...data.kegiatan, [tgl]: sisa.length ? sisa : [""] });
    };

    const simpan = (e) => {
        e.preventDefault();
        put(route("spj.risalah.update", spj.id), { preserveScroll: true });
    };

    const kirimGambar = (tgl) => {
        const files = unggah[tgl] || [];
        if (!files.length) return;
        setMengunggah(tgl);
        router.post(
            route("spj.risalah.lampiran.store", spj.id),
            { tanggal: tgl, gambar: files },
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setUnggah((u) => ({ ...u, [tgl]: [] }));
                    setGalatUnggah((g) => ({ ...g, [tgl]: null }));
                },
                onError: (err) => setGalatUnggah((g) => ({ ...g, [tgl]: Object.values(err).join(" ") })),
                onFinish: () => setMengunggah(null),
            },
        );
    };

    const hapusGambar = (id) => {
        if (!confirm("Hapus gambar ini?")) return;
        router.delete(route("spj.risalah.lampiran.destroy", id), { preserveScroll: true, preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Risalah Perjalanan Dinas</h2>}>
            <Head title={`Risalah ${spj.nomor_surat ?? ""}`} />
            <div className="py-8">
                <form onSubmit={simpan} className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {flash?.success && <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded text-sm">{flash.success}</div>}
                    {flash?.error && <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">{flash.error}</div>}

                    <div className="bg-white shadow sm:rounded-lg border-t-4 border-indigo-500 p-5 flex flex-wrap justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase text-gray-500 tracking-wide">Risalah untuk SPJ</div>
                            <div className="font-mono text-lg font-bold text-gray-800">{spj.nomor_surat}</div>
                            <div className="text-sm text-gray-600">
                                {spj.kota}, {spj.provinsi} · {formatRentangTanggal(spj.tgl_berangkat, spj.tgl_pulang)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Koordinator: {spj.koordinator ?? "— (pengaju)"}</div>
                        </div>
                        <Link href={route("spj.show", spj.id)}>
                            <SecondaryButton>Kembali ke SPJ</SecondaryButton>
                        </Link>
                    </div>

                    <div className="bg-white shadow sm:rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                            <InputLabel value="Topik" />
                            <TextInput value={data.topik} onChange={(e) => setData("topik", e.target.value)} className="mt-1 block w-full text-sm" />
                            <InputError message={errors.topik} />
                        </div>
                        <div className="md:col-span-2">
                            <InputLabel value="Tempat" />
                            <TextInput
                                value={data.tempat}
                                onChange={(e) => setData("tempat", e.target.value)}
                                className="mt-1 block w-full text-sm"
                                placeholder="Mis. Kantor pelanggan, Malang"
                            />
                            <InputError message={errors.tempat} />
                        </div>
                        <div>
                            <InputLabel value="Waktu" />
                            <TextInput
                                value={data.waktu}
                                onChange={(e) => setData("waktu", e.target.value)}
                                className="mt-1 block w-full text-sm"
                                placeholder="Mis. Sesuai Rundown PD"
                            />
                            <InputError message={errors.waktu} />
                        </div>
                        <div className="md:col-span-3 text-xs text-gray-500">
                            Attendance (otomatis dari peserta): {pesertas.map((p, i) => `${i + 1}. ${p.nama}`).join("  ")}
                        </div>
                    </div>

                    <InputError message={errors.kegiatan} />

                    {hari.map((h) => (
                        <div key={h.tanggal} className="bg-white shadow sm:rounded-lg">
                            <div className="px-5 py-3 border-b font-bold text-gray-800 text-sm">{h.judul}</div>
                            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">Kegiatan</div>
                                    <ol className="space-y-2">
                                        {data.kegiatan[h.tanggal].map((k, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-sm text-gray-500 w-6 pt-2 text-right">{i + 1}.</span>
                                                <textarea
                                                    rows={2}
                                                    value={k}
                                                    onChange={(e) => ubahKegiatan(h.tanggal, i, e.target.value)}
                                                    className="flex-1 border-gray-300 rounded-md text-sm"
                                                    placeholder="Mis. Rapat koordinasi dengan tim pelanggan"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => hapusKegiatan(h.tanggal, i)}
                                                    className="text-xs text-red-600 hover:underline pt-2"
                                                >
                                                    Hapus
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                    <button
                                        type="button"
                                        onClick={() => tambahKegiatan(h.tanggal)}
                                        className="mt-2 text-xs text-indigo-700 font-semibold hover:underline"
                                    >
                                        + Tambah kegiatan
                                    </button>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                                        Rundown / Foto ({h.lampirans.length}/{maksLampiran})
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {h.lampirans.map((l) => (
                                            <div key={l.id} className="relative border rounded overflow-hidden group">
                                                <a href={route("spj.risalah.lampiran.lihat", l.id)} target="_blank" rel="noopener noreferrer">
                                                    <img src={route("spj.risalah.lampiran.lihat", l.id)} alt={l.nama} className="h-24 w-full object-cover" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => hapusGambar(l.id)}
                                                    className="absolute top-1 right-1 text-[10px] bg-white/90 text-red-700 px-1.5 rounded border"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {h.lampirans.length < maksLampiran && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <input
                                                type="file"
                                                multiple
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => setUnggah((u) => ({ ...u, [h.tanggal]: Array.from(e.target.files) }))}
                                                className="text-xs"
                                            />
                                            <button
                                                type="button"
                                                disabled={!(unggah[h.tanggal] || []).length || mengunggah === h.tanggal}
                                                onClick={() => kirimGambar(h.tanggal)}
                                                className="text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-md font-semibold disabled:opacity-40"
                                            >
                                                {mengunggah === h.tanggal ? "Mengunggah…" : "Unggah Gambar"}
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-gray-400 mt-1">JPG/PNG, maks. 5 MB per gambar. Gambar besar diperkecil otomatis di PDF.</p>
                                    {galatUnggah[h.tanggal] && <InputError message={galatUnggah[h.tanggal]} />}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end gap-2">
                        <Link href={route("spj.show", spj.id)}>
                            <SecondaryButton>Batal</SecondaryButton>
                        </Link>
                        <button
                            disabled={processing}
                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-semibold disabled:opacity-50"
                        >
                            Simpan Risalah
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-right">Gambar tersimpan langsung saat diunggah; teks tersimpan saat "Simpan Risalah".</p>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
