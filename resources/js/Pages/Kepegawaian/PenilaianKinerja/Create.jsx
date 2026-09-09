import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

export default function Create({ karyawans }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role_id === 1 || auth.user.role_id === 3;

    const { data, setData, post, processing, errors } = useForm({
        karyawan_id: "",
        penilai_id: auth.user.karyawan?.id || "",
        periode_bulan: new Date().getMonth() + 1,
        periode_tahun: new Date().getFullYear(),
        skor_kpi: 75,
        catatan_evaluasi: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.kinerja.store"));
    };

    const getPredikatText = (skor) => {
        if (skor >= 90) return "Sangat Baik (Promosi / Bonus Besar)";
        if (skor >= 75) return "Baik (Sesuai Ekspektasi)";
        if (skor >= 60) return "Cukup (Perlu Peningkatan)";
        return "Kurang (Beresiko SP)";
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Input Evaluasi Kinerja (KPI)</h2>}>
            <Head title="Input KPI" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    {errors.error && (
                        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-medium">
                            ⚠️ {errors.error}
                        </div>
                    )}
                    
                    <div className="bg-white shadow-sm sm:rounded-lg p-8 border-t-4 border-indigo-600">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Karyawan yang Dinilai</label>
                                    <select
                                        value={data.karyawan_id}
                                        onChange={(e) => setData("karyawan_id", e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">-- Pilih Staf Tim Anda --</option>
                                        {karyawans.map((k) => (
                                            <option key={k.id} value={k.id}>{k.nik_internal} - {k.nama_lengkap}</option>
                                        ))}
                                    </select>
                                    {errors.karyawan_id && <span className="text-red-500 text-xs">{errors.karyawan_id}</span>}
                                </div>

                                {/* Form Pilih Penilai HANYA muncul untuk Admin/HC. SPV disembunyikan agar aman */}
                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Atasan Penilai</label>
                                        <select
                                            value={data.penilai_id}
                                            onChange={(e) => setData("penilai_id", e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">-- Pilih Atasan --</option>
                                            {karyawans.map((k) => (
                                                <option key={k.id} value={k.id}>{k.nama_lengkap}</option>
                                            ))}
                                        </select>
                                        {errors.penilai_id && <span className="text-red-500 text-xs">{errors.penilai_id}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Periode Bulan</label>
                                    <select
                                        value={data.periode_bulan}
                                        onChange={(e) => setData("periode_bulan", e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tahun</label>
                                    <input
                                        type="number"
                                        value={data.periode_tahun}
                                        onChange={(e) => setData("periode_tahun", e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <label className="block text-sm font-bold text-gray-800 flex justify-between mb-4">
                                    <span>Skor Kinerja (KPI)</span>
                                    <span className="text-2xl text-indigo-700">{data.skor_kpi} / 100</span>
                                </label>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={data.skor_kpi}
                                    onChange={(e) => setData("skor_kpi", e.target.value)}
                                    className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="text-center mt-3 font-semibold text-sm text-gray-600">
                                    Indikator: <span className={data.skor_kpi >= 75 ? "text-green-600" : "text-red-600"}>{getPredikatText(data.skor_kpi)}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Catatan Evaluasi / *Feedback*</label>
                                <textarea
                                    rows="4"
                                    value={data.catatan_evaluasi}
                                    onChange={(e) => setData("catatan_evaluasi", e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Berikan alasan dan evaluasi atas kinerja bulan ini..."
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Link href={route("admin.kinerja.index")} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded transition">Batal</Link>
                                <button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow transition disabled:opacity-50">
                                    Simpan Nilai KPI
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}