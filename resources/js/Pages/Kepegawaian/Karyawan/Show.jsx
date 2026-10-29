import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function Show({ karyawan, jabatans = [], bawahans = [] }) {
    const [activeTab, setActiveTab] = useState("biodata");
    const [showFormJabatan, setShowFormJabatan] = useState(false);
    const [showFormGaji, setShowFormGaji] = useState(false);

    const formJabatan = useForm({ jabatan_id: "", effective_date_start: "" });
    const formGaji = useForm({
        nominal_gaji_pokok: "",
        effective_date_start: "",
    });

    const formFoto = useForm({ foto_profil: null });
    const formDokumen = useForm({
        jenis_dokumen: "",
        nama_dokumen: "",
        file_dokumen: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    const handleUploadFoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            formFoto.setData("foto_profil", file);
            formFoto.post(route("karyawan.foto.store", karyawan.id), {
                preserveScroll: true,
                onSuccess: () => formFoto.reset(),
            });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        formDokumen.setData("file_dokumen", file);

        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Ukuran file maksimal 5MB!");
                handleBatalkanFile();
                return;
            }

            if (file.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(file));
            } else if (file.type === "application/pdf") {
                setPreviewUrl("pdf");
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleBatalkanFile = () => {
        formDokumen.setData("file_dokumen", null);
        setPreviewUrl(null);
        const fileInput = document.getElementById("file-upload-input");
        if (fileInput) fileInput.value = "";
    };

    const submitJabatan = (e) => {
        e.preventDefault();
        formJabatan.post(route("karyawan.updateJabatan", karyawan.id), {
            onSuccess: () => {
                setShowFormJabatan(false);
                formJabatan.reset();
            },
        });
    };

    const submitGaji = (e) => {
        e.preventDefault();
        formGaji.post(route("karyawan.updateGaji", karyawan.id), {
            onSuccess: () => {
                setShowFormGaji(false);
                formGaji.reset();
            },
        });
    };

    const submitDokumen = (e) => {
        e.preventDefault();
        formDokumen.post(route("karyawan.dokumen.store", karyawan.id), {
            preserveScroll: true,
            onSuccess: () => {
                formDokumen.reset();
                setPreviewUrl(null);
                const fileInput = document.getElementById("file-upload-input");
                if (fileInput) fileInput.value = "";
            },
        });
    };

    const handleDeleteDokumen = (dokumenId) => {
        if (confirm("Yakin ingin menghapus dokumen ini?")) {
            router.delete(
                route("karyawan.dokumen.destroy", {
                    id: karyawan.id,
                    dokumen_id: dokumenId,
                }),
                { preserveScroll: true },
            );
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka || 0);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Profil Karyawan: {karyawan.nama_lengkap}
                </h2>
            }
        >
            <Head title={`Profil - ${karyawan.nama_lengkap}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
                    {/* PANEL KIRI: Ringkasan Profil */}
                    <div className="w-full md:w-1/3">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col items-center border-t-4 border-indigo-500 relative">
                            {karyawan.foto_profil ? (
                                <img
                                    src={karyawan.foto_profil}
                                    alt="Foto Profil"
                                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-100 shadow-md mb-4"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500 mb-4 uppercase shadow-inner">
                                    {karyawan.nama_lengkap.charAt(0)}
                                </div>
                            )}

                            <div className="mb-4">
                                <input
                                    type="file"
                                    id="upload-foto"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={handleUploadFoto}
                                />
                                <label
                                    htmlFor="upload-foto"
                                    className="cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 hover:bg-indigo-100 transition"
                                >
                                    {formFoto.processing
                                        ? "Mengunggah..."
                                        : "📷 Ubah Foto"}
                                </label>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 text-center">
                                {karyawan.nama_lengkap}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {karyawan.jabatan?.nama_jabatan}
                            </p>

                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold text-white w-full text-center ${karyawan.status_aktif ? "bg-green-500" : "bg-red-500"}`}
                            >
                                {karyawan.status_aktif
                                    ? "AKTIF BEKERJA"
                                    : "NON-AKTIF"}
                            </span>

                            <div className="w-full mt-6 space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-500">NIK:</span>
                                    <span className="font-medium text-gray-900">
                                        {karyawan.nik_internal}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-500">
                                        Departemen:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {karyawan.departemen?.nama_departemen}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-500">
                                        Atasan:
                                    </span>
                                    <span className="font-bold text-blue-600">
                                        {karyawan.atasan?.nama_lengkap || "BOD"}
                                    </span>
                                </div>
                            </div>

                            <Link
                                href={route("karyawan.index")}
                                className="mt-6 w-full"
                            >
                                <SecondaryButton className="w-full justify-center">
                                    Kembali ke Daftar
                                </SecondaryButton>
                            </Link>
                        </div>
                    </div>

                    {/* PANEL KANAN: Data Detail */}
                    <div className="w-full md:w-2/3">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="flex border-b overflow-x-auto">
                                {[
                                    {
                                        id: "biodata",
                                        label: "Biodata & Kontak",
                                        color: "indigo",
                                    },
                                    {
                                        id: "keluarga",
                                        label: "Keluarga & BPJS",
                                        color: "purple",
                                    },
                                    {
                                        id: "sensitif",
                                        label: "Data Sensitif & Bank",
                                        color: "red",
                                    },
                                    {
                                        id: "riwayat",
                                        label: "Riwayat Karir & Gaji",
                                        color: "green",
                                    },
                                    {
                                        id: "tim",
                                        label: "Struktur Tim",
                                        color: "blue",
                                    },
                                    {
                                        id: "dokumen",
                                        label: "Dokumen / Berkas",
                                        color: "orange",
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-5 py-4 text-sm font-medium whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? `border-b-2 border-${tab.color}-500 text-${tab.color}-600 font-bold`
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === "biodata" && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                                            Informasi Pribadi & Penempatan
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">
                                                    Tempat, Tanggal Lahir
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.tempat_lahir ||
                                                        "-"}
                                                    ,{" "}
                                                    {karyawan.tgl_lahir || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    Agama / Status Pernikahan
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.agama} /{" "}
                                                    {karyawan.status_pernikahan}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    Email Kantor (Login)
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.email_kantor}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    No. Telepon
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.no_telp || "-"}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500">
                                                    Alamat KTP
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.alamat_ktp || "-"}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500">
                                                    Alamat Domisili
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.alamat_domisili ||
                                                        "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "keluarga" && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                                            Daftar Anggota Keluarga
                                        </h4>
                                        {karyawan.keluargas &&
                                        karyawan.keluargas.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left border">
                                                    <thead className="bg-gray-50 border-b">
                                                        <tr>
                                                            <th className="px-4 py-2 border-r">
                                                                Relasi
                                                            </th>
                                                            <th className="px-4 py-2 border-r">
                                                                Nama Lengkap
                                                            </th>
                                                            <th className="px-4 py-2 border-r">
                                                                NIK
                                                            </th>
                                                            <th className="px-4 py-2 border-r">
                                                                Jenis Kelamin
                                                            </th>
                                                            <th className="px-4 py-2 text-center">
                                                                Tanggungan BPJS
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {karyawan.keluargas.map(
                                                            (k, i) => (
                                                                <tr
                                                                    key={i}
                                                                    className="border-b hover:bg-gray-50"
                                                                >
                                                                    <td className="px-4 py-2 border-r font-medium">
                                                                        {
                                                                            k.jenis_relasi
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 border-r">
                                                                        {
                                                                            k.nama_anggota
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 border-r">
                                                                        {k.nik_keluarga ||
                                                                            "-"}
                                                                    </td>
                                                                    <td className="px-4 py-2 border-r">
                                                                        {
                                                                            k.jenis_kelamin
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center">
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded text-xs text-white ${k.status_tanggungan_bpjs ? "bg-green-500" : "bg-gray-400"}`}
                                                                        >
                                                                            {k.status_tanggungan_bpjs
                                                                                ? "Ya"
                                                                                : "Tidak"}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                Belum ada data keluarga.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "sensitif" && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-red-600 border-b pb-2">
                                            Data Bank & Identitas Resmi
                                            (Ter-Enkripsi)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm bg-red-50 p-4 rounded-md border border-red-100">
                                            <div>
                                                <p className="text-gray-500">
                                                    No. KTP
                                                </p>
                                                <p className="font-bold text-gray-900">
                                                    {karyawan.no_ktp || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    NPWP
                                                </p>
                                                <p className="font-bold text-gray-900">
                                                    {karyawan.npwp || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    No. Rekening BCA
                                                </p>
                                                <p className="font-bold text-gray-900">
                                                    {karyawan.no_rek_bca || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    No. BPJS Kesehatan
                                                </p>
                                                <p className="font-bold text-gray-900">
                                                    {karyawan.no_bpjs_kesehatan ||
                                                        "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    No. BPJS Ketenagakerjaan
                                                </p>
                                                <p className="font-bold text-gray-900">
                                                    {karyawan.no_bpjs_ketenagakerjaan ||
                                                        "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "riwayat" && (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center border-b pb-2 mb-3">
                                                <h4 className="text-lg font-bold text-gray-800">
                                                    Promosi & Mutasi Jabatan
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        setShowFormJabatan(
                                                            !showFormJabatan,
                                                        )
                                                    }
                                                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded font-semibold"
                                                >
                                                    {showFormJabatan
                                                        ? "Batal"
                                                        : "+ Update Jabatan"}
                                                </button>
                                            </div>

                                            {showFormJabatan && (
                                                <form
                                                    onSubmit={submitJabatan}
                                                    className="mb-4 p-4 bg-indigo-50 rounded border space-y-3"
                                                >
                                                    <div>
                                                        <InputLabel value="Jabatan Baru" />
                                                        <select
                                                            className="w-full rounded border-gray-300 text-sm"
                                                            value={
                                                                formJabatan.data
                                                                    .jabatan_id
                                                            }
                                                            onChange={(e) =>
                                                                formJabatan.setData(
                                                                    "jabatan_id",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Pilih...
                                                            </option>
                                                            {jabatans.map(
                                                                (j) => (
                                                                    <option
                                                                        key={
                                                                            j.id
                                                                        }
                                                                        value={
                                                                            j.id
                                                                        }
                                                                    >
                                                                        {
                                                                            j.nama_jabatan
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Tanggal Berlaku" />
                                                        <TextInput
                                                            type="date"
                                                            className="w-full text-sm"
                                                            value={
                                                                formJabatan.data
                                                                    .effective_date_start
                                                            }
                                                            onChange={(e) =>
                                                                formJabatan.setData(
                                                                    "effective_date_start",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <PrimaryButton
                                                        disabled={
                                                            formJabatan.processing
                                                        }
                                                    >
                                                        Simpan Jabatan Baru
                                                    </PrimaryButton>
                                                </form>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center border-b pb-2 mb-3">
                                                <h4 className="text-lg font-bold text-gray-800">
                                                    Penyesuaian Gaji Pokok
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        setShowFormGaji(
                                                            !showFormGaji,
                                                        )
                                                    }
                                                    className="text-xs bg-green-600 text-white px-3 py-1 rounded font-semibold"
                                                >
                                                    {showFormGaji
                                                        ? "Batal"
                                                        : "+ Update Gaji"}
                                                </button>
                                            </div>

                                            {showFormGaji && (
                                                <form
                                                    onSubmit={submitGaji}
                                                    className="mb-4 p-4 bg-green-50 rounded border space-y-3"
                                                >
                                                    <div>
                                                        <InputLabel value="Nominal Gaji Baru" />
                                                        <TextInput
                                                            type="number"
                                                            className="w-full text-sm"
                                                            value={
                                                                formGaji.data
                                                                    .nominal_gaji_pokok
                                                            }
                                                            onChange={(e) =>
                                                                formGaji.setData(
                                                                    "nominal_gaji_pokok",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Tanggal Berlaku" />
                                                        <TextInput
                                                            type="date"
                                                            className="w-full text-sm"
                                                            value={
                                                                formGaji.data
                                                                    .effective_date_start
                                                            }
                                                            onChange={(e) =>
                                                                formGaji.setData(
                                                                    "effective_date_start",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <PrimaryButton
                                                        disabled={
                                                            formGaji.processing
                                                        }
                                                    >
                                                        Simpan Gaji Baru
                                                    </PrimaryButton>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "tim" && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                                            Bawahan Langsung
                                        </h4>
                                        {bawahans && bawahans.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {bawahans.map((b) => (
                                                    <div
                                                        key={b.id}
                                                        className="p-3 border rounded-md flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-indigo-600 text-sm">
                                                                {b.nama_lengkap}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {b.nik_internal}{" "}
                                                                -{" "}
                                                                {
                                                                    b.jabatan
                                                                        ?.nama_jabatan
                                                                }
                                                            </p>
                                                        </div>
                                                        <Link
                                                            href={route(
                                                                "karyawan.show",
                                                                b.id,
                                                            )}
                                                        >
                                                            <SecondaryButton className="!py-0.5 !px-2 !text-xs">
                                                                Detail
                                                            </SecondaryButton>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                Karyawan ini belum memiliki
                                                bawahan langsung.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "dokumen" && (
                                    <div className="space-y-6">
                                        <form
                                            onSubmit={submitDokumen}
                                            className="p-4 bg-orange-50 rounded border border-orange-200 space-y-4"
                                        >
                                            <h4 className="font-bold text-orange-800 text-sm">
                                                Upload Dokumen Baru
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <InputLabel value="Jenis Dokumen" />
                                                    <TextInput
                                                        className="w-full text-sm"
                                                        value={
                                                            formDokumen.data
                                                                .jenis_dokumen
                                                        }
                                                        onChange={(e) =>
                                                            formDokumen.setData(
                                                                "jenis_dokumen",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="KTP / Sertifikat / Ijazah"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel value="Nama Dokumen" />
                                                    <TextInput
                                                        className="w-full text-sm"
                                                        value={
                                                            formDokumen.data
                                                                .nama_dokumen
                                                        }
                                                        onChange={(e) =>
                                                            formDokumen.setData(
                                                                "nama_dokumen",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Scan KTP Asli"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel value="File Berkas (PDF/Gambar Max 5MB)" />
                                                <input
                                                    type="file"
                                                    id="file-upload-input"
                                                    onChange={handleFileChange}
                                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-700"
                                                />
                                            </div>
                                            <PrimaryButton
                                                disabled={
                                                    formDokumen.processing
                                                }
                                            >
                                                Upload Dokumen
                                            </PrimaryButton>
                                        </form>

                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">
                                                Dokumen Tersimpan
                                            </h4>
                                            {karyawan.dokumens &&
                                            karyawan.dokumens.length > 0 ? (
                                                <div className="space-y-2">
                                                    {karyawan.dokumens.map(
                                                        (doc) => (
                                                            <div
                                                                key={doc.id}
                                                                className="p-3 border rounded flex justify-between items-center bg-white shadow-sm"
                                                            >
                                                                <div>
                                                                    <p className="font-bold text-sm text-gray-800">
                                                                        {
                                                                            doc.nama_dokumen
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {
                                                                            doc.jenis_dokumen
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="space-x-2">
                                                                    <a
                                                                        href={
                                                                            doc.file_url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                                                                    >
                                                                        Lihat
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteDokumen(
                                                                                doc.id,
                                                                            )
                                                                        }
                                                                        className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">
                                                    Belum ada dokumen terunggah.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
