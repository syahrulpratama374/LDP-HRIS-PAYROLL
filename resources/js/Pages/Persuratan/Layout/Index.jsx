import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import InputError from "@/Components/InputError";

export default function Index({ auth, layouts }) {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("layout.store"));
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
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-indigo-600"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                            Identitas & Branding Surat Perusahaan
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <InputLabel value="Tahun Periode Layout" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.tahun_periode}
                                    onChange={(e) =>
                                        setData("tahun_periode", e.target.value)
                                    }
                                    required
                                />
                                <InputError message={errors.tahun_periode} />
                            </div>
                            <div>
                                <InputLabel value="Nama Perusahaan Resmi" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.nama_perusahaan}
                                    onChange={(e) =>
                                        setData(
                                            "nama_perusahaan",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError message={errors.nama_perusahaan} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <InputLabel value="Sub-Judul / Slogan" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.slogan}
                                    onChange={(e) =>
                                        setData("slogan", e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel value="Nomor Telepon Hotline" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.telepon}
                                    onChange={(e) =>
                                        setData("telepon", e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <InputLabel value="Email Resmi" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel value="Website Resmi" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.website}
                                    onChange={(e) =>
                                        setData("website", e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <InputLabel value="Alamat Kantor Pusat (Head Office)" />
                            <textarea
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                rows="2"
                                value={data.alamat}
                                onChange={(e) =>
                                    setData("alamat", e.target.value)
                                }
                            />
                        </div>

                        <div className="border-t pt-4 mt-6">
                            <h4 className="font-bold text-gray-800 mb-3">
                                Upload File Gambar Branding (PNG / JPG
                                Transparan)
                            </h4>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-3 border rounded bg-gray-50">
                                    <InputLabel value="1. Logo Utama (Header Kiri)" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 text-xs"
                                        onChange={(e) =>
                                            setData(
                                                "logo_header",
                                                e.target.files[0],
                                            )
                                        }
                                    />
                                </div>
                                <div className="p-3 border rounded bg-gray-50">
                                    <InputLabel value="2. Watermark Transparan (Tengah)" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 text-xs"
                                        onChange={(e) =>
                                            setData(
                                                "watermark",
                                                e.target.files[0],
                                            )
                                        }
                                    />
                                </div>
                                <div className="p-3 border rounded bg-gray-50">
                                    <InputLabel value="3. Banner Slogan Footer (Bawah)" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 text-xs"
                                        onChange={(e) =>
                                            setData(
                                                "banner_footer",
                                                e.target.files[0],
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t pt-4">
                            <PrimaryButton disabled={processing}>
                                Simpan & Aktifkan Layout
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
