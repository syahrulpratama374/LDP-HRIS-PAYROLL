import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function Create({
    departemens,
    jabatans,
    golongans,
    ptkps = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        nik_internal: "",
        nama_lengkap: "",
        tempat_lahir: "",
        tgl_lahir: "",
        agama: "",
        status_pernikahan: "",
        email_kantor: "",
        no_telp: "",
        tgl_bergabung: "",
        departemen_id: "",
        jabatan_id: "",
        golongan_id: "",
        ptkp_id: "",
        no_ktp: "",
        npwp: "",
        no_rek_bca: "",
        no_bpjs_kesehatan: "",
        no_bpjs_ketenagakerjaan: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("karyawan.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Tambah Data Karyawan
                </h2>
            }
        >
            <Head title="Tambah Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {errors.error && (
                            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                                {errors.error}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-8">
                            {/* SECTION 1: Biodata Dasar */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4">
                                    Biodata Diri
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value="NIK Internal (Otomatis jadi Password Akun)" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.nik_internal}
                                            onChange={(e) =>
                                                setData(
                                                    "nik_internal",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.nik_internal}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Nama Lengkap" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.nama_lengkap}
                                            onChange={(e) =>
                                                setData(
                                                    "nama_lengkap",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.nama_lengkap}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel value="Tempat Lahir" />
                                            <TextInput
                                                className="mt-1 block w-full"
                                                value={data.tempat_lahir}
                                                onChange={(e) =>
                                                    setData(
                                                        "tempat_lahir",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.tempat_lahir}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Tanggal Lahir" />
                                            <TextInput
                                                type="date"
                                                className="mt-1 block w-full"
                                                value={data.tgl_lahir}
                                                onChange={(e) =>
                                                    setData(
                                                        "tgl_lahir",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.tgl_lahir}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel value="Agama" />
                                            <select
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                                value={data.agama}
                                                onChange={(e) =>
                                                    setData(
                                                        "agama",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Pilih...
                                                </option>
                                                <option value="Islam">
                                                    Islam
                                                </option>
                                                <option value="Kristen">
                                                    Kristen
                                                </option>
                                                <option value="Katolik">
                                                    Katolik
                                                </option>
                                                <option value="Hindu">
                                                    Hindu
                                                </option>
                                                <option value="Buddha">
                                                    Buddha
                                                </option>
                                            </select>
                                            <InputError
                                                message={errors.agama}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Status Pernikahan" />
                                            <select
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                                value={data.status_pernikahan}
                                                onChange={(e) =>
                                                    setData(
                                                        "status_pernikahan",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Pilih...
                                                </option>
                                                <option value="Belum Kawin">
                                                    Belum Kawin
                                                </option>
                                                <option value="Kawin">
                                                    Kawin
                                                </option>
                                                <option value="Cerai Hidup">
                                                    Cerai Hidup
                                                </option>
                                            </select>
                                            <InputError
                                                message={
                                                    errors.status_pernikahan
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Kontak & Relasi Perusahaan */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4">
                                    Penempatan & Kontak
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value="Email Kantor" />
                                        <TextInput
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.email_kantor}
                                            onChange={(e) =>
                                                setData(
                                                    "email_kantor",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.email_kantor}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="No. Telepon" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.no_telp}
                                            onChange={(e) =>
                                                setData(
                                                    "no_telp",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.no_telp} />
                                    </div>
                                    <div>
                                        <InputLabel value="Departemen" />
                                        <select
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                            value={data.departemen_id}
                                            onChange={(e) =>
                                                setData(
                                                    "departemen_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Departemen --
                                            </option>
                                            {departemens.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.nama_departemen}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.departemen_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Jabatan" />
                                        <select
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                            value={data.jabatan_id}
                                            onChange={(e) =>
                                                setData(
                                                    "jabatan_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Jabatan --
                                            </option>
                                            {jabatans.map((j) => (
                                                <option key={j.id} value={j.id}>
                                                    {j.nama_jabatan}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.jabatan_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Golongan Gaji" />
                                        <select
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                            value={data.golongan_id}
                                            onChange={(e) =>
                                                setData(
                                                    "golongan_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Golongan --
                                            </option>
                                            {golongans.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.kode_golongan} -{" "}
                                                    {g.nama_golongan}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.golongan_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Tanggal Bergabung" />
                                        <TextInput
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.tgl_bergabung}
                                            onChange={(e) =>
                                                setData(
                                                    "tgl_bergabung",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.tgl_bergabung}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Status PTKP (Pajak)" />
                                        <select
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                            value={data.ptkp_id}
                                            onChange={(e) =>
                                                setData(
                                                    "ptkp_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                -- Pilih PTKP --
                                            </option>
                                            {ptkps &&
                                                ptkps.map((p) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {p.kode_ptkp} -{" "}
                                                        {p.deskripsi} (Rp{" "}
                                                        {new Intl.NumberFormat(
                                                            "id-ID",
                                                        ).format(
                                                            p.nominal_neto_tahunan,
                                                        )}
                                                        )
                                                    </option>
                                                ))}
                                        </select>
                                        <InputError message={errors.ptkp_id} />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: Data Sensitif & BPJS */}
                            <div>
                                <h3 className="text-lg font-bold text-red-600 border-b pb-2 mb-4">
                                    Data Sensitif & Asuransi (Ter-Enkripsi)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-red-50 p-4 rounded-md border border-red-100">
                                    <div>
                                        <InputLabel value="No. KTP" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.no_ktp}
                                            onChange={(e) =>
                                                setData(
                                                    "no_ktp",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.no_ktp} />
                                    </div>
                                    <div>
                                        <InputLabel value="NPWP" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.npwp}
                                            onChange={(e) =>
                                                setData("npwp", e.target.value)
                                            }
                                        />
                                        <InputError message={errors.npwp} />
                                    </div>
                                    <div>
                                        <InputLabel value="No. Rekening BCA" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.no_rek_bca}
                                            onChange={(e) =>
                                                setData(
                                                    "no_rek_bca",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.no_rek_bca}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="No. BPJS Kesehatan" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.no_bpjs_kesehatan}
                                            onChange={(e) =>
                                                setData(
                                                    "no_bpjs_kesehatan",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.no_bpjs_kesehatan}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Link href={route("karyawan.index")}>
                                    <SecondaryButton>Batal</SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing
                                        ? "Menyimpan..."
                                        : "Simpan Karyawan & Buat Akun"}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
