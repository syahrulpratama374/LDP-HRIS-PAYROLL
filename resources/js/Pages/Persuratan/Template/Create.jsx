import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Wajib untuk styling toolbar Word

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        kode_surat: "",
        nama_template: "",
        kategori_alur: "Approval_Direksi",
        pembuat_kode: "LDP-HC",
        konten: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("template.store"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Tambah Master Template Baru
                </h2>
            }
        >
            <Head title="Tambah Template" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white p-6 shadow sm:rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kiri: Info Dasar */}
                            <div className="space-y-4">
                                <div>
                                    <InputLabel value="Nama Template (Jenis Surat)" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.nama_template}
                                        onChange={(e) =>
                                            setData(
                                                "nama_template",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Surat Keputusan"
                                        required
                                    />
                                    <InputError
                                        message={errors.nama_template}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Singkatan / Kode Surat" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.kode_surat}
                                        onChange={(e) =>
                                            setData(
                                                "kode_surat",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: SKEP"
                                        required
                                    />
                                    <InputError
                                        message={errors.kode_surat}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            {/* Kanan: Pengaturan Alur */}
                            <div className="space-y-4">
                                <div>
                                    <InputLabel value="Jalur Surat (Approval)" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        value={data.kategori_alur}
                                        onChange={(e) =>
                                            setData(
                                                "kategori_alur",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="Approval_Direksi">
                                            Membutuhkan Persetujuan (TTD)
                                        </option>
                                        <option value="Hanya_Notifikasi">
                                            Langsung Terbit (Hanya Tembusan)
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value="Departemen yang Mengeluarkan" />
                                    <select
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        value={data.pembuat_kode}
                                        onChange={(e) =>
                                            setData(
                                                "pembuat_kode",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="LDP-HC">
                                            LDP-HC (Human Capital)
                                        </option>
                                        <option value="LDP-DIR">
                                            LDP-DIR (Direksi)
                                        </option>
                                        <option value="LDP-CORP">
                                            LDP-CORP (Corporate)
                                        </option>
                                        <option value="LDP-IPR">
                                            LDP-IPR (Iprime)
                                        </option>
                                        <option value="LDP-FIN">
                                            LDP-FIN (Finance)
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <hr className="my-6" />

                        {/* Bawah: Editor React Quill */}
                        <div>
                            <InputLabel
                                value="Desain Isi Format Surat (Teks Utama)"
                                className="text-lg font-bold text-indigo-600 mb-2"
                            />

                            <div className="bg-blue-50 text-sm text-blue-800 p-3 rounded mb-4 border border-blue-200">
                                <strong>💡 Panduan Variabel:</strong> Ketik
                                variabel ini di dalam teks agar sistem
                                merubahnya otomatis sesuai data karyawan:
                                <br />
                                <code>[nama_karyawan]</code>, <code>[nik]</code>
                                , <code>[jabatan]</code>, <code>[alamat]</code>,{" "}
                                <code>[tanggal_hari_ini]</code>,{" "}
                                <code>[keterangan]</code>.
                            </div>

                            <div className="bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={data.konten}
                                    onChange={(content) =>
                                        setData("konten", content)
                                    }
                                    style={{
                                        height: "350px",
                                        marginBottom: "50px",
                                    }}
                                />
                            </div>
                            <InputError
                                message={errors.konten}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4 mt-8 pt-4 border-t">
                            <Link href={route("template.index")}>
                                <SecondaryButton>Batal</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>
                                Simpan Template
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
