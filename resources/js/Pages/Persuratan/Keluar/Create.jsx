import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";

export default function Create({ auth, templates, karyawans, approvers }) {
    const { data, setData, post, processing, errors } = useForm({
        template_id: "",
        karyawan_id: "",
        approver_id: "",
        keterangan_tambahan: "", // Jika ada teks bebas yang ingin ditambahkan
    });

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedKaryawan, setSelectedKaryawan] = useState(null);
    const [previewHtml, setPreviewHtml] = useState(
        "<p class='text-gray-400 text-center mt-10'>Pilih template surat terlebih dahulu untuk melihat preview.</p>",
    );

    // Fungsi untuk merender ulang Live Preview setiap ada perubahan input
    useEffect(() => {
        if (selectedTemplate) {
            let html = selectedTemplate.konten;

            // Render data karyawan jika dipilih
            if (selectedKaryawan) {
                html = html.replace(
                    /\[nama_karyawan\]/g,
                    `<strong>${selectedKaryawan.nama_lengkap}</strong>`,
                );
                html = html.replace(
                    /[nik]/g,
                    selectedKaryawan.nik_internal || "-",
                );
                html = html.replace(
                    /[jabatan]/g,
                    selectedKaryawan.jabatan?.nama_jabatan || "-",
                );
                html = html.replace(
                    /[alamat]/g,
                    selectedKaryawan.alamat_domisili || "-",
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

            // Teks tambahan dinamis
            html = html.replace(
                /[keterangan]/g,
                data.keterangan_tambahan ||
                    "<span class='bg-yellow-200'>[Keterangan Tambahan]</span>",
            );

            // Tanggal Hari Ini
            const today = new Date().toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            html = html.replace(/\[tanggal_hari_ini\]/g, today);

            setPreviewHtml(html);
        } else {
            setPreviewHtml(
                "<p class='text-gray-400 text-center mt-10'>Pilih template surat terlebih dahulu untuk melihat preview.</p>",
            );
        }
    }, [selectedTemplate, selectedKaryawan, data.keterangan_tambahan]);

    // Handle Perubahan Template
    const handleTemplateChange = (e) => {
        const id = e.target.value;
        setData("template_id", id);
        const template = templates.find((t) => t.id == id);
        setSelectedTemplate(template || null);

        // Reset approver jika kategori alurnya hanya notifikasi (tidak butuh TTD)
        if (template && template.kategori_alur === "Hanya_Notifikasi") {
            setData("approver_id", "");
        }
    };

    // Handle Perubahan Karyawan
    const handleKaryawanChange = (e) => {
        const id = e.target.value;
        setData("karyawan_id", id);
        setSelectedKaryawan(karyawans.find((k) => k.id == id) || null);
    };

    // Handle Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("keluar.store")); // Pastikan route store di Controller sudah siap
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
                        {/* ---------------- BAGIAN KIRI: FORM EDITOR ---------------- */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            <div className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-indigo-500">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                    Panel Konfigurasi Surat
                                </h3>

                                {/* Pilihan Template */}
                                <div className="mb-4">
                                    <InputLabel value="1. Pilih Template / Jenis Surat" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        value={data.template_id}
                                        onChange={handleTemplateChange}
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

                                {/* Info Alur Otomatis */}
                                {selectedTemplate && (
                                    <div
                                        className={`p-3 rounded text-sm mb-4 border ${selectedTemplate.kategori_alur === "Approval_Direksi" ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-green-50 border-green-200 text-green-800"}`}
                                    >
                                        <strong>Jalur Surat:</strong>{" "}
                                        {selectedTemplate.kategori_alur ===
                                        "Approval_Direksi"
                                            ? "📝 Membutuhkan Persetujuan (TTD Pimpinan)"
                                            : "📢 Langsung Terbit (Notifikasi Tembusan)"}
                                    </div>
                                )}

                                {/* Pilihan Karyawan Tujuan */}
                                <div className="mb-4">
                                    <InputLabel value="2. Surat Ditujukan Kepada (Karyawan)" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        value={data.karyawan_id}
                                        onChange={handleKaryawanChange}
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

                                {/* Input Teks Tambahan (Dinamis) */}
                                <div className="mb-4">
                                    <InputLabel value="3. Keterangan Tambahan / Isi Spesifik" />
                                    <textarea
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        rows="4"
                                        placeholder="Ketik detail keperluan surat di sini..."
                                        value={data.keterangan_tambahan}
                                        onChange={(e) =>
                                            setData(
                                                "keterangan_tambahan",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                {/* Pemilihan Approver (Hanya Muncul Jika Template Butuh Approval) */}
                                {selectedTemplate &&
                                    selectedTemplate.kategori_alur ===
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
                                                    -- Pilih Direktur / Pimpinan
                                                    --
                                                </option>
                                                {approvers.map((a) => (
                                                    <option
                                                        key={a.id}
                                                        value={a.id}
                                                    >
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

                                {/* Tombol Aksi */}
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
                                            ? "Menyimpan..."
                                            : selectedTemplate?.kategori_alur ===
                                                "Approval_Direksi"
                                              ? "Ajukan Draft Surat"
                                              : "Terbitkan Surat"}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>

                        {/* ---------------- BAGIAN KANAN: LIVE PREVIEW KERTAS ---------------- */}
                        <div className="lg:col-span-7">
                            <div className="sticky top-6">
                                <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase flex items-center justify-between">
                                    <span>👁️ Live Preview Kertas A4</span>
                                    <span className="text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
                                        Auto-Update Active
                                    </span>
                                </h3>

                                {/* Kertas A4 Container */}
                                <div
                                    className="bg-white shadow-2xl rounded-sm overflow-auto max-h-[85vh] border border-gray-300 flex flex-col justify-between"
                                    style={{
                                        aspectRatio: "1 / 1.414",
                                        minHeight: "800px",
                                        width: "100%",
                                        padding: "40px 50px",
                                    }}
                                >
                                    {/* Area Konten Surat Tengah */}
                                    <div
                                        className="prose prose-sm max-w-none text-gray-800 flex-grow"
                                        dangerouslySetInnerHTML={{
                                            __html: previewHtml,
                                        }}
                                    />

                                    {/* Area Bawah Surat (Penutup & Tempat Tanda Tangan) */}
                                    {selectedTemplate && (
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

                                                {/* Simulasi Kotak QR Code / TTD */}
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
