import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Create({ auth, templates = [], karyawans = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        template_id: "",
        karyawan_id: "",
        isi_surat_final: "",
        lampirans: [],
    });

    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Menyuntikkan konten template ke React Quill setiap kali Template atau Karyawan diubah
    useEffect(() => {
        if (data.template_id) {
            const template = templates.find((t) => t.id == data.template_id);
            setSelectedTemplate(template || null);

            if (template) {
                let html = template.konten || "";
                const karyawan = karyawans.find(
                    (k) => k.id == data.karyawan_id,
                );

                if (karyawan) {
                    html = html.replace(
                        /\[nama_karyawan\]/gi,
                        `<strong>${karyawan.nama_lengkap}</strong>`,
                    );
                    html = html.replace(
                        /\[nik\]/gi,
                        karyawan.nik_internal || "-",
                    );
                    html = html.replace(
                        /\[jabatan\]/gi,
                        karyawan.jabatan?.nama_jabatan || "-",
                    );
                    html = html.replace(
                        /\[alamat\]/gi,
                        karyawan.alamat_domisili || "-",
                    );
                } else {
                    html = html.replace(
                        /\[nama_karyawan\]/gi,
                        "<span class='bg-yellow-200 px-1 rounded'>[Nama Karyawan/Penerima]</span>",
                    );
                    html = html.replace(
                        /\[nik\]/gi,
                        "<span class='bg-yellow-200 px-1 rounded'>[NIK]</span>",
                    );
                    html = html.replace(
                        /\[jabatan\]/gi,
                        "<span class='bg-yellow-200 px-1 rounded'>[Jabatan]</span>",
                    );
                    html = html.replace(
                        /\[alamat\]/gi,
                        "<span class='bg-yellow-200 px-1 rounded'>[Alamat]</span>",
                    );
                }

                const today = new Date().toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
                html = html.replace(/\[tanggal_hari_ini\]/gi, today);

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
                        {/* BAGIAN KIRI: FORM KONTROL & EDITOR */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            <div className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-indigo-500">
                                {/* 1. PILIH TEMPLATE SURAT TERLEBIH DAHULU */}
                                <div className="mb-4">
                                    <InputLabel value="1. Pilih Jenis Template Surat" />
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

                                {/* 2. PILIH KARYAWAN PENERIMA (OPSIONAL / NULLABLE) */}
                                <div className="mb-4">
                                    <InputLabel value="2. Surat Ditujukan Kepada (Karyawan Internal / Opsional)" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm text-sm"
                                        value={data.karyawan_id}
                                        onChange={(e) =>
                                            setData(
                                                "karyawan_id",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            -- Ditujukan ke Pihak Eksternal /
                                            Tanpa Karyawan --
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

                                {/* 3. EDITOR ISI SURAT */}
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
                                                    height: "280px",
                                                    marginBottom: "40px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* UPLOAD LAMPIRAN */}
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

                                {/* ACTION BUTTONS */}
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
                                            : "Ajukan Draft Surat"}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN KANAN: LIVE PREVIEW KERTAS A4 */}
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

                                            {/* PREVIEW ALUR APPROVAL */}
                                            <div className="mt-12 border-t pt-4 text-xs text-gray-700">
                                                <p className="font-semibold text-gray-500 mb-3 uppercase tracking-wider text-[11px]">
                                                    Alur Penandatangan Sah
                                                    (Otomatis Sesuai Blueprint)
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                                                    {selectedTemplate.rute_approvals &&
                                                    selectedTemplate
                                                        .rute_approvals.length >
                                                        0 ? (
                                                        selectedTemplate.rute_approvals.map(
                                                            (rute, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="border p-2 rounded bg-gray-50"
                                                                >
                                                                    <p className="font-bold text-indigo-600">
                                                                        {
                                                                            rute.label_ttd
                                                                        }
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-500">
                                                                        {rute
                                                                            .jabatan
                                                                            ?.nama_jabatan ||
                                                                            "Jabatan"}
                                                                    </p>
                                                                    <div className="my-2 text-[10px] italic text-orange-500 border border-dashed border-orange-300 bg-orange-50 py-1 rounded">
                                                                        [Menunggu
                                                                        TTD/QR]
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )
                                                    ) : (
                                                        <div className="col-span-full text-center py-2 text-gray-400 italic">
                                                            Surat diterbitkan
                                                            otomatis oleh sistem
                                                            tanpa persetujuan
                                                            bertingkat.
                                                        </div>
                                                    )}
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
