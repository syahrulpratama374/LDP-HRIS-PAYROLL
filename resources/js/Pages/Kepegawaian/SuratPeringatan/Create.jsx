import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create({ karyawans }) {
    const { data, setData, post, processing, errors } = useForm({
        karyawan_id: "",
        jenis_sp: "SP 1",
        tgl_mulai: "",
        tgl_selesai: "",
        keterangan: "",
        file_surat: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.sp.store"), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Terbitkan Surat Peringatan (SP)
                </h2>
            }
        >
            <Head title="Terbitkan SP" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Karyawan yang Melanggar
                                </label>
                                <select
                                    value={data.karyawan_id}
                                    onChange={(e) =>
                                        setData("karyawan_id", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">
                                        -- Pilih Karyawan --
                                    </option>
                                    {karyawans.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nik_internal} - {k.nama_lengkap}
                                        </option>
                                    ))}
                                </select>
                                {errors.karyawan_id && (
                                    <span className="text-red-500 text-xs">
                                        {errors.karyawan_id}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tingkat Peringatan
                                    </label>
                                    <select
                                        value={data.jenis_sp}
                                        onChange={(e) =>
                                            setData("jenis_sp", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="SP 1">
                                            Surat Peringatan 1 (SP 1)
                                        </option>
                                        <option value="SP 2">
                                            Surat Peringatan 2 (SP 2)
                                        </option>
                                        <option value="SP 3">
                                            Surat Peringatan 3 (SP 3)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Mulai Berlaku
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tgl_mulai}
                                        onChange={(e) =>
                                            setData("tgl_mulai", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Berakhir Berlaku
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tgl_selesai}
                                        onChange={(e) =>
                                            setData(
                                                "tgl_selesai",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors.tgl_selesai && (
                                        <span className="text-red-500 text-xs">
                                            {errors.tgl_selesai}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Keterangan / Alasan Pelanggaran
                                </label>
                                <textarea
                                    rows="4"
                                    value={data.keterangan}
                                    onChange={(e) =>
                                        setData("keterangan", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Jelaskan secara detail bentuk pelanggaran yang dilakukan..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Unggah Dokumen SP (Opsional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Unggah hasil scan PDF atau foto SP fisik
                                    yang sudah ditandatangani.
                                </p>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setData("file_surat", e.target.files[0])
                                    }
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {errors.file_surat && (
                                    <span className="text-red-500 text-xs">
                                        {errors.file_surat}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Link
                                    href={route("admin.sp.index")}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded transition"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded shadow transition disabled:opacity-50"
                                >
                                    Terbitkan SP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
