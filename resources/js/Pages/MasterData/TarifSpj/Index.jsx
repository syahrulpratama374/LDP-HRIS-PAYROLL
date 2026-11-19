import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import formatRupiah from "@/Utils/formatRupiah";

const JENIS = [
    { kunci: "uang_harian", label: "Uang Harian" },
    { kunci: "penginapan", label: "Penginapan" },
];

const WARNA_KATEGORI = {
    Staff: "bg-slate-100 text-slate-700",
    Manager: "bg-indigo-100 text-indigo-700",
    Direksi: "bg-amber-100 text-amber-800",
};

export default function Index({ tarifs = [], karyawans = [], kategoriList = [], bolehUbah }) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState("tarif");
    const [cari, setCari] = useState("");
    const [modalBuka, setModalBuka] = useState(false);
    const [editId, setEditId] = useState(null);

    const { data, setData, post, put, delete: hapus, processing, errors, reset, clearErrors } = useForm({
        provinsi: "",
        jenis: "uang_harian",
        kategori: "Staff",
        nominal: "",
        berlaku_mulai: new Date().toISOString().slice(0, 10),
    });

    // Matriks: provinsi -> berlaku_mulai -> "jenis|kategori" -> tarif
    const matriks = useMemo(() => {
        const peta = {};
        tarifs.forEach((t) => {
            peta[t.provinsi] ??= {};
            peta[t.provinsi][t.berlaku_mulai] ??= {};
            peta[t.provinsi][t.berlaku_mulai][`${t.jenis}|${t.kategori}`] = t;
        });
        const kata = cari.trim().toLowerCase();
        return Object.keys(peta)
            .sort()
            .filter((p) => !kata || p.toLowerCase().includes(kata))
            .map((provinsi) => ({
                provinsi,
                adaUangHarian: tarifs.some((t) => t.provinsi === provinsi && t.jenis === "uang_harian"),
                periode: Object.keys(peta[provinsi])
                    .sort()
                    .reverse()
                    .map((tgl) => ({ tgl, sel: peta[provinsi][tgl] })),
            }));
    }, [tarifs, cari]);

    const daftarProvinsi = useMemo(() => [...new Set(tarifs.map((t) => t.provinsi))].sort(), [tarifs]);
    const tanpaUangHarian = matriks.filter((m) => !m.adaUangHarian).map((m) => m.provinsi);

    const bukaModal = (tarif = null, isian = {}) => {
        if (!bolehUbah) return;
        clearErrors();
        if (tarif) {
            setEditId(tarif.id);
            setData({
                provinsi: tarif.provinsi,
                jenis: tarif.jenis,
                kategori: tarif.kategori,
                nominal: Number(tarif.nominal),
                berlaku_mulai: tarif.berlaku_mulai,
            });
        } else {
            setEditId(null);
            reset();
            setData((d) => ({ ...d, ...isian }));
        }
        setModalBuka(true);
    };

    const tutupModal = () => {
        setModalBuka(false);
        reset();
        clearErrors();
    };

    const simpan = (e) => {
        e.preventDefault();
        const opsi = { preserveScroll: true, onSuccess: () => tutupModal() };
        editId ? put(route("tarif-spj.update", editId), opsi) : post(route("tarif-spj.store"), opsi);
    };

    const hapusTarif = () => {
        if (editId && confirm("Yakin menghapus tarif ini?")) {
            hapus(route("tarif-spj.destroy", editId), { preserveScroll: true, onSuccess: () => tutupModal() });
        }
    };

    const karyawanTersaring = useMemo(() => {
        const kata = cari.trim().toLowerCase();
        return karyawans.filter(
            (k) =>
                !kata ||
                k.nama_lengkap.toLowerCase().includes(kata) ||
                (k.nik_internal || "").toLowerCase().includes(kata) ||
                (k.departemen?.kode_departemen || "").toLowerCase().includes(kata),
        );
    }, [karyawans, cari]);

    const jumlahPerKategori = kategoriList.map((kat) => ({
        kat,
        n: karyawans.filter((k) => k.kategori_tarif_spj === kat).length,
    }));

    const ubahKategori = (karyawan, kategori) => {
        router.put(
            route("tarif-spj.kategori", karyawan.id),
            { kategori_tarif_spj: kategori },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data - Tarif SPJ</h2>}
        >
            <Head title="Master Tarif SPJ" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {flash?.success && (
                        <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded text-sm">{flash.success}</div>
                    )}
                    {!bolehUbah && (
                        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm">
                            Mode lihat saja. Perubahan tarif dan kategori hanya dapat dilakukan oleh HC dan Admin.
                        </div>
                    )}

                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 pt-4">
                            <div className="flex gap-1">
                                {[
                                    ["tarif", "Tarif per Provinsi"],
                                    ["kategori", "Kategori Tarif Karyawan"],
                                ].map(([kunci, label]) => (
                                    <button
                                        key={kunci}
                                        onClick={() => setTab(kunci)}
                                        className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                                            tab === kunci
                                                ? "border-indigo-600 text-indigo-700"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pb-2">
                                <TextInput
                                    value={cari}
                                    onChange={(e) => setCari(e.target.value)}
                                    placeholder={tab === "tarif" ? "Cari provinsi..." : "Cari nama / NIK / departemen..."}
                                    className="text-sm w-64"
                                />
                                {tab === "tarif" && bolehUbah && (
                                    <PrimaryButton onClick={() => bukaModal()}>+ Tambah Tarif</PrimaryButton>
                                )}
                            </div>
                        </div>

                        {tab === "tarif" ? (
                            <div className="p-6">
                                <p className="text-xs text-gray-500 mb-3">
                                    Satuan OH (orang/hari). Tarif yang dipakai SPJ = baris dengan tanggal berlaku terakhir
                                    sebelum atau pada tanggal berangkat. Penginapan dibatasi tarif x jumlah malam.
                                    {bolehUbah && " Klik sel untuk mengubah, atau sel kosong untuk mengisi."}
                                </p>
                                {tanpaUangHarian.length > 0 && (
                                    <div className="mb-3 p-2 rounded border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                                        Belum punya tarif uang harian (tidak muncul di pilihan provinsi SPJ):{" "}
                                        <strong>{tanpaUangHarian.join(", ")}</strong>
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border">
                                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th rowSpan={2} className="px-3 py-2 border text-left">Provinsi</th>
                                                <th rowSpan={2} className="px-3 py-2 border">Berlaku Mulai</th>
                                                {JENIS.map((j) => (
                                                    <th key={j.kunci} colSpan={3} className="px-3 py-2 border">
                                                        {j.label}
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr>
                                                {JENIS.map((j) =>
                                                    kategoriList.map((k) => (
                                                        <th key={`${j.kunci}${k}`} className="px-3 py-1 border font-semibold normal-case">
                                                            {k}
                                                        </th>
                                                    )),
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matriks.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="px-3 py-6 text-center text-gray-400">
                                                        Tidak ada tarif.
                                                    </td>
                                                </tr>
                                            )}
                                            {matriks.map((m) =>
                                                m.periode.map((p, i) => (
                                                    <tr key={`${m.provinsi}${p.tgl}`} className="hover:bg-gray-50">
                                                        {i === 0 && (
                                                            <td rowSpan={m.periode.length} className="px-3 py-2 border font-semibold text-gray-800 align-top">
                                                                {m.provinsi}
                                                                {!m.adaUangHarian && (
                                                                    <span className="block text-[10px] font-normal text-amber-700">tanpa uang harian</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className={`px-3 py-2 border text-center text-xs ${i > 0 ? "text-gray-400" : "text-gray-600"}`}>
                                                            {p.tgl}
                                                        </td>
                                                        {JENIS.map((j) =>
                                                            kategoriList.map((k) => {
                                                                const t = p.sel[`${j.kunci}|${k}`];
                                                                return (
                                                                    <td
                                                                        key={`${j.kunci}${k}`}
                                                                        onClick={() =>
                                                                            t
                                                                                ? bukaModal(t)
                                                                                : bukaModal(null, {
                                                                                      provinsi: m.provinsi,
                                                                                      jenis: j.kunci,
                                                                                      kategori: k,
                                                                                      berlaku_mulai: p.tgl,
                                                                                  })
                                                                        }
                                                                        className={`px-3 py-2 border text-right tabular-nums ${
                                                                            bolehUbah ? "cursor-pointer hover:bg-indigo-50" : ""
                                                                        } ${i > 0 ? "text-gray-400" : "text-gray-800"}`}
                                                                    >
                                                                        {t ? formatRupiah(t.nominal) : <span className="text-gray-300">—</span>}
                                                                    </td>
                                                                );
                                                            }),
                                                        )}
                                                    </tr>
                                                )),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                                    {jumlahPerKategori.map(({ kat, n }) => (
                                        <span key={kat} className={`px-2 py-1 rounded font-semibold ${WARNA_KATEGORI[kat]}`}>
                                            {kat}: {n}
                                        </span>
                                    ))}
                                    <span className="text-gray-500">
                                        Perhitungan SPJ selalu memakai kolom kategori ini, bukan jenjang jabatan.
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border">
                                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th className="px-3 py-2 border text-left">Nama</th>
                                                <th className="px-3 py-2 border text-left">NIK</th>
                                                <th className="px-3 py-2 border text-left">Departemen</th>
                                                <th className="px-3 py-2 border text-left">Jenjang Jabatan</th>
                                                <th className="px-3 py-2 border">Kategori Tarif SPJ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {karyawanTersaring.map((k) => (
                                                <tr key={k.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 border font-medium text-gray-800">{k.nama_lengkap}</td>
                                                    <td className="px-3 py-2 border text-gray-500">{k.nik_internal}</td>
                                                    <td className="px-3 py-2 border text-gray-600">{k.departemen?.kode_departemen ?? "-"}</td>
                                                    <td className="px-3 py-2 border text-gray-600">
                                                        {k.jabatan ? `${k.jabatan.kode_jabatan} · ${k.jabatan.nama_jabatan}` : "-"}
                                                    </td>
                                                    <td className="px-3 py-2 border text-center">
                                                        {bolehUbah ? (
                                                            <select
                                                                value={k.kategori_tarif_spj}
                                                                onChange={(e) => ubahKategori(k, e.target.value)}
                                                                className="text-sm border-gray-300 rounded-md py-1"
                                                            >
                                                                {kategoriList.map((kat) => (
                                                                    <option key={kat} value={kat}>
                                                                        {kat}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${WARNA_KATEGORI[k.kategori_tarif_spj]}`}>
                                                                {k.kategori_tarif_spj}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={modalBuka} onClose={tutupModal}>
                <form onSubmit={simpan} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">{editId ? "Ubah Tarif SPJ" : "Tambah Tarif SPJ"}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <InputLabel value="Provinsi" />
                            <TextInput
                                list="daftar-provinsi"
                                value={data.provinsi}
                                onChange={(e) => setData("provinsi", e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Mis. Jawa Timur"
                            />
                            <datalist id="daftar-provinsi">
                                {daftarProvinsi.map((p) => (
                                    <option key={p} value={p} />
                                ))}
                            </datalist>
                            <InputError message={errors.provinsi} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Jenis" />
                            <select
                                value={data.jenis}
                                onChange={(e) => setData("jenis", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                {JENIS.map((j) => (
                                    <option key={j.kunci} value={j.kunci}>
                                        {j.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.jenis} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Kategori" />
                            <select
                                value={data.kategori}
                                onChange={(e) => setData("kategori", e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                {kategoriList.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.kategori} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Nominal per OH (Rp)" />
                            <TextInput
                                type="number"
                                min="0"
                                value={data.nominal}
                                onChange={(e) => setData("nominal", e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.nominal} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Berlaku Mulai" />
                            <TextInput
                                type="date"
                                value={data.berlaku_mulai}
                                onChange={(e) => setData("berlaku_mulai", e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.berlaku_mulai} className="mt-1" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Untuk perubahan tarif, sebaiknya tambah baris dengan tanggal berlaku baru agar SPJ lama tetap
                        memakai tarif lama.
                    </p>
                    <div className="flex justify-between mt-6">
                        <div>{editId && <DangerButton type="button" onClick={hapusTarif}>Hapus</DangerButton>}</div>
                        <div className="flex gap-2">
                            <SecondaryButton onClick={tutupModal}>Batal</SecondaryButton>
                            <PrimaryButton disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</PrimaryButton>
                        </div>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
