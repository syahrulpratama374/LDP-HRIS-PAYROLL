import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function AdminIndex({ tickets }) {
    // State untuk mengontrol Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Form handler Inertia
    const { data, setData, post, processing, reset } = useForm({
        status: "",
        persentase_progress: 0,
    });

    // Fungsi membuka Modal dan mengisi data awal
    const openModal = (ticket) => {
        setSelectedTicketId(ticket.id);
        setData({
            status: ticket.status,
            persentase_progress: ticket.persentase_progress,
        });
        setIsModalOpen(true);
    };

    // Fungsi menutup Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTicketId(null);
        reset();
    };

    // Fungsi Submit Form dari dalam Modal
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.ticket.update", selectedTicketId), {
            onSuccess: () => closeModal(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Monitoring IT Helpdesk
                </h2>
            }
        >
            <Head title="Admin Helpdesk" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Pelapor
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Detail Kendala
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase w-1/4">
                                            Status & Progress
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Semua sistem aman. Belum ada
                                                keluhan.
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">
                                                        {t.user?.name}
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
                                                    <div className="text-sm font-bold text-red-600">
                                                        [{t.prioritas}]{" "}
                                                        {t.judul}
                                                    </div>
                                                    <div className="text-xs font-semibold text-gray-600 mt-1">
                                                        Kategori: {t.modul}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        "{t.deskripsi}"
                                                    </div>
                                                    {t.file_lampiran && (
                                                        <a
                                                            href={`/storage/${t.file_lampiran}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-indigo-600 underline mt-2 inline-block"
                                                        >
                                                            Lihat Lampiran
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-gray-700">
                                                            {t.status}
                                                        </span>
                                                        <span className="text-gray-900 font-bold">
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
                                                <td className="px-6 py-4 border-b text-center">
                                                    <button
                                                        onClick={() =>
                                                            openModal(t)
                                                        }
                                                        className="bg-gray-800 hover:bg-black text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                    >
                                                        Update Progress
                                                    </button>
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

            {/* KOMPONEN MODAL OVERLAY */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                            Update Progress Tiket
                        </h3>

                        <form onSubmit={handleSubmit}>
                            {/* Input Dropdown Status */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status Kendala
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="Submitted">
                                        Submitted (Baru Masuk)
                                    </option>
                                    <option value="In Progress">
                                        In Progress (Sedang Dikerjakan)
                                    </option>
                                    <option value="Resolved">
                                        Resolved (Sudah Diperbaiki)
                                    </option>
                                    <option value="Closed">
                                        Closed (Selesai)
                                    </option>
                                </select>
                            </div>

                            {/* Input Slider Progress */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                                    <span>Persentase Progress</span>
                                    <span className="font-bold text-indigo-600">
                                        {data.persentase_progress}%
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={data.persentase_progress}
                                    onChange={(e) =>
                                        setData(
                                            "persentase_progress",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-bold text-sm hover:bg-indigo-700 shadow transition disabled:opacity-50"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
