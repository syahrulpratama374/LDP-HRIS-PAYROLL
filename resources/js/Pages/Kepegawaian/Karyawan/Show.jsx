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

    const formFoto = useForm({
        foto_profil: null,
    });

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

    // --- STATE FORM UNTUK UPLOAD DOKUMEN ---
    const formDokumen = useForm({
        jenis_dokumen: "",
        nama_dokumen: "",
        file_dokumen: null,
    });

    // --- STATE & FUNGSI BARU UNTUK PREVIEW DOKUMEN ---
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        formDokumen.setData("file_dokumen", file);

        if (file) {
            // Validasi ukuran max 5MB
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

    // --- FUNGSI SUBMIT DOKUMEN (DIMODIFIKASI UNTUK RESET PREVIEW) ---
    const submitDokumen = (e) => {
        e.preventDefault();
        formDokumen.post(route("karyawan.dokumen.store", karyawan.id), {
            preserveScroll: true,
            onSuccess: () => {
                formDokumen.reset();
                setPreviewUrl(null); // Reset preview setelah sukses
                const fileInput = document.getElementById("file-upload-input");
                if (fileInput) fileInput.value = "";
            },
        });
    };

    // --- FUNGSI DELETE DOKUMEN ---
    const handleDeleteDokumen = (dokumenId) => {
        if (confirm("Yakin ingin menghapus dokumen ini?")) {
            router.delete(
                route("karyawan.dokumen.destroy", {
                    id: karyawan.id,
                    dokumen_id: dokumenId,
                }),
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
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
                            {/* Render Foto atau Inisial */}
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

                            {/* Tombol Ganti Foto (Hidden Input File) */}
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
                            <InputError
                                message={formFoto.errors.foto_profil}
                                className="mb-2 text-center"
                            />

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

                    {/* PANEL KANAN: Data Detail (Tabs) */}
                    <div className="w-full md:w-2/3">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            {/* Kumpulan Tombol Tab */}
                            <div className="flex border-b overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab("biodata")}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === "biodata" ? "border-b-2 border-indigo-500 text-indigo-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Biodata & Kontak
                                </button>
                                <button
                                    onClick={() => setActiveTab("sensitif")}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === "sensitif" ? "border-b-2 border-red-500 text-red-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Data Sensitif & Bank
                                </button>
                                <button
                                    onClick={() => setActiveTab("riwayat")}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === "riwayat" ? "border-b-2 border-green-500 text-green-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Riwayat Karir & Gaji
                                </button>
                                <button
                                    onClick={() => setActiveTab("tim")}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === "tim" ? "border-b-2 border-blue-500 text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Struktur Tim
                                </button>
                                <button
                                    onClick={() => setActiveTab("dokumen")}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === "dokumen" ? "border-b-2 border-orange-500 text-orange-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Dokumen / Berkas
                                </button>
                            </div>

                            {/* Isi Konten Tab */}
                            <div className="p-6">
                                {/* ---------------- TAB 1: BIODATA ---------------- */}
                                {activeTab === "biodata" && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <h4 className="text-lg font-bold text-gray-800 mb-4">
                                            Informasi Pribadi & Penempatan
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">
                                                    Tempat, Tanggal Lahir
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.tempat_lahir},{" "}
                                                    {karyawan.tgl_lahir}
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
                                                    Nomor Telepon
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {karyawan.no_telp || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    Golongan Gaji / PTKP
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {
                                                        karyawan.golongan
                                                            ?.kode_golongan
                                                    }{" "}
                                                    / {karyawan.ptkp?.kode_ptkp}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">
                                                    Hak Akses Sistem (Role)
                                                </p>
                                                <p className="font-bold text-indigo-600 uppercase">
                                                    {karyawan.user?.role
                                                        ?.nama_role ||
                                                        "Role ID: " +
                                                            karyawan.user
                                                                ?.role_id}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ---------------- TAB 2: SENSITIF ---------------- */}
                                {activeTab === "sensitif" && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <h4 className="text-lg font-bold text-red-600 mb-4">
                                            Data Rahasia (Terenkripsi)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm bg-red-50 p-4 rounded border border-red-100">
                                            <div>
                                                <p className="text-red-400">
                                                    Nomor KTP
                                                </p>
                                                <p className="font-bold text-red-700">
                                                    {karyawan.no_ktp}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-red-400">
                                                    NPWP
                                                </p>
                                                <p className="font-bold text-red-700">
                                                    {karyawan.npwp}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-red-400">
                                                    No. Rekening BCA
                                                </p>
                                                <p className="font-bold text-red-700">
                                                    {karyawan.no_rek_bca}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-red-400">
                                                    BPJS Kesehatan
                                                </p>
                                                <p className="font-bold text-red-700">
                                                    {karyawan.no_bpjs_kesehatan ||
                                                        "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-red-400">
                                                    BPJS Ketenagakerjaan
                                                </p>
                                                <p className="font-bold text-red-700">
                                                    {karyawan.no_bpjs_ketenagakerjaan ||
                                                        "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ---------------- TAB 3: RIWAYAT JABATAN & GAJI ---------------- */}
                                {activeTab === "riwayat" && (
                                    <div className="space-y-10 animate-in fade-in duration-300">
                                        {/* BAGIAN RIWAYAT JABATAN */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-bold text-gray-800">
                                                    Riwayat Jabatan (SCD)
                                                </h4>
                                                <PrimaryButton
                                                    onClick={() =>
                                                        setShowFormJabatan(
                                                            !showFormJabatan,
                                                        )
                                                    }
                                                    className="!py-1 !px-3 text-xs"
                                                >
                                                    {showFormJabatan
                                                        ? "Batal"
                                                        : "+ Mutasi Jabatan"}
                                                </PrimaryButton>
                                            </div>
                                            {showFormJabatan && (
                                                <form
                                                    onSubmit={submitJabatan}
                                                    className="bg-gray-50 p-4 rounded-md mb-4 border flex gap-4 items-end"
                                                >
                                                    <div className="w-1/2">
                                                        <InputLabel value="Jabatan Baru" />
                                                        <select
                                                            className="mt-1 block w-full border-gray-300 rounded-md text-sm"
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
                                                                Pilih Jabatan...
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
                                                        <InputError
                                                            message={
                                                                formJabatan
                                                                    .errors
                                                                    .jabatan_id
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <InputLabel value="Tgl Berlaku Mulai" />
                                                        <TextInput
                                                            type="date"
                                                            className="mt-1 block w-full text-sm"
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
                                                        <InputError
                                                            message={
                                                                formJabatan
                                                                    .errors
                                                                    .effective_date_start
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <PrimaryButton
                                                        disabled={
                                                            formJabatan.processing
                                                        }
                                                        className="mb-1"
                                                    >
                                                        Simpan
                                                    </PrimaryButton>
                                                </form>
                                            )}
                                            <table className="w-full text-sm text-left text-gray-500 border">
                                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                                    <tr>
                                                        <th className="px-4 py-2 border-r">
                                                            Jabatan
                                                        </th>
                                                        <th className="px-4 py-2 border-r">
                                                            Mulai Berlaku
                                                        </th>
                                                        <th className="px-4 py-2">
                                                            Berakhir Pada
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {karyawan.riwayat_jabatans &&
                                                    karyawan.riwayat_jabatans
                                                        .length > 0 ? (
                                                        karyawan.riwayat_jabatans.map(
                                                            (rj) => (
                                                                <tr
                                                                    key={rj.id}
                                                                    className="border-b"
                                                                >
                                                                    <td className="px-4 py-2 border-r font-medium text-gray-900">
                                                                        {
                                                                            rj
                                                                                .jabatan
                                                                                ?.nama_jabatan
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 border-r">
                                                                        {
                                                                            rj.effective_date_start
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        {rj.effective_date_end ? (
                                                                            rj.effective_date_end
                                                                        ) : (
                                                                            <span className="text-green-600 font-bold">
                                                                                Sekarang
                                                                                (Aktif)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="3"
                                                                className="px-4 py-3 text-center"
                                                            >
                                                                Belum ada
                                                                riwayat
                                                                tercatat.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* BAGIAN RIWAYAT GAJI */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-bold text-gray-800">
                                                    Riwayat Gaji Pokok
                                                </h4>
                                                <PrimaryButton
                                                    onClick={() =>
                                                        setShowFormGaji(
                                                            !showFormGaji,
                                                        )
                                                    }
                                                    className="!py-1 !px-3 text-xs !bg-green-600 hover:!bg-green-700"
                                                >
                                                    {showFormGaji
                                                        ? "Batal"
                                                        : "+ Kenaikan Gaji"}
                                                </PrimaryButton>
                                            </div>
                                            {showFormGaji && (
                                                <form
                                                    onSubmit={submitGaji}
                                                    className="bg-green-50 p-4 rounded-md mb-4 border border-green-100 flex gap-4 items-end"
                                                >
                                                    <div className="w-1/2">
                                                        <InputLabel value="Nominal Gaji Pokok Baru (Rp)" />
                                                        <TextInput
                                                            type="number"
                                                            className="mt-1 block w-full text-sm"
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
                                                        <InputError
                                                            message={
                                                                formGaji.errors
                                                                    .nominal_gaji_pokok
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <InputLabel value="Tgl Berlaku Mulai" />
                                                        <TextInput
                                                            type="date"
                                                            className="mt-1 block w-full text-sm"
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
                                                        <InputError
                                                            message={
                                                                formGaji.errors
                                                                    .effective_date_start
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <PrimaryButton
                                                        disabled={
                                                            formGaji.processing
                                                        }
                                                        className="mb-1 !bg-green-600 hover:!bg-green-700"
                                                    >
                                                        Simpan
                                                    </PrimaryButton>
                                                </form>
                                            )}
                                            <table className="w-full text-sm text-left text-gray-500 border">
                                                <thead className="text-xs text-gray-700 uppercase bg-green-100 border-b border-green-200">
                                                    <tr>
                                                        <th className="px-4 py-2 border-r border-green-200">
                                                            Nominal Gaji
                                                        </th>
                                                        <th className="px-4 py-2 border-r border-green-200">
                                                            Mulai Berlaku
                                                        </th>
                                                        <th className="px-4 py-2">
                                                            Berakhir Pada
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {karyawan.riwayat_gajis &&
                                                    karyawan.riwayat_gajis
                                                        .length > 0 ? (
                                                        karyawan.riwayat_gajis.map(
                                                            (rg) => (
                                                                <tr
                                                                    key={rg.id}
                                                                    className="border-b"
                                                                >
                                                                    <td className="px-4 py-2 border-r font-bold text-gray-900">
                                                                        {formatRupiah(
                                                                            rg.nominal_gaji_pokok,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2 border-r">
                                                                        {
                                                                            rg.effective_date_start
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        {rg.effective_date_end ? (
                                                                            rg.effective_date_end
                                                                        ) : (
                                                                            <span className="text-green-600 font-bold">
                                                                                Sekarang
                                                                                (Aktif)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="3"
                                                                className="px-4 py-3 text-center"
                                                            >
                                                                Belum ada
                                                                riwayat gaji
                                                                tercatat.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* ---------------- TAB 4: STRUKTUR TIM & BAWAHAN ---------------- */}
                                {activeTab === "tim" && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <h4 className="text-lg font-bold text-gray-800 mb-4">
                                            Daftar Pasukan / Bawahan Langsung
                                        </h4>
                                        {bawahans.length === 0 ? (
                                            <div className="bg-gray-50 border border-dashed border-gray-300 p-8 text-center rounded-xl">
                                                <p className="text-gray-500 font-medium">
                                                    Karyawan ini tidak memiliki
                                                    bawahan atau bukan seorang
                                                    Supervisor/Manager.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-blue-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase border-r border-blue-100">
                                                                NIK
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase border-r border-blue-100">
                                                                Nama Lengkap
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase border-r border-blue-100">
                                                                Jabatan
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-bold text-blue-800 uppercase">
                                                                Aksi
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {bawahans.map(
                                                            (bawahan) => (
                                                                <tr
                                                                    key={
                                                                        bawahan.id
                                                                    }
                                                                    className="hover:bg-gray-50 transition"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r">
                                                                        {
                                                                            bawahan.nik_internal
                                                                        }
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 border-r">
                                                                        {
                                                                            bawahan.nama_lengkap
                                                                        }
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                                                        {
                                                                            bawahan
                                                                                .jabatan
                                                                                ?.nama_jabatan
                                                                        }
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                                        <Link
                                                                            href={route(
                                                                                "karyawan.show",
                                                                                bawahan.id,
                                                                            )}
                                                                            className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded font-bold transition"
                                                                        >
                                                                            Lihat
                                                                            Profil
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ---------------- TAB 5: DOKUMEN & BERKAS (DIUPDATE DENGAN PREVIEW) ---------------- */}
                                {activeTab === "dokumen" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                                            <h4 className="text-lg font-bold text-gray-800">
                                                Dokumen Karyawan
                                            </h4>
                                        </div>

                                        {/* Form Upload Dokumen */}
                                        <form
                                            onSubmit={submitDokumen}
                                            className="bg-orange-50 p-4 rounded-md border border-orange-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                                        >
                                            <div>
                                                <InputLabel value="Jenis Dokumen" />
                                                <select
                                                    className="mt-1 block w-full border-gray-300 rounded-md text-sm"
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
                                                    required
                                                >
                                                    <option value="">
                                                        Pilih...
                                                    </option>
                                                    <option value="KTP">
                                                        KTP
                                                    </option>
                                                    <option value="KK">
                                                        Kartu Keluarga (KK)
                                                    </option>
                                                    <option value="NPWP">
                                                        NPWP
                                                    </option>
                                                    <option value="Ijazah">
                                                        Ijazah
                                                    </option>
                                                    <option value="Paklaring">
                                                        Paklaring / Surat Kerja
                                                    </option>
                                                    <option value="Sertifikat">
                                                        Sertifikat / Pelatihan
                                                    </option>
                                                    <option value="Buku Rekening">
                                                        Buku Rekening
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={
                                                        formDokumen.errors
                                                            .jenis_dokumen
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="Nama Dokumen (Bebas)" />
                                                <TextInput
                                                    type="text"
                                                    className="mt-1 block w-full text-sm"
                                                    placeholder="Contoh: Ijazah S1 Informatika"
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
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        formDokumen.errors
                                                            .nama_dokumen
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="File (PDF/JPG/PNG max 5MB)" />
                                                {/* MODIFIKASI: Menggunakan handleFileChange & tambahan ID */}
                                                <input
                                                    id="file-upload-input"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
                                                    onChange={handleFileChange}
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        formDokumen.errors
                                                            .file_dokumen
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <PrimaryButton
                                                    disabled={
                                                        formDokumen.processing ||
                                                        !formDokumen.data
                                                            .file_dokumen
                                                    }
                                                    className="w-full justify-center !bg-orange-600 hover:!bg-orange-700 h-10"
                                                >
                                                    {formDokumen.processing
                                                        ? "Mengunggah..."
                                                        : "Upload File"}
                                                </PrimaryButton>
                                            </div>

                                            {/* --- KOTAK PREVIEW MUNCUL JIKA ADA FILE --- */}
                                            {formDokumen.data.file_dokumen && (
                                                <div className="mt-4 p-4 bg-white border border-dashed border-orange-300 rounded-md flex items-center gap-4 animate-in fade-in duration-300 md:col-span-4">
                                                    {/* Thumbnail Box */}
                                                    <div className="w-20 h-20 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center overflow-hidden border">
                                                        {previewUrl ===
                                                        "pdf" ? (
                                                            <div className="flex flex-col items-center justify-center text-red-500">
                                                                <svg
                                                                    className="w-8 h-8 mb-1"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                                <span className="text-[10px] font-bold">
                                                                    PDF
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={previewUrl}
                                                                alt="Preview Dokumen"
                                                                className="w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                                                onClick={() =>
                                                                    setIsZoomed(
                                                                        true,
                                                                    )
                                                                }
                                                                title="Klik untuk memperbesar"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Info File & Tombol Batal */}
                                                    <div className="flex flex-col flex-grow">
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {
                                                                formDokumen.data
                                                                    .file_dokumen
                                                                    .name
                                                            }
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Ukuran:{" "}
                                                            {(
                                                                formDokumen.data
                                                                    .file_dokumen
                                                                    .size /
                                                                1024 /
                                                                1024
                                                            ).toFixed(2)}{" "}
                                                            MB
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleBatalkanFile
                                                            }
                                                            className="mt-2 text-xs font-bold text-red-600 hover:text-red-800 self-start bg-red-50 px-2 py-1 rounded"
                                                        >
                                                            ❌ Batalkan File Ini
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </form>
                                        {isZoomed &&
                                            previewUrl &&
                                            previewUrl !== "pdf" && (
                                                <div
                                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                                                    onClick={() =>
                                                        setIsZoomed(false)
                                                    }
                                                >
                                                    <div className="relative max-w-4xl max-h-[90vh] w-full flex justify-center">
                                                        <button
                                                            onClick={() =>
                                                                setIsZoomed(
                                                                    false,
                                                                )
                                                            }
                                                            className="absolute -top-12 right-0 md:-right-10 text-white hover:text-gray-300 text-4xl font-bold cursor-pointer drop-shadow-md"
                                                        >
                                                            &times;
                                                        </button>
                                                        <img
                                                            src={previewUrl}
                                                            alt="Zoomed Preview"
                                                            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            } // Supaya klik gambar tidak menutup modal
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                        {/* Tabel List Dokumen */}
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">
                                                            Jenis
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">
                                                            Keterangan / Nama
                                                            File
                                                        </th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r">
                                                            Tanggal Upload
                                                        </th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                                                            Aksi
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {karyawan.dokumens &&
                                                    karyawan.dokumens.length >
                                                        0 ? (
                                                        karyawan.dokumens.map(
                                                            (dokumen) => (
                                                                <tr
                                                                    key={
                                                                        dokumen.id
                                                                    }
                                                                    className="hover:bg-gray-50"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 border-r">
                                                                        {
                                                                            dokumen.jenis_dokumen
                                                                        }
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r">
                                                                        {
                                                                            dokumen.nama_dokumen
                                                                        }
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 border-r">
                                                                        {new Date(
                                                                            dokumen.created_at,
                                                                        ).toLocaleDateString(
                                                                            "id-ID",
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
                                                                        <a
                                                                            href={
                                                                                dokumen.file_path
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-block bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs font-bold transition"
                                                                        >
                                                                            Lihat
                                                                            File
                                                                        </a>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteDokumen(
                                                                                    dokumen.id,
                                                                                )
                                                                            }
                                                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-bold transition"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="4"
                                                                className="px-6 py-8 text-center text-gray-500"
                                                            >
                                                                Belum ada
                                                                dokumen yang
                                                                diunggah untuk
                                                                karyawan ini.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
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
