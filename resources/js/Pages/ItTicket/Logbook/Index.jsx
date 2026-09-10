import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";

export default function Index({ logbooks, shifts }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        shift_id: "",
        catatan_handover: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.logbook.store"), {
            onSuccess: () => reset("catatan_handover"),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Shift Handover Logbook (Tim NOC)
                </h2>
            }
        >
            <Head title="Logbook Shift" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KOLOM KIRI: FORM INPUT LOGBOOK */}
                <div className="md:col-span-1">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                            📝 Tulis Catatan Handover
                        </h3>

                        {flash?.success && (
                            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm font-bold">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel value="Anda Sedang Shift Apa?" />
                                <select
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                    value={data.shift_id}
                                    onChange={(e) =>
                                        setData("shift_id", e.target.value)
                                    }
                                >
                                    <option value="">-- Pilih Shift --</option>
                                    {shifts.map((shift) => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.nama_shift} (
                                            {shift.jam_masuk.slice(0, 5)} -{" "}
                                            {shift.jam_keluar.slice(0, 5)})
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.shift_id}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <InputLabel value="Ringkasan Kendala / Oper Tugas" />
                                <textarea
                                    rows="5"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                    placeholder="Contoh: Koneksi internet cabang A sempat RTO jam 14:00, sudah di-restart router-nya. Tolong shift malam pantau traffic-nya..."
                                    value={data.catatan_handover}
                                    onChange={(e) =>
                                        setData(
                                            "catatan_handover",
                                            e.target.value,
                                        )
                                    }
                                ></textarea>
                                <InputError
                                    message={errors.catatan_handover}
                                    className="mt-1"
                                />
                            </div>

                            <PrimaryButton
                                disabled={processing}
                                className="w-full justify-center !bg-gray-800 hover:!bg-black"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Posting Logbook"}
                            </PrimaryButton>
                        </form>
                    </div>
                </div>

                {/* KOLOM KANAN: TIMELINE LOGBOOK */}
                <div className="md:col-span-2">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6">
                            🕒 Timeline Operasional (Latest)
                        </h3>

                        <div className="space-y-6">
                            {logbooks.data.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    Belum ada catatan logbook yang ditambahkan.
                                </p>
                            ) : (
                                logbooks.data.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:shadow transition"
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                                {log.karyawan?.nama_lengkap?.charAt(
                                                    0,
                                                ) || "IT"}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">
                                                        {log.karyawan
                                                            ?.nama_lengkap ||
                                                            "System / Karyawan Dihapus"}
                                                    </h4>
                                                    <p className="text-xs text-indigo-600 font-semibold mb-1">
                                                        Shift:{" "}
                                                        {log.shift?.nama_shift}{" "}
                                                        •{" "}
                                                        {new Date(
                                                            log.created_at,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-400 font-mono bg-white px-2 py-1 rounded border">
                                                    {new Date(
                                                        log.created_at,
                                                    ).toLocaleTimeString(
                                                        "id-ID",
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-indigo-400 whitespace-pre-line">
                                                {log.catatan_handover}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
