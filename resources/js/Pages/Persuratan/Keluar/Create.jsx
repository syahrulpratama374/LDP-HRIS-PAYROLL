import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Create({ auth, templates, karyawans, approvers }) {
    const { data, setData, post, processing, errors } = useForm({
        template_id: "",
        karyawan_id: "",
        approver_id: "",
        isi_surat_final: "",
        lampirans: [],
    });

    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Menyuntikkan template ke React Quill setiap kali Template atau Karyawan diubah
    useEffect(() => {
        if (data.template_id) {
            const template = templates.find((t) => t.id == data.template_id);
            setSelectedTemplate(template || null);

            if (template) {
                let html = template.konten;
                const karyawan = karyawans.find(
                    (k) => k.id == data.karyawan_id,
                );

                if (karyawan) {
                    html = html.replace(
                        /\[nama_karyawan\]/g,
                        `<strong>${karyawan.nama_lengkap}</strong>`,
                    );
                    html = html.replace(/[nik]/g, karyawan.nik_internal || "-");
                    html = html.replace(
                        /[jabatan]/g,
                        karyawan.jabatan?.nama_jabatan || "-",
                    );
                    html = html.replace(
                        /[alamat]/g,
                        karyawan.alamat_domisili || "-",
                    );
                } else {
                    html = html.replace(
                        /\[nama_karyawan\]/g,
                        "<span class='bg-yellow-200'>[Nama Karyawan]</span>",
                    );
                    html = html.replace(
                        /[nik]/g,
                        "<span class='bg-yellow-200'>[NIK]</span>",
                    );
                    html = html.replace(
                        /[jabatan]/g,
                        "<span class='bg-yellow-200'>[Jabatan]</span>",
                    );
                    html = html.replace(
                        /[alamat]/g,
                        "<span class='bg-yellow-200'>[Alamat]</span>",
                    );
                }

                const today = new Date().toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
                html = html.replace(/\[tanggal_hari_ini\]/g, today);

                setData("isi_surat_final", html);
            }
        } else {
            setSelectedTemplate(null);
            setData("isi_surat_final", "");
        }
    }, [data.template_id, data.karyawan_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("keluar.store"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Buat Surat Keluar Baru
                </h2>
            }
        >
            <Head title="Buat Surat Keluar" />

            <div className="py-8">
                <div className="max-w-[95%] mx-auto sm:px-6 lg:px-8">
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* BAGIAN KIRI: KONTROL & EDITOR */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            <div className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-indigo-500">
                                <div className="mb-4">
                                    <InputLabel value="1. Surat Ditujukan Kepada (Karyawan)" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm text-sm"
                                        value={data.karyawan_id}
                                        onChange={(e) =>
                                            setData(
                                                "karyawan_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Karyawan --
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
                                    <InputLabel value="2. Pilih Template Surat" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm text-sm"
                                        value={data.template_id}
                                        onChange={(e) =>
                                            setData(
                                                "template_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Template --
                                        </option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.kode_surat} -{" "}
                                                {t.nama_template}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.template_id}
                                        className="mt-1"
                                    />
                                </div>

                                {selectedTemplate && (
                                    <div className="mb-4">
                                        <InputLabel value="3. Editor Isi Surat (Format Bebas)" />
                                        <div className="mt-1 bg-white">
                                            <ReactQuill
                                                theme="snow"
                                                value={data.isi_surat_final}
                                                onChange={(val) =>
                                                    setData(
                                                        "isi_surat_final",
                                                        val,
                                                    )
                                                }
                                                style={{
                                                    height: "300px",
                                                    marginBottom: "40px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedTemplate?.kategori_alur ===
                                    "Approval_Direksi" && (
                                    <div className="mb-4 p-4 border border-orange-200 bg-orange-50 rounded-md">
                                        <InputLabel value="4. Pilih Pimpinan Penandatangan (Approver)" />
                                        <select
                                            className="mt-1 block w-full border-orange-300 rounded-md shadow-sm text-sm"
                                            value={data.approver_id}
                                            onChange={(e) =>
                                                setData(
                                                    "approver_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Pimpinan --
                                            </option>
                                            {approvers.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.approver_id}
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                                {/* Input Upload Lampiran (Opsional) */}
                                <div className="mb-4">
                                    <InputLabel value="Upload Lampiran Tambahan (Opsional - Bisa Pilih Banyak)" />
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={(e) =>
                                            setData(
                                                "lampirans",
                                                Array.from(e.target.files),
                                            )
                                        }
                                    />
                                    <span className="text-xs text-gray-400">
                                        Format: PDF, PNG, JPG, DOCX (Maks.
                                        5MB/file)
                                    </span>
                                    <InputError
                                        message={errors.lampirans}
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
                                        className="w-2/3 justify-center !bg-indigo-600 hover:!bg-indigo-700"
                                        disabled={
                                            processing || !selectedTemplate
                                        }
                                    >
                                        {processing
                                            ? "Memproses..."
                                            : selectedTemplate?.kategori_alur ===
                                                "Approval_Direksi"
                                              ? "Ajukan Draft Surat"
                                              : "Terbitkan Surat"}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN KANAN: LIVE PREVIEW KERTAS */}
                        <div className="lg:col-span-7">
                            <div className="sticky top-6">
                                <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase flex items-center justify-between">
                                    <span>👁️ Live Preview Kertas A4</span>
                                    <span className="text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
                                        Auto-Update Active
                                    </span>
                                </h3>

                                <div
                                    className="bg-white shadow-2xl rounded-sm overflow-auto max-h-[85vh] border border-gray-300 flex flex-col justify-between"
                                    style={{
                                        aspectRatio: "1 / 1.414",
                                        minHeight: "800px",
                                        width: "100%",
                                        padding: "40px 50px",
                                    }}
                                >
                                    {selectedTemplate ? (
                                        <>
                                            <div
                                                className="prose prose-sm max-w-none text-gray-800 flex-grow"
                                                dangerouslySetInnerHTML={{
                                                    __html: data.isi_surat_final,
                                                }}
                                            />

                                            <div className="mt-16 flex justify-end text-sm text-gray-800">
                                                <div className="text-center w-64">
                                                    <p>
                                                        Yogyakarta,{" "}
                                                        {new Date().toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            },
                                                        )}
                                                    </p>
                                                    <p className="font-bold">
                                                        {selectedTemplate.pembuat_kode ===
                                                        "LDP-DIR"
                                                            ? "PT. Lintas Data Prima"
                                                            : "Departemen Terkait"}
                                                    </p>

                                                    <div className="h-24 mt-4 mb-2 flex items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
                                                        {selectedTemplate.kategori_alur ===
                                                        "Approval_Direksi"
                                                            ? "[ Menunggu TTD / QR Code Validasi ]"
                                                            : "[ Validasi Sistem Terbit Otomatis ]"}
                                                    </div>

                                                    <p className="font-bold underline uppercase">
                                                        {approvers.find(
                                                            (a) =>
                                                                a.id ==
                                                                data.approver_id,
                                                        )?.name ||
                                                            "(Nama Pimpinan)"}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-center mt-20">
                                            Pilih template surat terlebih dahulu
                                            untuk melihat preview.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
