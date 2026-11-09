import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Index({ auth, pengaturan }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing } = useForm({
        koordinat_kantor: pengaturan.koordinat_kantor || "",
        radius_absensi: pengaturan.radius_absensi || "",
        jam_masuk_operasional: pengaturan.jam_masuk_operasional || "",
        toleransi_keterlambatan: pengaturan.toleransi_keterlambatan || "",
        batas_approval_finance: pengaturan.batas_approval_finance || "",
        default_cuti_tahunan: pengaturan.default_cuti_tahunan || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.pengaturan.store"), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Pengaturan Parameter Sistem
                </h2>
            }
        >
            <Head title="Pengaturan Sistem" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                            {flash.success}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white p-6 shadow sm:rounded-lg border-t-4 border-indigo-600 space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* BLOK ABSENSI & LOKASI */}
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                                <h3 className="font-bold text-gray-700 border-b pb-2">
                                    Konfigurasi Absensi & Lokasi
                                </h3>
                                <div>
                                    <InputLabel value="Koordinat Kantor (Lat, Long)" />
                                    <TextInput
                                        type="text"
                                        className="mt-1 block w-full text-sm"
                                        value={data.koordinat_kantor}
                                        onChange={(e) =>
                                            setData(
                                                "koordinat_kantor",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Contoh: -7.795580, 110.369490
                                    </p>
                                </div>
                                <div>
                                    <InputLabel value="Radius Absensi (Meter)" />
                                    <TextInput
                                        type="number"
                                        className="mt-1 block w-full text-sm"
                                        value={data.radius_absensi}
                                        onChange={(e) =>
                                            setData(
                                                "radius_absensi",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Jam Masuk Standar (Reguler)" />
                                    <TextInput
                                        type="time"
                                        className="mt-1 block w-full text-sm"
                                        value={data.jam_masuk_operasional}
                                        onChange={(e) =>
                                            setData(
                                                "jam_masuk_operasional",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Toleransi Terlambat (Menit)" />
                                    <TextInput
                                        type="number"
                                        className="mt-1 block w-full text-sm"
                                        value={data.toleransi_keterlambatan}
                                        onChange={(e) =>
                                            setData(
                                                "toleransi_keterlambatan",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* BLOK FINANCE & HR */}
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                                <h3 className="font-bold text-gray-700 border-b pb-2">
                                    Konfigurasi Finance & HR
                                </h3>
                                <div>
                                    <InputLabel value="Batas Maksimal Kasbon / SPJ (Rp)" />
                                    <TextInput
                                        type="number"
                                        className="mt-1 block w-full text-sm"
                                        value={data.batas_approval_finance}
                                        onChange={(e) =>
                                            setData(
                                                "batas_approval_finance",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Jatah Cuti Tahunan Default (Hari)" />
                                    <TextInput
                                        type="number"
                                        className="mt-1 block w-full text-sm"
                                        value={data.default_cuti_tahunan}
                                        onChange={(e) =>
                                            setData(
                                                "default_cuti_tahunan",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <PrimaryButton
                                disabled={processing}
                                className="!bg-indigo-600 hover:!bg-indigo-700"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Pengaturan"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
