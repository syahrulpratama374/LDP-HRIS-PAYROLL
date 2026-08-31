import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Index({ tickets }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        judul: "",
        modul: "Hardware",
        deskripsi: "",
        prioritas: "Medium",
        file_lampiran: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("ticket.store"), {
            forceFormData: true, // Wajib untuk upload file
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Layanan IT Support
                </h2>
            }
        >
            <Head title="IT Ticket" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* FORM PENGAJUAN TIKET */}
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg border-t-4 border-indigo-500">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Buat Tiket Baru
                        </h3>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Judul Kendala
                                </label>
                                <input
                                    type="text"
                                    value={data.judul}
                                    onChange={(e) =>
                                        setData("judul", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Contoh: Printer Rusak / Lupa Password"
                                    required
                                />
                                {errors.judul && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.judul}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kategori / Modul
                                </label>
                                <select
                                    value={data.modul}
                                    onChange={(e) =>
                                        setData("modul", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                >
                                    <option value="Hardware">
                                        Hardware (Perangkat Keras)
                                    </option>
                                    <option value="Software">
                                        Software (Aplikasi)
                                    </option>
                                    <option value="Jaringan">
                                        Jaringan / Internet
                                    </option>
                                    <option value="Akun">
                                        Akun / Akses Login
                                    </option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Deskripsi Detail
                                </label>
                                <textarea
                                    rows="3"
                                    value={data.deskripsi}
                                    onChange={(e) =>
                                        setData("deskripsi", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Jelaskan kendala secara detail..."
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Prioritas
                                </label>
                                <select
                                    value={data.prioritas}
                                    onChange={(e) =>
                                        setData("prioritas", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                >
                                    <option value="Low">
                                        Low (Bisa ditunda)
                                    </option>
                                    <option value="Medium">
                                        Medium (Mengganggu pekerjaan)
                                    </option>
                                    <option value="High">
                                        High (Pekerjaan terhenti)
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Lampiran Foto/Screenshot (Opsional)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setData(
                                            "file_lampiran",
                                            e.target.files[0],
                                        )
                                    }
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow transition"
                                >
                                    Kirim Tiket
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIWAYAT TIKET */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Riwayat Tiket Saya
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Kendala & Kategori
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Prioritas
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase w-1/3">
                                            Status & Progress
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada pengajuan tiket IT.
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-bold text-gray-800">
                                                        {t.judul}
                                                    </div>
                                                    <div className="text-xs font-semibold text-indigo-600 mt-1">
                                                        {t.modul}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {new Date(
                                                            t.created_at,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-bold rounded ${t.prioritas === "High" ? "bg-red-100 text-red-800" : t.prioritas === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                                                    >
                                                        {t.prioritas}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold">
                                                            {t.status}
                                                        </span>
                                                        <span>
                                                            {
                                                                t.persentase_progress
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className={`h-2.5 rounded-full ${t.persentase_progress === 100 ? "bg-green-500" : "bg-blue-600"}`}
                                                            style={{
                                                                width: `${t.persentase_progress}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
