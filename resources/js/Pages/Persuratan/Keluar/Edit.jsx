import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Edit({ auth, surat, templates = [], karyawans = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        karyawan_id: surat.karyawan_id || "",
        isi_surat_final: surat.isi_surat_final || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("keluar.update", surat.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Edit & Revisi Draf Surat Keluar
                </h2>
            }
        >
            <Head title="Edit Surat Keluar" />

            <div className="py-8">
                <div className="max-w-[95%] mx-auto sm:px-6 lg:px-8">
                    {surat.catatan_revisi && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
                            <p className="font-bold text-sm">
                                Catatan Revisi dari Atasan:
                            </p>
                            <p className="text-sm mt-1">
                                {surat.catatan_revisi}
                            </p>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* BAGIAN KIRI: FORM EDIT */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            <div className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-amber-500">
                                <div className="mb-4">
                                    <InputLabel value="1. Ditujukan Kepada (Karyawan Internal)" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-amber-500 rounded-md shadow-sm text-sm"
                                        value={data.karyawan_id}
                                        onChange={(e) =>
                                            setData(
                                                "karyawan_id",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            -- Pihak Eksternal / Tanpa Karyawan
                                            --
                                        </option>
                                        {karyawans.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.nik_internal} -{" "}
                                                {k.nama_lengkap}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.karyawan_id}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="mb-4">
                                    <InputLabel value="2. Perbaiki Isi Surat" />
                                    <div className="mt-1 bg-white">
                                        <ReactQuill
                                            theme="snow"
                                            value={data.isi_surat_final}
                                            onChange={(val) =>
                                                setData("isi_surat_final", val)
                                            }
                                            style={{
                                                height: "280px",
                                                marginBottom: "40px",
                                            }}
                                        />
                                    </div>
                                    <InputError
                                        message={errors.isi_surat_final}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="mt-6 flex gap-3 border-t pt-4">
                                    <Link
                                        href={route("keluar.index")}
                                        className="w-1/3"
                                    >
                                        <SecondaryButton className="w-full justify-center">
                                            Batal
                                        </SecondaryButton>
                                    </Link>
                                    <PrimaryButton
                                        className="w-2/3 justify-center !bg-amber-600 hover:!bg-amber-700"
                                        disabled={processing}
                                    >
                                        {processing
                                            ? "Memproses..."
                                            : "Simpan & Ajukan Ulang"}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN KANAN: LIVE PREVIEW */}
                        <div className="lg:col-span-7">
                            <div className="sticky top-6">
                                <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase flex items-center justify-between">
                                    <span>👁️ Live Preview Perubahan (A4)</span>
                                </h3>

                                <div
                                    className="bg-white shadow-2xl rounded-sm overflow-auto max-h-[85vh] border border-gray-300 p-10 flex flex-col justify-between"
                                    style={{
                                        aspectRatio: "1 / 1.414",
                                        minHeight: "800px",
                                        width: "100%",
                                    }}
                                >
                                    <div
                                        className="prose prose-sm max-w-none text-gray-800"
                                        dangerouslySetInnerHTML={{
                                            __html: data.isi_surat_final,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
