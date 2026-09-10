import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function Index({ settings }) {
    const { flash, errors: pageErrors } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        titik_koordinat_kantor: settings.titik_koordinat_kantor,
        radius_absensi_meter: settings.radius_absensi_meter,
        jam_masuk_default: settings.jam_masuk_default,
        jam_keluar_default: settings.jam_keluar_default,
        plafon_spj_default: settings.plafon_spj_default,
        hak_cuti_default: settings.hak_cuti_default,
    });

    const submit = (e) => {
        e.preventDefault();
        if (
            confirm(
                "Ubah konfigurasi inti sistem? Perubahan Geofencing akan langsung berdampak pada absensi karyawan saat ini.",
            )
        ) {
            post(route("admin.pengaturan.store"), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Pengaturan Sistem Inti (Admin)
                </h2>
            }
        >
            <Head title="System Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {flash?.success && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-sm">
                            <strong className="font-bold">Sukses!</strong>{" "}
                            {flash.success}
                        </div>
                    )}
                    {pageErrors?.error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                            <strong className="font-bold">Gagal!</strong>{" "}
                            {pageErrors.error}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8 border-t-4 border-gray-800">
                        <form onSubmit={submit} className="space-y-8">
                            {/* BLOK 1: GEOFENCING & GPS */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                                    1. Parameter Geofencing & Absensi GPS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded border">
                                    <div>
                                        <InputLabel value="Titik Koordinat Kantor Pusat (Latitude, Longitude)" />
                                        <TextInput
                                            className="mt-1 block w-full border-blue-300 focus:border-blue-500"
                                            value={data.titik_koordinat_kantor}
                                            onChange={(e) =>
                                                setData(
                                                    "titik_koordinat_kantor",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="-7.8014,110.3644"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Titik pusat gedung LDP Jogja.
                                        </p>
                                    </div>
                                    <div>
                                        <InputLabel value="Batas Toleransi Radius (Meter)" />
                                        <TextInput
                                            type="number"
                                            className="mt-1 block w-full border-blue-300 focus:border-blue-500"
                                            value={data.radius_absensi_meter}
                                            onChange={(e) =>
                                                setData(
                                                    "radius_absensi_meter",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Karyawan tidak bisa Clock-In jika
                                            berada di luar radius ini.
                                        </p>
                                    </div>
                                    <div>
                                        <InputLabel value="Jam Masuk Default" />
                                        <TextInput
                                            type="time"
                                            className="mt-1 block w-full"
                                            value={data.jam_masuk_default}
                                            onChange={(e) =>
                                                setData(
                                                    "jam_masuk_default",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Jam Keluar Default" />
                                        <TextInput
                                            type="time"
                                            className="mt-1 block w-full"
                                            value={data.jam_keluar_default}
                                            onChange={(e) =>
                                                setData(
                                                    "jam_keluar_default",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BLOK 2: OPERASIONAL & KEUANGAN */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                                    2. Ambang Batas Finansial & Operasional
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded border border-gray-200">
                                    <div>
                                        <InputLabel value="Plafon SPJ Default (Rp)" />
                                        <TextInput
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={data.plafon_spj_default}
                                            onChange={(e) =>
                                                setData(
                                                    "plafon_spj_default",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Nilai ini digunakan jika golongan
                                            karyawan tidak memiliki plafon
                                            spesifik.
                                        </p>
                                    </div>
                                    <div>
                                        <InputLabel value="Hak Cuti Default Tahunan (Hari)" />
                                        <TextInput
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={data.hak_cuti_default}
                                            onChange={(e) =>
                                                setData(
                                                    "hak_cuti_default",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <PrimaryButton
                                    disabled={processing}
                                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-8 text-lg rounded-lg shadow-lg transition"
                                >
                                    {processing
                                        ? "Menyimpan..."
                                        : "Simpan Konfigurasi Sistem"}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
