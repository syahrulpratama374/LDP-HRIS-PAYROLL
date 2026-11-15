import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import formatRupiah from "@/Utils/formatRupiah";

export default function Karyawan({ penugasans, karyawans, komponens }) {
    const { flash, errors: pageErrors } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        karyawan_id: "",
        komponen_id: "",
        nominal: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.komponen.karyawan.store"), {
            onSuccess: () => reset("nominal"),
        });
    };

    const lepas = (id) => {
        if (confirm("Lepas komponen ini dari karyawan?")) {
            router.delete(route("admin.komponen.karyawan.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Komponen Gaji per Karyawan
                </h2>
            }
        >
            <Head title="Komponen Gaji per Karyawan" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg space-y-4">
                        <Link
                            href={route("admin.komponen.index")}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            ← Master Komponen
                        </Link>
                        {flash?.success && (
                            <div className="text-green-600 font-bold text-sm bg-green-50 p-2 rounded">
                                {flash.success}
                            </div>
                        )}
                        {pageErrors?.error && (
                            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                                {pageErrors.error}
                            </div>
                        )}
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel value="Karyawan" />
                                <select
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
                                    value={data.karyawan_id}
                                    onChange={(e) => setData("karyawan_id", e.target.value)}
                                >
                                    <option value="">-- Pilih --</option>
                                    {karyawans.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama_lengkap} ({k.nik_internal})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.karyawan_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Komponen" />
                                <select
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
                                    value={data.komponen_id}
                                    onChange={(e) => setData("komponen_id", e.target.value)}
                                >
                                    <option value="">-- Pilih --</option>
                                    {komponens.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama_komponen} ({k.jenis})
                                        </option>
                                    ))}
                                </select>
                                {komponens.length === 0 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        Belum ada komponen manual. Tunjangan Jabatan, Bonus Kinerja, lembur, SPJ, kasbon, BPJS dan PPh 21 dihitung otomatis saat generate payroll. Tambahkan komponen baru (mis. Tunjangan Makan) di menu Komponen Gaji.
                                    </p>
                                )}
                                <InputError message={errors.komponen_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Nominal per bulan (Rp)" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    className="w-full mt-1"
                                    value={data.nominal}
                                    onChange={(e) => setData("nominal", e.target.value)}
                                />
                                <InputError message={errors.nominal} className="mt-1" />
                            </div>
                            <PrimaryButton disabled={processing} className="w-full justify-center">
                                Simpan
                            </PrimaryButton>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 border">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-3">Karyawan</th>
                                    <th className="px-4 py-3">Komponen</th>
                                    <th className="px-4 py-3 text-right">Nominal</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {penugasans.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center">
                                            Belum ada komponen tetap yang ditugaskan.
                                        </td>
                                    </tr>
                                ) : (
                                    penugasans.map((p) => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {p.karyawan?.nama_lengkap}
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.komponen?.nama_komponen}{" "}
                                                <span className="text-xs text-gray-400">({p.komponen?.jenis})</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatRupiah(p.nominal)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <DangerButton onClick={() => lepas(p.id)} className="!py-1 !px-2">
                                                    Lepas
                                                </DangerButton>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
