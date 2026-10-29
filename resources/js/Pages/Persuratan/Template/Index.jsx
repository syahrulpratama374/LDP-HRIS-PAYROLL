import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Index({ auth, templates, jabatans }) {
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        nama_template: "",
        kode_surat: "",
        pembuat_kode: "",
        konten: "",
        rute_approvals: [],
    });

    // Modul Custom Toolbar ReactQuill agar fitur editor terasa lengkap mirip Microsoft Word
    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            ["clean"],
        ],
    };

    // Helper Sisip Variabel ke Editor
    const insertVariable = (varTag) => {
        setData("konten", (data.konten || "") + ` ${varTag} `);
    };

    // Handler Rute Approval Dinamis
    const handleAddRute = () => {
        const nextUrutan = data.rute_approvals.length + 1;
        setData("rute_approvals", [
            ...data.rute_approvals,
            { urutan: nextUrutan, jabatan_id: "", label_ttd: "" },
        ]);
    };

    const handleRemoveRute = (index) => {
        const updated = data.rute_approvals.filter((_, i) => i !== index);
        const reIndexed = updated.map((item, idx) => ({
            ...item,
            urutan: idx + 1,
        }));
        setData("rute_approvals", reIndexed);
    };

    const handleRuteChange = (index, field, value) => {
        const updated = [...data.rute_approvals];
        updated[index][field] = value;
        setData("rute_approvals", updated);
    };

    // Live Parser Variabel Dinamis untuk Preview Kertas A4
    const renderLivePreview = (htmlContent) => {
        if (!htmlContent) {
            return "<p class='text-gray-300 italic text-center py-12'>Isi template surat akan dirender secara otomatis di sini...</p>";
        }
        let rendered = htmlContent;
        rendered = rendered.replaceAll(
            "[nama_karyawan]",
            "<strong>Ahmad Syahrul Pratama</strong>",
        );
        rendered = rendered.replaceAll("[nik]", "LDP-2026-0042");
        rendered = rendered.replaceAll("[jabatan]", "Senior Web Developer");
        rendered = rendered.replaceAll(
            "[alamat]",
            "Jl. Sakti No. 12, Yogyakarta",
        );
        rendered = rendered.replaceAll(
            "[tanggal_hari_ini]",
            new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
        );
        return rendered;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("template.store"), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Master Template & Rute Persetujuan
                </h2>
            }
        >
            <Head title="Master Template Surat" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900">
                            Daftar Template Surat Resmi
                        </h3>
                        <PrimaryButton onClick={() => setShowModal(true)}>
                            + Buat Template Baru
                        </PrimaryButton>
                    </div>

                    {/* TABEL DAFTAR TEMPLATE */}
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden border">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Nama Template
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Kode Surat
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Pembuat
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Alur TTD (Hierarchy)
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {templates.map((t) => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {t.nama_template}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-indigo-600">
                                            {t.kode_surat}
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.pembuat_kode}
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.rute_approvals &&
                                            t.rute_approvals.length > 0 ? (
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {t.rute_approvals.map(
                                                        (r, idx) => (
                                                            <span
                                                                key={r.id}
                                                                className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200"
                                                            >
                                                                {idx + 1}.{" "}
                                                                {r.label_ttd} (
                                                                {
                                                                    r.jabatan
                                                                        ?.nama_jabatan
                                                                }
                                                                )
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">
                                                    Tanpa Approval (Langsung
                                                    Terbit)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded font-bold ${
                                                    t.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {t.is_active
                                                    ? "Aktif"
                                                    : "Non-Aktif"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MODAL EDIT & LIVE PREVIEW SPLIT VIEW 2 KOLOM */}
                    <Modal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        maxWidth="7xl"
                    >
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="flex justify-between items-center border-b pb-3 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Perancangan Master Template & Live
                                        Preview
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Kelola struktur teks di sebelah kiri dan
                                        lihat hasil simulasi cetak A4 di sebelah
                                        kanan.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* CONTAINER SPLIT VIEW (2 KOLOM) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* ========================================================= */}
                                {/* KOLOM KIRI: FORM & PENGATURAN (Span 6)                    */}
                                {/* ========================================================= */}
                                <div className="lg:col-span-6 space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <InputLabel value="Nama Template" />
                                            <TextInput
                                                className="mt-1 block w-full text-xs"
                                                value={data.nama_template}
                                                onChange={(e) =>
                                                    setData(
                                                        "nama_template",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Misal: SPJ Perjalanan Dinas"
                                                required
                                            />
                                            <InputError
                                                message={errors.nama_template}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Kode Surat" />
                                            <TextInput
                                                className="mt-1 block w-full text-xs font-mono"
                                                value={data.kode_surat}
                                                onChange={(e) =>
                                                    setData(
                                                        "kode_surat",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Misal: SPJ-PD"
                                                required
                                            />
                                            <InputError
                                                message={errors.kode_surat}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Kode Pembuat" />
                                            <TextInput
                                                className="mt-1 block w-full text-xs font-mono"
                                                value={data.pembuat_kode}
                                                onChange={(e) =>
                                                    setData(
                                                        "pembuat_kode",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Misal: LDP-HC"
                                                required
                                            />
                                            <InputError
                                                message={errors.pembuat_kode}
                                            />
                                        </div>
                                    </div>

                                    {/* PINTASAN VARIABEL */}
                                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                        <InputLabel value="Variabel Dinamis (Klik untuk menyisipkan):" />
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {[
                                                "[nama_karyawan]",
                                                "[nik]",
                                                "[jabatan]",
                                                "[alamat]",
                                                "[tanggal_hari_ini]",
                                            ].map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() =>
                                                        insertVariable(v)
                                                    }
                                                    className="bg-white hover:bg-indigo-100 text-indigo-700 text-[11px] font-mono px-2 py-1 rounded border border-indigo-200 shadow-sm transition"
                                                >
                                                    + {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* EDITOR WORD-LIKE REACT QUILL */}
                                    <div>
                                        <InputLabel value="Isi Konten Template (Rich Text Editor)" />
                                        <div className="mt-1 bg-white rounded border">
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                value={data.konten}
                                                onChange={(val) =>
                                                    setData("konten", val)
                                                }
                                                style={{
                                                    height: "220px",
                                                    marginBottom: "42px",
                                                }}
                                            />
                                        </div>
                                        <InputError message={errors.konten} />
                                    </div>

                                    {/* PENGATURAN RUTE APPROVAL DINAMIS */}
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">
                                                    Rute Persetujuan
                                                    (Multi-Level Approval)
                                                </h4>
                                                <p className="text-[11px] text-gray-500">
                                                    Atur urutan penandatangan
                                                    dari awal hingga akhir.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddRute}
                                                className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold px-3 py-1 rounded hover:bg-indigo-100"
                                            >
                                                + Tambah TTD
                                            </button>
                                        </div>

                                        {data.rute_approvals.map(
                                            (rute, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 bg-gray-50 p-2.5 rounded mb-2 border text-xs"
                                                >
                                                    <span className="font-bold text-gray-500 w-12 text-center">
                                                        Step {rute.urutan}
                                                    </span>

                                                    <div className="w-1/3">
                                                        <TextInput
                                                            className="w-full text-xs"
                                                            placeholder="Label (ex: Diajukan Oleh)"
                                                            value={
                                                                rute.label_ttd
                                                            }
                                                            onChange={(e) =>
                                                                handleRuteChange(
                                                                    index,
                                                                    "label_ttd",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </div>

                                                    <div className="w-1/2">
                                                        <select
                                                            className="w-full text-xs border-gray-300 rounded shadow-sm focus:border-indigo-500"
                                                            value={
                                                                rute.jabatan_id
                                                            }
                                                            onChange={(e) =>
                                                                handleRuteChange(
                                                                    index,
                                                                    "jabatan_id",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                        >
                                                            <option value="">
                                                                -- Pilih Jabatan
                                                                --
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
                                                                        [
                                                                        {
                                                                            j.kode_jabatan
                                                                        }
                                                                        ]{" "}
                                                                        {
                                                                            j.nama_jabatan
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveRute(
                                                                index,
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 font-bold px-2"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* ========================================================= */}
                                {/* KOLOM KANAN: LIVE PREVIEW KERTAS A4 (Span 6)             */}
                                {/* ========================================================= */}
                                <div className="lg:col-span-6 bg-gray-200 p-4 rounded-xl shadow-inner flex justify-center max-h-[75vh] overflow-y-auto">
                                    {/* SIMULASI LEMBAR KERTAS A4 */}
                                    <div className="bg-white w-full max-w-[190mm] min-h-[265mm] p-6 shadow-2xl rounded text-black text-[11px] font-sans flex flex-col justify-between border border-gray-300">
                                        <div>
                                            {/* HEADER KOP SURAT PERUSAHAAN */}
                                            <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                                                <div className="w-12 h-12 bg-indigo-600 rounded flex items-center justify-center text-white font-black text-lg">
                                                    LDP
                                                </div>
                                                <div className="text-center flex-1 px-2">
                                                    <h2 className="font-bold text-sm tracking-wide text-gray-900 uppercase">
                                                        PT. LINTAS DATA PRIMA
                                                    </h2>
                                                    <p className="text-[10px] text-gray-600 font-medium">
                                                        Telecommunication & IT
                                                        Managed Services
                                                    </p>
                                                    <p className="text-[9px] text-gray-500">
                                                        Jl. Sakti No. 12,
                                                        Yogyakarta | Telp:
                                                        (0274) 415632 |
                                                        www.ldp.net.id
                                                    </p>
                                                </div>
                                                <div className="w-12 text-[8px] text-gray-400 font-mono text-right">
                                                    ISO 9001
                                                </div>
                                            </div>

                                            {/* JUDUL & NOMOR SURAT SIMULASI */}
                                            <div className="text-center my-3">
                                                <h3 className="font-bold text-xs uppercase underline tracking-wider">
                                                    {data.nama_template ||
                                                        "NAMA SURAT TEMPLATE"}
                                                </h3>
                                                <p className="font-mono text-[10px] text-gray-600">
                                                    Nomor: 001/
                                                    {data.kode_surat || "KODE"}/
                                                    {data.pembuat_kode ||
                                                        "DEPT"}
                                                    /X/2026
                                                </p>
                                            </div>

                                            {/* RENDER BODY TEKS SIMULASI */}
                                            <div
                                                className="prose prose-sm max-w-none text-justify my-4 leading-relaxed text-gray-800"
                                                dangerouslySetInnerHTML={{
                                                    __html: renderLivePreview(
                                                        data.konten,
                                                    ),
                                                }}
                                            />
                                        </div>

                                        {/* MATRIKS TANDA TANGAN DINAMIS (FOOTER PREVIEW) */}
                                        <div className="mt-8 border-t border-dashed pt-4">
                                            <p className="text-[9px] text-gray-400 italic mb-2 text-center">
                                                [ Preview Matriks Tanda Tangan
                                                Digital ]
                                            </p>
                                            {data.rute_approvals.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center">
                                                    {data.rute_approvals.map(
                                                        (rute, idx) => {
                                                            const targetJabatan =
                                                                jabatans.find(
                                                                    (j) =>
                                                                        j.id ==
                                                                        rute.jabatan_id,
                                                                );
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="border border-gray-200 p-2 rounded bg-gray-50/50 flex flex-col justify-between"
                                                                >
                                                                    <p className="font-semibold text-gray-600 text-[10px]">
                                                                        {rute.label_ttd ||
                                                                            `Step ${rute.urutan}`}
                                                                    </p>
                                                                    <div className="h-12 my-1 flex items-center justify-center border border-dashed border-indigo-200 rounded bg-indigo-50/30 text-[9px] text-indigo-400 font-mono">
                                                                        [ QR /
                                                                        TTD
                                                                        Digital
                                                                        ]
                                                                    </div>
                                                                    <p className="font-bold text-gray-800 underline text-[10px]">
                                                                        {targetJabatan?.nama_jabatan ||
                                                                            "(Jabatan)"}
                                                                    </p>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-400 italic text-[10px] py-2 border border-dashed rounded">
                                                    Surat ini disetujui langsung
                                                    tanpa rute approval
                                                    bertingkat.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER ACTION MODAL */}
                            <div className="flex justify-end gap-3 border-t pt-4 mt-4">
                                <SecondaryButton
                                    onClick={() => setShowModal(false)}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton disabled={processing}>
                                    Simpan Master Template
                                </PrimaryButton>
                            </div>
                        </form>
                    </Modal>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
