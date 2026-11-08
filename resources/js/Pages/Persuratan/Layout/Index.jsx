import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import InputError from "@/Components/InputError";

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
        is_active: true,
        logo_header: null,
        watermark: null,
        banner_footer: null,
    });

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
                                <InputLabel value="Alamat" />
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
                                <InputLabel value="Telepon" />
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
                                <InputLabel value="Email" />
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
                                <InputLabel value="Website" />
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
                                    <InputLabel
                                        value="1. Logo Utama (Header)"
                                        className="mb-2 w-full text-left"
                                    />
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
                                    <InputLabel
                                        value="2. Watermark Transparan"
                                        className="mb-2 w-full text-left"
                                    />
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
                                    <InputLabel
                                        value="3. Banner Slogan Footer"
                                        className="mb-2 w-full text-left"
                                    />
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
