import React from "react";
import { Head } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function Scan({ aset }) {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <Head title={`Aset: ${aset.kode_aset}`} />

            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
                {/* Header Card */}
                <div className="bg-gray-900 p-6 text-center">
                    <ApplicationLogo className="h-10 w-auto mx-auto fill-current text-white mb-2" />
                    <h2 className="text-white font-bold text-lg tracking-widest uppercase">
                        Verified Asset
                    </h2>
                    <p className="text-gray-400 text-xs">
                        PT Lintas Data Prima (LDP) HRIS
                    </p>
                </div>

                {/* Detail Aset */}
                <div className="p-6 space-y-4">
                    <div className="text-center mb-6">
                        <div className="text-3xl font-black text-gray-900">
                            {aset.kode_aset}
                        </div>
                        <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full mt-2
                            ${
                                aset.status === "Tersedia"
                                    ? "bg-green-100 text-green-800"
                                    : aset.status === "Dipakai"
                                      ? "bg-blue-100 text-blue-800"
                                      : aset.status === "Maintenance"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                            }`}
                        >
                            Status: {aset.status}
                        </span>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                            Nama / Merk Barang
                        </p>
                        <p className="text-lg font-bold text-indigo-700">
                            {aset.nama_aset}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">
                                Kategori
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {aset.kategori}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">
                                Tgl Registrasi
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {new Date(aset.created_at).toLocaleDateString(
                                    "id-ID",
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 bg-gray-50 -mx-6 px-6 pb-6 mt-4">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2 mt-4">
                            Pemegang Hak Guna / Lokasi
                        </p>
                        {aset.penanggung_jawab_id ? (
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    {aset.penanggung_jawab.nama_lengkap.charAt(
                                        0,
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {aset.penanggung_jawab.nama_lengkap}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {
                                            aset.penanggung_jawab.departemen
                                                ?.nama_departemen
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm font-semibold text-gray-500 italic">
                                Saat ini berada di Gudang Utama / Tidak
                                ditugaskan.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
