import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create({ departemens }) {
    const { data, setData, post, processing, errors } = useForm({
        judul: "",
        konten: "",
        target_audiens: "Global",
        tgl_mulai: "",
        tgl_selesai: "",
        tipe_banner: "Info",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("pengumuman.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Buat Pengumuman Baru
                </h2>
            }
        >
            <Head title="Broadcast Pengumuman" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8">
                        <form onSubmit={submit} className="space-y-6">
                            {/* Baris 1: Judul & Tipe Banner */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Judul Pengumuman
                                    </label>
                                    <input
                                        type="text"
                                        value={data.judul}
                                        onChange={(e) =>
                                            setData("judul", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Contoh: Libur Nasional / Maintenance Server"
                                        required
                                    />
                                    {errors.judul && (
                                        <span className="text-red-500 text-xs">
                                            {errors.judul}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tipe Banner (Warna Notifikasi)
                                    </label>
                                    <select
                                        value={data.tipe_banner}
                                        onChange={(e) =>
                                            setData(
                                                "tipe_banner",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold"
                                    >
                                        <option
                                            value="Info"
                                            className="text-blue-600"
                                        >
                                            Info (Biru - Standar)
                                        </option>
                                        <option
                                            value="Peringatan"
                                            className="text-orange-600"
                                        >
                                            Peringatan (Oranye - Perhatian)
                                        </option>
                                        <option
                                            value="Sukses"
                                            className="text-green-600"
                                        >
                                            Sukses (Hijau - Pencapaian/Bonus)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Baris 2: Konten */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Isi Pengumuman
                                </label>
                                <textarea
                                    rows="5"
                                    value={data.konten}
                                    onChange={(e) =>
                                        setData("konten", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Tuliskan isi pesan secara lengkap di sini..."
                                    required
                                ></textarea>
                                {errors.konten && (
                                    <span className="text-red-500 text-xs">
                                        {errors.konten}
                                    </span>
                                )}
                            </div>

                            {/* Baris 3: Target Audiens */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    Target Siaran (Audiens)
                                </label>
                                <select
                                    value={data.target_audiens}
                                    onChange={(e) =>
                                        setData(
                                            "target_audiens",
                                            e.target.value,
                                        )
                                    }
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="Global">
                                        🌎 Global (Semua Karyawan PT LDP)
                                    </option>
                                    {departemens &&
                                        departemens.map((dept) => (
                                            <option
                                                key={dept.id}
                                                value={dept.id}
                                            >
                                                🏢 Hanya Departemen:{" "}
                                                {dept.nama_departemen}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Baris 4: Masa Tayang */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Mulai Tayang
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
                                    {errors.tgl_mulai && (
                                        <span className="text-red-500 text-xs">
                                            {errors.tgl_mulai}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Selesai Tayang
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

                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <Link
                                    href={route("pengumuman.index")}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    🚀 Siarkan Pengumuman
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
    