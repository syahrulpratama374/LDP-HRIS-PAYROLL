import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import InputError from "@/Components/InputError";

/** Penanda field yang tidak dipakai di PDF selama mode latar penuh aktif (tetap bisa diisi sebagai cadangan). */
function TandaCadangan({ aktif }) {
    if (!aktif) return null;
    return (
        <span className="ml-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 align-middle">
            Tidak dipakai · cadangan
        </span>
    );
}

export default function Index({ auth, layouts }) {
    const { flash } = usePage().props;
    const activeLayout = layouts.find((l) => l.is_active) || {};

    const { data, setData, post, processing, errors } = useForm({
        tahun_periode:
            activeLayout.tahun_periode || new Date().getFullYear().toString(),
        nama_perusahaan:
            activeLayout.nama_perusahaan || "PT. LINTAS DATA PRIMA",
        slogan:
            activeLayout.slogan || "Telecommunication & IT Managed Services",
        alamat: activeLayout.alamat || "Jl. Sakti No. 12, Yogyakarta",
        telepon: activeLayout.telepon || "(0274) 415632",
        email: activeLayout.email || "sales@ldp.net.id",
        website: activeLayout.website || "www.ldp.net.id",
        kota_surat: activeLayout.kota_surat || "Bantul",
        is_active: true,
        logo_header: null,
        watermark: null,
        banner_footer: null,
        logo_iso: [],
        latar_kop: null,
    });

    const [isoPreviews, setIsoPreviews] = useState(
        (activeLayout.logo_iso_paths || []).map((p) => `/storage/${p}`),
    );

    const handleIsoChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 4);
        setData("logo_iso", files);
        setIsoPreviews(files.map((f) => URL.createObjectURL(f)));
    };

    const [previewImages, setPreviewImages] = useState({
        logo_header: activeLayout.logo_header_path
            ? `/storage/${activeLayout.logo_header_path}`
            : null,
        watermark: activeLayout.watermark_path
            ? `/storage/${activeLayout.watermark_path}`
            : null,
        banner_footer: activeLayout.banner_footer_path
            ? `/storage/${activeLayout.banner_footer_path}`
            : null,
        latar_kop: activeLayout.latar_kop_path
            ? `/storage/${activeLayout.latar_kop_path}`
            : null,
    });

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        setData(field, file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImages((prev) => ({
                    ...prev,
                    [field]: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Mode latar penuh: layout aktif sudah punya gambar latar, atau gambar latar baru sedang dipilih
    const modeLatar = !!(activeLayout.latar_kop_path || data.latar_kop);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("layout.store"), {
            preserveScroll: true,
            forceFormData: true, // Wajib ditambahkan agar file gambar terkirim ke Laravel
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Pengaturan Kop Surat & Aset Visual
                </h2>
            }
        >
            <Head title="Pengaturan Layout Surat" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <strong className="font-bold">Berhasil! </strong>
                            <span className="block sm:inline">
                                {flash.success}
                            </span>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-indigo-600"
                    >
                        {modeLatar && (
                            <div className="mb-5 p-3 rounded border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm">
                                <strong>Mode latar kop A4 penuh aktif.</strong>{" "}
                                PDF memakai Gambar Latar Kop (bagian 5).
                                Field bertanda{" "}
                                <span className="font-semibold text-amber-700">
                                    Tidak dipakai · cadangan
                                </span>{" "}
                                tidak tampil di PDF, tetapi tetap disimpan
                                sebagai cadangan bila gambar latar dikosongkan.
                            </div>
                        )}

                        <h4 className="font-bold text-gray-800 mb-4">
                            Informasi Perusahaan
                        </h4>

                        {/* BLOK IDENTITAS TEKS (Sekarang bisa diketik karena ada onChange) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <InputLabel value="Nama Perusahaan" />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.nama_perusahaan}
                                    onChange={(e) =>
                                        setData(
                                            "nama_perusahaan",
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.nama_perusahaan}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Slogan" />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.slogan}
                                    onChange={(e) =>
                                        setData("slogan", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.slogan}
                                    className="mt-2"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputLabel value="Alamat" className="inline" />
                                <TandaCadangan aktif={modeLatar} />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.alamat}
                                    onChange={(e) =>
                                        setData("alamat", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.alamat}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Telepon" className="inline" />
                                <TandaCadangan aktif={modeLatar} />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.telepon}
                                    onChange={(e) =>
                                        setData("telepon", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.telepon}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Email" className="inline" />
                                <TandaCadangan aktif={modeLatar} />
                                <TextInput
                                    type="email"
                                    className="mt-1 block w-full text-sm"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.email}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Website" className="inline" />
                                <TandaCadangan aktif={modeLatar} />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.website}
                                    onChange={(e) =>
                                        setData("website", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.website}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Kota pada Tanggal Surat" />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.kota_surat}
                                    onChange={(e) =>
                                        setData("kota_surat", e.target.value)
                                    }
                                    placeholder="Bantul"
                                />
                                <span className="text-xs text-gray-400">
                                    Contoh hasil: {data.kota_surat || "Bantul"},
                                    26 Agustus 2026
                                </span>
                                <InputError
                                    message={errors.kota_surat}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Tahun Periode" />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={data.tahun_periode}
                                    onChange={(e) =>
                                        setData("tahun_periode", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.tahun_periode}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {/* BLOK UPLOAD GAMBAR */}
                        <div className="border-t pt-4 mt-6">
                            <h4 className="font-bold text-gray-800 mb-3">
                                Upload File Gambar Branding (PNG / JPG
                                Transparan)
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* Logo Utama */}
                                <div className="p-3 border rounded bg-gray-50 flex flex-col items-center">
                                    <div className="mb-2 w-full text-left">
                                        <InputLabel
                                            value="1. Logo Utama (Header)"
                                            className="inline"
                                        />
                                        <TandaCadangan aktif={modeLatar} />
                                    </div>
                                    {previewImages.logo_header ? (
                                        <div className="h-24 w-full flex justify-center items-center bg-white border rounded overflow-hidden mb-2">
                                            <img
                                                src={previewImages.logo_header}
                                                alt="Preview Logo"
                                                className="object-contain h-full w-full p-1"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-24 w-full flex justify-center items-center bg-gray-200 border rounded mb-2 text-xs text-gray-400">
                                            Tidak Ada Logo
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 text-xs w-full"
                                        onChange={(e) =>
                                            handleFileChange(e, "logo_header")
                                        }
                                    />
                                    <InputError message={errors.logo_header} />
                                </div>

                                {/* Watermark */}
                                <div className="p-3 border rounded bg-gray-50 flex flex-col items-center">
                                    <div className="mb-2 w-full text-left">
                                        <InputLabel
                                            value="2. Watermark Transparan"
                                            className="inline"
                                        />
                                        <TandaCadangan aktif={modeLatar} />
                                    </div>
                                    {previewImages.watermark ? (
                                        <div className="h-24 w-full flex justify-center items-center bg-white border rounded overflow-hidden mb-2">
                                            <img
                                                src={previewImages.watermark}
                                                alt="Preview Watermark"
                                                className="object-contain h-full w-full p-1 opacity-50"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-24 w-full flex justify-center items-center bg-gray-200 border rounded mb-2 text-xs text-gray-400">
                                            Tidak Ada Watermark
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 text-xs w-full"
                                        onChange={(e) =>
                                            handleFileChange(e, "watermark")
                                        }
                                    />
                                    <InputError message={errors.watermark} />
                                </div>

                                {/* Banner Footer */}
                                <div className="p-3 border rounded bg-gray-50 flex flex-col items-center">
                                    <div className="mb-2 w-full text-left">
                                        <InputLabel
                                            value="3. Banner Slogan Footer"
                                            className="inline"
                                        />
                                        <TandaCadangan aktif={modeLatar} />
                                    </div>
                                    {previewImages.banner_footer ? (
                                        <div className="h-24 w-full flex justify-center items-center bg-white border rounded overflow-hidden mb-2">
                                            <img
                                                src={
                                                    previewImages.banner_footer
                                                }
                                                alt="Preview Banner"
                                                className="object-contain h-full w-full p-1"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-24 w-full flex justify-center items-center bg-gray-200 border rounded mb-2 text-xs text-gray-400">
                                            Tidak Ada Banner
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 text-xs w-full"
                                        onChange={(e) =>
                                            handleFileChange(e, "banner_footer")
                                        }
                                    />
                                    <InputError
                                        message={errors.banner_footer}
                                    />
                                </div>
                            </div>

                            {/* Logo Sertifikasi ISO (footer kiri) */}
                            <div className="p-3 border rounded bg-gray-50 mb-6">
                                <div className="mb-2">
                                    <InputLabel
                                        value="4. Logo Sertifikasi ISO (footer kiri, maks. 4 file)"
                                        className="inline"
                                    />
                                    <TandaCadangan aktif={modeLatar} />
                                </div>
                                <div className="flex gap-3 flex-wrap mb-2">
                                    {isoPreviews.length > 0 ? (
                                        isoPreviews.map((src, i) => (
                                            <div
                                                key={i}
                                                className="h-20 w-20 flex justify-center items-center bg-white border rounded overflow-hidden"
                                            >
                                                <img
                                                    src={src}
                                                    alt={`ISO ${i + 1}`}
                                                    className="object-contain h-full w-full p-1"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-20 px-4 flex items-center bg-gray-200 border rounded text-xs text-gray-400">
                                            Belum ada logo ISO
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="text-xs w-full"
                                    onChange={handleIsoChange}
                                />
                                <span className="text-xs text-gray-400">
                                    Unggahan baru menggantikan seluruh logo ISO
                                    sebelumnya. Gambar yang tidak diunggah ulang
                                    tetap memakai gambar layout aktif.
                                </span>
                                <InputError message={errors.logo_iso} />
                            </div>

                            {/* Gambar Latar Kop A4 penuh */}
                            <div className="p-3 border rounded bg-gray-50 mb-6 flex gap-4 items-start">
                                {previewImages.latar_kop ? (
                                    <img
                                        src={previewImages.latar_kop}
                                        alt="Latar Kop"
                                        className="w-28 border bg-white"
                                        style={{ aspectRatio: "210 / 297" }}
                                    />
                                ) : (
                                    <div
                                        className="w-28 flex items-center justify-center bg-gray-200 border text-xs text-gray-400 text-center p-2"
                                        style={{ aspectRatio: "210 / 297" }}
                                    >
                                        Belum ada latar
                                    </div>
                                )}
                                <div className="flex-1">
                                    <InputLabel
                                        value="5. Gambar Latar Kop (A4 penuh)"
                                        className="mb-1"
                                    />
                                    <p className="text-xs text-gray-500 mb-2">
                                        Gunakan satu gambar A4 tegak
                                        (disarankan 2480×3508 px, JPG/PNG).
                                        Area isi surat: sekitar 3 cm dari atas
                                        sampai 6,5 cm dari bawah harus kosong.
                                        Bila gambar ini diisi, alamat, kontak,
                                        logo, watermark, dan banner di form ini
                                        tidak dipakai di PDF.
                                    </p>
                                    {modeLatar && (
                                        <span className="inline-block mb-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
                                            ● Mode latar penuh aktif
                                        </span>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="text-xs w-full"
                                        onChange={(e) =>
                                            handleFileChange(e, "latar_kop")
                                        }
                                    />
                                    <InputError message={errors.latar_kop} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t pt-4">
                            <PrimaryButton
                                disabled={processing}
                                className="!bg-indigo-600 hover:!bg-indigo-700"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan & Aktifkan Layout"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
