import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

export default function CreateCuti({ auth, saldoCuti }) {
    const { data, setData, post, processing, errors } = useForm({
        jenis_cuti: "Tahunan",
        tanggal_mulai: "",
        tanggal_selesai: "",
        alasan: "",
        dokumen_bukti: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("cuti.store"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Pengajuan Cuti & Izin
                </h2>
            }
        >
            <Head title="Ajukan Cuti" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Panel Info Saldo Cuti */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-blue-700 font-semibold">
                                    Informasi Saldo Cuti (Tahun Ini)
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Gunakan hak cuti Anda dengan bijak sesuai
                                    kebijakan perusahaan.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-blue-800">
                                    {saldoCuti
                                        ? saldoCuti.hak_cuti_tahunan -
                                          saldoCuti.cuti_terpakai
                                        : 0}{" "}
                                    Hari
                                </span>
                                <span className="text-xs text-blue-600">
                                    Sisa Cuti Tahunan
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={submit} className="space-y-6">
                                {/* Jenis Cuti */}
                                <div>
                                    <InputLabel
                                        htmlFor="jenis_cuti"
                                        value="Jenis Cuti / Izin"
                                    />
                                    <select
                                        id="jenis_cuti"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.jenis_cuti}
                                        onChange={(e) =>
                                            setData(
                                                "jenis_cuti",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="Tahunan">
                                            Cuti Tahunan
                                        </option>
                                        <option value="Sakit">
                                            Sakit (Wajib Surat Dokter)
                                        </option>
                                        <option value="Menikah">
                                            Izin Menikah (3 Hari)
                                        </option>
                                        <option value="Melahirkan">
                                            Cuti Melahirkan
                                        </option>
                                        <option value="Urusan Keluarga">
                                            Urusan Keluarga Mendesak
                                        </option>
                                    </select>
                                    <InputError
                                        message={errors.jenis_cuti}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Tanggal Mulai & Selesai */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel
                                            htmlFor="tanggal_mulai"
                                            value="Tanggal Mulai"
                                        />
                                        <TextInput
                                            id="tanggal_mulai"
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.tanggal_mulai}
                                            onChange={(e) =>
                                                setData(
                                                    "tanggal_mulai",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.tanggal_mulai}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="tanggal_selesai"
                                            value="Tanggal Selesai"
                                        />
                                        <TextInput
                                            id="tanggal_selesai"
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.tanggal_selesai}
                                            onChange={(e) =>
                                                setData(
                                                    "tanggal_selesai",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.tanggal_selesai}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                {/* Alasan Cuti */}
                                <div>
                                    <InputLabel
                                        htmlFor="alasan"
                                        value="Alasan / Keterangan Lengkap"
                                    />
                                    <textarea
                                        id="alasan"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        rows="3"
                                        value={data.alasan}
                                        onChange={(e) =>
                                            setData("alasan", e.target.value)
                                        }
                                        required
                                    ></textarea>
                                    <InputError
                                        message={errors.alasan}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Dokumen Bukti (Opsional) */}
                                <div>
                                    <InputLabel
                                        htmlFor="dokumen_bukti"
                                        value="Dokumen Bukti (PDF/JPG) - Opsional"
                                    />
                                    <p className="text-xs text-gray-500 mb-2">
                                        Wajib dilampirkan jika memilih cuti
                                        Sakit atau Alasan Mendesak.
                                    </p>
                                    <input
                                        id="dokumen_bukti"
                                        type="file"
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={(e) =>
                                            setData(
                                                "dokumen_bukti",
                                                e.target.files[0],
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.dokumen_bukti}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="flex items-center justify-end mt-4">
                                    <PrimaryButton
                                        className="ml-4"
                                        disabled={processing}
                                    >
                                        {processing
                                            ? "Memproses..."
                                            : "Kirim Pengajuan Cuti"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
