import React, { useEffect, useMemo, useRef, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import formatRupiah from "@/Utils/formatRupiah";
import { formatRentangTanggal } from "@/Utils/spj";

const hitungHari = (mulai, selesai) => {
    if (!mulai || !selesai) return null;
    const a = new Date(`${mulai}T00:00:00`);
    const b = new Date(`${selesai}T00:00:00`);
    const selisih = Math.round((b - a) / 86400000);
    return selisih < 0 ? null : selisih + 1;
};

function Kartu({ judul, nomor, children, kanan }) {
    return (
        <div className="bg-white shadow sm:rounded-lg border-t-4 border-indigo-500">
            <div className="flex items-center justify-between px-6 py-3 border-b">
                <h3 className="font-bold text-gray-800">
                    <span className="text-indigo-600 mr-2">{nomor}.</span>
                    {judul}
                </h3>
                {kanan}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function Form({
    spj = null,
    provinsiList = [],
    unitPenerbits = [],
    defaultUnitPenerbitId = null,
    karyawans = [],
    maksHari = 60,
}) {
    const { flash } = usePage().props;
    const { data, setData, post, put, processing, errors, transform } = useForm({
        provinsi: spj?.provinsi ?? "",
        kota: spj?.kota ?? "",
        tgl_berangkat: spj?.tgl_berangkat ?? "",
        tgl_pulang: spj?.tgl_pulang ?? "",
        keperluan: spj?.keperluan ?? "",
        tanggal_risalah_awal: spj?.tanggal_risalah_awal ?? "",
        unit_penerbit_id: spj?.unit_penerbit_id ?? defaultUnitPenerbitId ?? "",
        peserta: spj?.peserta ?? [],
        aksi: "draf",
    });

    const [cariPeserta, setCariPeserta] = useState("");
    const [hasil, setHasil] = useState(null);
    const [menghitung, setMenghitung] = useState(false);
    const [galatHitung, setGalatHitung] = useState(null);
    const permintaan = useRef(0);

    const petaKaryawan = useMemo(() => Object.fromEntries(karyawans.map((k) => [k.id, k])), [karyawans]);
    const pesertaTerpilih = data.peserta.map((id) => petaKaryawan[id]).filter(Boolean);
    const hari = hitungHari(data.tgl_berangkat, data.tgl_pulang);
    const tanpaRekening = pesertaTerpilih.filter((k) => !k.punya_rekening);

    const kandidat = useMemo(() => {
        const kata = cariPeserta.trim().toLowerCase();
        if (!kata) return [];
        return karyawans
            .filter((k) => !data.peserta.includes(k.id))
            .filter((k) =>
                [k.nama, k.departemen, k.kode_departemen, k.posisi].some((v) => (v || "").toLowerCase().includes(kata)),
            )
            .slice(0, 8);
    }, [cariPeserta, karyawans, data.peserta]);

    const tambahPeserta = (k) => {
        setData("peserta", [...data.peserta, k.id]);
        setCariPeserta("");
    };
    const hapusPeserta = (id) => setData("peserta", data.peserta.filter((p) => p !== id));

    // Hitung ulang di server setiap provinsi, tanggal, atau peserta berubah (sama dengan yang disimpan & PDF)
    useEffect(() => {
        if (!data.provinsi || !data.tgl_berangkat || !data.tgl_pulang || hari === null) {
            setHasil(null);
            return;
        }
        const id = ++permintaan.current;
        const t = setTimeout(async () => {
            setMenghitung(true);
            try {
                const { data: res } = await window.axios.post(route("spj.hitung"), {
                    provinsi: data.provinsi,
                    tgl_berangkat: data.tgl_berangkat,
                    tgl_pulang: data.tgl_pulang,
                    peserta: data.peserta,
                });
                if (id === permintaan.current) {
                    setHasil(res);
                    setGalatHitung(null);
                }
            } catch (e) {
                if (id === permintaan.current) {
                    setHasil(null);
                    setGalatHitung("Perhitungan gagal dimuat. Periksa isian tanggal dan provinsi.");
                }
            } finally {
                if (id === permintaan.current) setMenghitung(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [data.provinsi, data.tgl_berangkat, data.tgl_pulang, data.peserta.join(",")]);

    const kirim = (aksi) => {
        transform((d) => ({ ...d, aksi }));
        const opsi = { preserveScroll: true };
        spj ? put(route("spj.update", spj.id), opsi) : post(route("spj.store"), opsi);
    };

    const hapusDraf = () => {
        if (spj && confirm("Hapus draf SPJ ini?")) router.delete(route("spj.destroy", spj.id));
    };

    const rentang = formatRentangTanggal(data.tgl_berangkat, data.tgl_pulang);
    const galatPeserta = Object.entries(errors).filter(([k]) => k.startsWith("peserta"));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    {spj ? (spj.status === "Ditolak" ? "Revisi SPJ Perjalanan Dinas" : "Ubah Draf SPJ Perjalanan Dinas") : "Buat SPJ Perjalanan Dinas"}
                </h2>
            }
        >
            <Head title={spj ? "Ubah Draf SPJ" : "Buat SPJ"} />

            <div className="py-8">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 space-y-5">
                    {flash?.success && (
                        <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded text-sm">{flash.success}</div>
                    )}
                    {spj?.status === "Ditolak" && spj?.catatan_revisi && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
                            <strong>SPJ ditolak.</strong> Alasan: {spj.catatan_revisi} — perbaiki lalu ajukan ulang.
                        </div>
                    )}
                    {errors.ajukan && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
                            <strong>Belum bisa diajukan.</strong> {errors.ajukan}
                        </div>
                    )}

                    {/* A. DETAIL PERJALANAN */}
                    <Kartu nomor="A" judul="Detail Perjalanan">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Provinsi Tujuan" />
                                <select
                                    value={data.provinsi}
                                    onChange={(e) => setData("provinsi", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                >
                                    <option value="">-- Pilih Provinsi --</option>
                                    {provinsiList.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Hanya provinsi yang sudah punya tarif uang harian.</p>
                                <InputError message={errors.provinsi} />
                            </div>
                            <div>
                                <InputLabel value="Kota / Lokasi" />
                                <TextInput
                                    value={data.kota}
                                    onChange={(e) => setData("kota", e.target.value)}
                                    className="mt-1 block w-full text-sm"
                                    placeholder="Mis. Surabaya"
                                />
                                <InputError message={errors.kota} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputLabel value="Tanggal Berangkat" />
                                    <TextInput
                                        type="date"
                                        value={data.tgl_berangkat}
                                        onChange={(e) => setData("tgl_berangkat", e.target.value)}
                                        className="mt-1 block w-full text-sm"
                                    />
                                    <InputError message={errors.tgl_berangkat} />
                                </div>
                                <div>
                                    <InputLabel value="Tanggal Pulang" />
                                    <TextInput
                                        type="date"
                                        min={data.tgl_berangkat || undefined}
                                        value={data.tgl_pulang}
                                        onChange={(e) => setData("tgl_pulang", e.target.value)}
                                        className="mt-1 block w-full text-sm"
                                    />
                                    <InputError message={errors.tgl_pulang} />
                                </div>
                            </div>
                            <div className="flex items-end">
                                {hari ? (
                                    <div className="w-full p-3 rounded border border-indigo-100 bg-indigo-50 text-sm text-indigo-800">
                                        <strong>{hari} hari</strong> · {hari - 1} malam
                                        <span className="block text-xs text-indigo-600">{rentang}</span>
                                        {hari > maksHari && (
                                            <span className="block text-xs text-red-600">Maksimal {maksHari} hari.</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full p-3 rounded border border-dashed text-xs text-gray-400">
                                        Jumlah hari & malam muncul setelah tanggal diisi (pulang ≥ berangkat).
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <InputLabel value="Keperluan" />
                                <textarea
                                    rows={3}
                                    value={data.keperluan}
                                    onChange={(e) => setData("keperluan", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                    placeholder="Mis. Instalasi perangkat dan koordinasi dengan pelanggan"
                                />
                                <InputError message={errors.keperluan} />
                            </div>
                            <div>
                                <InputLabel value="Tanggal Risalah Awal (opsional)" />
                                <TextInput
                                    type="date"
                                    value={data.tanggal_risalah_awal || ""}
                                    onChange={(e) => setData("tanggal_risalah_awal", e.target.value)}
                                    className="mt-1 block w-full text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Bila diisi, PDF memuat kalimat "Sesuai dengan Risalah Perjalanan Dinas tanggal …".
                                </p>
                                <InputError message={errors.tanggal_risalah_awal} />
                            </div>
                            <div>
                                <InputLabel value="Yang Mengeluarkan (Unit Penerbit)" />
                                <select
                                    value={data.unit_penerbit_id}
                                    onChange={(e) => setData("unit_penerbit_id", e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                >
                                    <option value="">-- Pilih Unit Penerbit --</option>
                                    {unitPenerbits.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.kode} - {u.nama}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Nomor: 001/SPJ-PD/<strong>LDP-HC</strong>/…</p>
                                <InputError message={errors.unit_penerbit_id} />
                            </div>
                        </div>
                    </Kartu>

                    {/* B. PESERTA */}
                    <Kartu
                        nomor="B"
                        judul="Peserta"
                        kanan={<span className="text-xs text-gray-500">{pesertaTerpilih.length} orang dipilih</span>}
                    >
                        <div className="relative mb-4">
                            <TextInput
                                value={cariPeserta}
                                onChange={(e) => setCariPeserta(e.target.value)}
                                className="block w-full text-sm"
                                placeholder="Cari karyawan aktif berdasarkan nama, posisi, atau departemen..."
                            />
                            {kandidat.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-72 overflow-y-auto">
                                    {kandidat.map((k) => (
                                        <button
                                            key={k.id}
                                            type="button"
                                            onClick={() => tambahPeserta(k)}
                                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b last:border-b-0"
                                        >
                                            <span className="font-semibold text-gray-800">{k.nama}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {k.posisi} · {k.departemen} · {k.kategori_tarif}
                                            </span>
                                            {!k.punya_rekening && (
                                                <span className="ml-2 text-[10px] font-semibold text-red-600">tanpa rekening</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {cariPeserta && kandidat.length === 0 && (
                                <p className="text-xs text-gray-400 mt-1">Tidak ada karyawan aktif yang cocok.</p>
                            )}
                        </div>

                        {tanpaRekening.length > 0 && (
                            <div className="mb-3 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
                                Peserta tanpa nomor rekening: <strong>{tanpaRekening.map((k) => k.nama).join(", ")}</strong>.
                                Draf tetap bisa disimpan, tetapi SPJ baru bisa diajukan setelah HC melengkapi rekening di
                                Data Karyawan.
                            </div>
                        )}
                        {galatPeserta.map(([k, m]) => (
                            <InputError key={k} message={m} />
                        ))}

                        <table className="min-w-full text-sm border">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-3 py-2 border text-center w-10">No</th>
                                    <th className="px-3 py-2 border text-left">Nama</th>
                                    <th className="px-3 py-2 border text-left">Posisi</th>
                                    <th className="px-3 py-2 border text-left">Departemen</th>
                                    <th className="px-3 py-2 border text-center">Kategori Tarif</th>
                                    <th className="px-3 py-2 border text-left">Rekening</th>
                                    <th className="px-3 py-2 border w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pesertaTerpilih.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                                            Belum ada peserta. Cari dan pilih karyawan di atas.
                                        </td>
                                    </tr>
                                )}
                                {pesertaTerpilih.map((k, i) => (
                                    <tr key={k.id} className={k.punya_rekening ? "" : "bg-red-50"}>
                                        <td className="px-3 py-2 border text-center">{i + 1}</td>
                                        <td className="px-3 py-2 border font-medium text-gray-800">{k.nama}</td>
                                        <td className="px-3 py-2 border text-gray-600">{k.posisi || "-"}</td>
                                        <td className="px-3 py-2 border text-gray-600">{k.departemen || "-"}</td>
                                        <td className="px-3 py-2 border text-center">{k.kategori_tarif}</td>
                                        <td className="px-3 py-2 border font-mono text-xs">
                                            {k.punya_rekening ? (
                                                k.rekening
                                            ) : (
                                                <span className="font-sans font-semibold text-red-600">Belum ada rekening</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => hapusPeserta(k.id)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Kartu>

                    {/* C. RINCIAN BIAYA */}
                    <Kartu
                        nomor="C"
                        judul="Rincian Biaya"
                        kanan={menghitung && <span className="text-xs text-indigo-500">Menghitung…</span>}
                    >
                        {!hasil ? (
                            <p className="text-sm text-gray-400">
                                {galatHitung || "Isi provinsi dan tanggal perjalanan untuk melihat rincian biaya."}
                            </p>
                        ) : (
                            <>
                                {hasil.peringatan?.length > 0 && (
                                    <div className="mb-3 p-2 rounded border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                                        {hasil.peringatan.map((p, i) => (
                                            <div key={i}>{p}</div>
                                        ))}
                                    </div>
                                )}
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
                                                <td colSpan={5} className="px-2 py-1 border border-gray-400 font-bold">
                                                    UANG HARIAN ({hasil.hari} hari)
                                                </td>
                                            </tr>
                                            {hasil.peserta.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-2 py-3 border border-gray-400 text-center text-gray-400">
                                                        Belum ada peserta.
                                                    </td>
                                                </tr>
                                            )}
                                            {hasil.peserta.map((p, i) => (
                                                <tr key={p.karyawan_id}>
                                                    <td className="px-2 py-1 border border-gray-400 text-center">{i + 1}</td>
                                                    <td className="px-2 py-1 border border-gray-400">
                                                        Uang Harian {p.nama}
                                                        <span className="text-xs text-gray-500"> ({p.kategori_tarif})</span>
                                                    </td>
                                                    <td className="px-2 py-1 border border-gray-400 text-center whitespace-nowrap">{rentang}</td>
                                                    <td className="px-2 py-1 border border-gray-400 text-right tabular-nums">
                                                        {p.tarif_uang_harian === null ? (
                                                            <span className="text-amber-600">tarif belum ada</span>
                                                        ) : (
                                                            formatRupiah(p.tarif_uang_harian)
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1 border border-gray-400 text-right tabular-nums">{formatRupiah(p.total_uang_harian)}</td>
                                                    <td className={`px-2 py-1 border border-gray-400 text-xs ${p.punya_rekening ? "" : "text-red-600 font-semibold"}`}>
                                                        {p.punya_rekening ? `Transfer // ${p.rekening} (${p.nama})` : "Rekening belum ada"}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold">
                                                <td colSpan={4} className="px-2 py-1 border border-gray-400 text-right">TOTAL HARIAN</td>
                                                <td className="px-2 py-1 border border-gray-400 text-right tabular-nums">{formatRupiah(hasil.total_uang_harian)}</td>
                                                <td className="px-2 py-1 border border-gray-400"></td>
                                            </tr>

                                            <tr className="bg-gray-50">
                                                <td className="px-2 py-1 border border-gray-400 text-center font-bold">B</td>
                                                <td colSpan={5} className="px-2 py-1 border border-gray-400 font-bold">
                                                    AKOMODASI ({hasil.malam} malam)
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-1 border border-gray-400"></td>
                                                <td colSpan={5} className="px-2 py-2 border border-gray-400 text-xs text-gray-600">
                                                    <em>Diisi lewat reimburse setelah perjalanan</em> (sesuai nota). Batas penginapan
                                                    per peserta = tarif x malam; kelebihan ditanggung peserta.
                                                    <ul className="mt-1 space-y-0.5">
                                                        {hasil.peserta.map((p) => (
                                                            <li key={p.karyawan_id}>
                                                                • {p.nama}:{" "}
                                                                {p.tarif_penginapan === null ? (
                                                                    <span className="text-amber-600">tarif penginapan belum ada (validasi manual Finance)</span>
                                                                ) : (
                                                                    <>
                                                                        {formatRupiah(p.tarif_penginapan)} x {hasil.malam} malam ={" "}
                                                                        <strong>{formatRupiah(p.batas_penginapan)}</strong>
                                                                    </>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>

                                            <tr className="font-bold bg-indigo-50">
                                                <td colSpan={4} className="px-2 py-2 border border-gray-400 text-right">TOTAL</td>
                                                <td className="px-2 py-2 border border-gray-400 text-right tabular-nums">{formatRupiah(hasil.total_uang_harian)}</td>
                                                <td className="px-2 py-2 border border-gray-400"></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="px-2 py-2 border border-gray-400 italic">
                                                    Terbilang: <strong>{hasil.terbilang}</strong>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Akomodasi dan lainnya menggunakan sistem reimburse.</p>
                            </>
                        )}
                    </Kartu>

                    {/* D. AKSI */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white shadow sm:rounded-lg p-4">
                        <div className="flex gap-2">
                            <Link href={route("spj.index")}>
                                <SecondaryButton>Kembali</SecondaryButton>
                            </Link>
                            {spj && (
                                <button
                                    type="button"
                                    onClick={hapusDraf}
                                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded font-bold border border-red-200"
                                >
                                    Hapus Draf
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {tanpaRekening.length > 0 && (
                                <span className="text-xs text-red-600">Ajukan tidak tersedia: ada peserta tanpa rekening.</span>
                            )}
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => kirim("draf")}
                                className="text-sm bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-semibold border border-gray-300 disabled:opacity-50"
                            >
                                Simpan Draf
                            </button>
                            <button
                                type="button"
                                disabled={processing || tanpaRekening.length > 0 || pesertaTerpilih.length === 0}
                                onClick={() => kirim("ajukan")}
                                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                            >
                                Ajukan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
