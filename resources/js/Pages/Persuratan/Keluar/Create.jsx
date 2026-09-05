import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";

export default function Create({ auth, templates, karyawans }) {
    const { data, setData, post, processing, errors } = useForm({
        template_id: "",
        karyawan_id: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("keluar.store"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Buat Draft Surat Baru
                </h2>
            }
        >
            <Head title="Buat Surat Keluar" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            {/* Pilihan Template Surat */}
                            <div>
                                <InputLabel
                                    htmlFor="template_id"
                                    value="Jenis Surat (Template)"
                                />
                                <select
                                    id="template_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.template_id}
                                    onChange={(e) =>
                                        setData("template_id", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        -- Pilih Jenis Surat --
                                    </option>
                                    {templates.map((template) => (
                                        <option
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {template.nama_template} (
                                            {template.kode_surat})
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.template_id}
                                    className="mt-2"
                                />
                            </div>

                            {/* Pilihan Karyawan Tujuan */}
                            <div>
                                <InputLabel
                                    htmlFor="karyawan_id"
                                    value="Karyawan Tujuan"
                                />
                                <select
                                    id="karyawan_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.karyawan_id}
                                    onChange={(e) =>
                                        setData("karyawan_id", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        -- Pilih Karyawan --
                                    </option>
                                    {karyawans.map((karyawan) => (
                                        <option
                                            key={karyawan.id}
                                            value={karyawan.id}
                                        >
                                            {/* UBAH BARIS INI: */}
                                            {karyawan.nik_internal} -{" "}
                                            {karyawan.nama_lengkap}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.karyawan_id}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t">
                                <PrimaryButton disabled={processing}>
                                    Simpan sebagai Draft
                                </PrimaryButton>
                                <Link
                                    href={route("keluar.index")}
                                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                                >
                                    Batal
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
