import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";

export default function Index({ auth, suratKeluars }) {
    const { user } = usePage().props.auth;
    const [selectedSurat, setSelectedSurat] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    // State Form Approval Action
    const [actionType, setActionType] = useState("approve"); // 'approve' | 'reject'
    const [catatan, setCatatan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Buka Modal Tracking Timeline
    const handleOpenDetail = (surat) => {
        setSelectedSurat(surat);
        setShowDetailModal(true);
    };

    // Buka Modal Eksekusi TTD / Persetujuan Pimpinan
    const handleOpenApproval = (surat) => {
        setSelectedSurat(surat);
        setCatatan("");
        setActionType("approve");
        setShowApprovalModal(true);
    };

    // Submit Persetujuan atau Penolakan ke Backend
    const handleSubmitApproval = (e) => {
        e.preventDefault();
        if (!selectedSurat) return;

        setIsSubmitting(true);

        const routeName =
            actionType === "approve" ? "keluar.approve" : "keluar.batalkan";

        router.post(
            route(routeName, selectedSurat.id),
            { catatan },
            {
                onSuccess: () => {
                    setShowApprovalModal(false);
                    setSelectedSurat(null);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            },
        );
    };

    // Helper Penentu Badge Status Utama
    const renderStatusBadge = (status) => {
        switch (status) {
            case "Terbit":
                return (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                        Terbit
                    </span>
                );
            case "Draft":
                return (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Draft
                    </span>
                );
            case "Dibatalkan":
                return (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                        Dibatalkan
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
                        Menunggu
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Manajemen & Monitoring Surat Keluar
                </h2>
            }
        >
            <Head title="Surat Keluar" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* BARIS HEADER TAMPILAN */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Daftar Surat Keluar HC & Perusahaan
                            </h3>
                            <p className="text-xs text-gray-500">
                                Pantau status persetujuan bertingkat dan
                                terbitan surat resmi.
                            </p>
                        </div>
                        <Link href={route("keluar.create")}>
                            <PrimaryButton>
                                + Buat Draf Surat Baru
                            </PrimaryButton>
                        </Link>
                    </div>

                    {/* TABEL SURAT KELUAR */}
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden border">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        No. Surat / Tanggal
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Tujuan Karyawan
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Template
                                    </th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">
                                        Status Approval
                                    </th>
                                    <th className="px-6 py-3 text-center font-bold text-gray-500 uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {suratKeluars.data &&
                                suratKeluars.data.length > 0 ? (
                                    suratKeluars.data.map((surat) => {
                                        // Cari step approval yang sedang aktif (Menunggu)
                                        const activeStep =
                                            surat.approvals?.find(
                                                (a) => a.status === "Menunggu",
                                            );
                                        const isMyTurn =
                                            activeStep &&
                                            user.jabatan_id ===
                                                activeStep.jabatan_id;

                                        return (
                                            <tr
                                                key={surat.id}
                                                className="hover:bg-gray-50/50 transition"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-indigo-700">
                                                        {surat.nomor_surat || (
                                                            <span className="text-gray-400 font-normal italic">
                                                                Belum
                                                                Diterbitkan
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                                        Dibuat:{" "}
                                                        {new Date(
                                                            surat.created_at,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">
                                                        {surat.karyawan
                                                            ?.nama_lengkap ||
                                                            "-"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {
                                                            surat.karyawan
                                                                ?.nik_internal
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-medium border">
                                                        {
                                                            surat.template
                                                                ?.nama_template
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {renderStatusBadge(
                                                            surat.status,
                                                        )}
                                                        {activeStep && (
                                                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                Posisi:{" "}
                                                                {
                                                                    activeStep.label_ttd
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Tombol Tracking Progress */}
                                                        <button
                                                            onClick={() =>
                                                                handleOpenDetail(
                                                                    surat,
                                                                )
                                                            }
                                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-bold transition border"
                                                        >
                                                            Tracking
                                                        </button>

                                                        {/* Tombol Eksekusi TTD Pimpinan (Jika Giliran User saat ini) */}
                                                        {isMyTurn &&
                                                            surat.status ===
                                                                "Draft" && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleOpenApproval(
                                                                            surat,
                                                                        )
                                                                    }
                                                                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition animate-pulse"
                                                                >
                                                                    ✍️ Setujui
                                                                </button>
                                                            )}

                                                        {/* Tombol Unduh PDF (Jika Surat Sudah Terbit) */}
                                                        {surat.status ===
                                                            "Terbit" && (
                                                            <a
                                                                href={route(
                                                                    "keluar.pdf",
                                                                    surat.id,
                                                                )}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-bold transition inline-flex items-center gap-1"
                                                            >
                                                                📄 PDF
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-8 text-center text-gray-400 italic"
                                        >
                                            Belum ada data draf atau surat
                                            keluar yang dibuat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MODAL 1: TRACKING TIMELINE PROGRESS */}
                    <Modal
                        show={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        maxWidth="2xl"
                    >
                        {selectedSurat && (
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">
                                    Progress Tracking Surat #{selectedSurat.id}
                                </h3>

                                <div className="mb-6 bg-gray-50 p-4 rounded-lg border text-xs grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500">
                                            Template Surat:
                                        </p>
                                        <p className="font-bold text-gray-800">
                                            {
                                                selectedSurat.template
                                                    ?.nama_template
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">
                                            Penerima Dokumen:
                                        </p>
                                        <p className="font-bold text-gray-800">
                                            {
                                                selectedSurat.karyawan
                                                    ?.nama_lengkap
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* TIMELINE STEPPER */}
                                <h4 className="font-bold text-sm text-gray-800 mb-3">
                                    Rute Hierarki Persetujuan:
                                </h4>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
                                    {selectedSurat.approvals &&
                                    selectedSurat.approvals.length > 0 ? (
                                        selectedSurat.approvals.map(
                                            (appr, idx) => (
                                                <div
                                                    key={appr.id}
                                                    className="relative flex items-start gap-4 text-xs"
                                                >
                                                    {/* Node Circle Indicator */}
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white z-10 shrink-0 ${
                                                            appr.status ===
                                                            "Disetujui"
                                                                ? "bg-green-600"
                                                                : appr.status ===
                                                                    "Ditolak"
                                                                  ? "bg-red-600"
                                                                  : "bg-amber-500 ring-4 ring-amber-100"
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </div>

                                                    <div className="bg-white border rounded-lg p-3 flex-1 shadow-sm">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-gray-800">
                                                                {appr.label_ttd}{" "}
                                                                (
                                                                {
                                                                    appr.jabatan
                                                                        ?.nama_jabatan
                                                                }
                                                                )
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    appr.status ===
                                                                    "Disetujui"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : appr.status ===
                                                                            "Ditolak"
                                                                          ? "bg-red-100 text-red-800"
                                                                          : "bg-amber-100 text-amber-800"
                                                                }`}
                                                            >
                                                                {appr.status}
                                                            </span>
                                                        </div>

                                                        {appr.user_aktual && (
                                                            <p className="text-gray-600">
                                                                Penandatangan:{" "}
                                                                <span className="font-medium text-gray-900">
                                                                    {
                                                                        appr
                                                                            .user_aktual
                                                                            .name
                                                                    }
                                                                </span>
                                                            </p>
                                                        )}
                                                        {appr.waktu_approval && (
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                Waktu:{" "}
                                                                {new Date(
                                                                    appr.waktu_approval,
                                                                ).toLocaleString(
                                                                    "id-ID",
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">
                                            Tidak ada rute approval bertingkat
                                            untuk surat ini.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <SecondaryButton
                                        onClick={() =>
                                            setShowDetailModal(false)
                                        }
                                    >
                                        Tutup
                                    </SecondaryButton>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* MODAL 2: EKSEKUSI PERSETUJUAN PIMPINAN */}
                    <Modal
                        show={showApprovalModal}
                        onClose={() => setShowApprovalModal(false)}
                        maxWidth="lg"
                    >
                        {selectedSurat && (
                            <form
                                onSubmit={handleSubmitApproval}
                                className="p-6"
                            >
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">
                                    Persetujuan Dokumen Resmi
                                </h3>

                                <p className="text-xs text-gray-600 mb-4">
                                    Anda akan melakukan tindakan
                                    penandatanganan/peninjauan untuk draf surat{" "}
                                    <strong className="text-indigo-600">
                                        {selectedSurat.template?.nama_template}
                                    </strong>{" "}
                                    yang ditujukan kepada{" "}
                                    <strong>
                                        {selectedSurat.karyawan?.nama_lengkap}
                                    </strong>
                                    .
                                </p>

                                <div className="mb-4">
                                    <InputLabel value="Opsi Tindakan Persetujuan" />
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer border p-2.5 rounded-lg flex-1 bg-green-50/50 border-green-200">
                                            <input
                                                type="radio"
                                                name="actionType"
                                                value="approve"
                                                checked={
                                                    actionType === "approve"
                                                }
                                                onChange={() =>
                                                    setActionType("approve")
                                                }
                                                className="text-green-600 focus:ring-green-500"
                                            />
                                            <span className="text-xs font-bold text-green-800">
                                                Setujui & Tanda Tangan
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer border p-2.5 rounded-lg flex-1 bg-red-50/50 border-red-200">
                                            <input
                                                type="radio"
                                                name="actionType"
                                                value="reject"
                                                checked={
                                                    actionType === "reject"
                                                }
                                                onChange={() =>
                                                    setActionType("reject")
                                                }
                                                className="text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-xs font-bold text-red-800">
                                                Tolak / Minta Revisi
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <InputLabel value="Catatan / Alasan (Opsional untuk ACC, Wajib jika Ditolak)" />
                                    <textarea
                                        className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-xs focus:border-indigo-500"
                                        rows="3"
                                        value={catatan}
                                        onChange={(e) =>
                                            setCatatan(e.target.value)
                                        }
                                        placeholder="Tuliskan catatan tambahan atau instruksi revisi..."
                                        required={actionType === "reject"}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 border-t pt-4">
                                    <SecondaryButton
                                        onClick={() =>
                                            setShowApprovalModal(false)
                                        }
                                    >
                                        Batal
                                    </SecondaryButton>
                                    {actionType === "approve" ? (
                                        <PrimaryButton disabled={isSubmitting}>
                                            {isSubmitting
                                                ? "Memproses..."
                                                : "Ya, Disetujui"}
                                        </PrimaryButton>
                                    ) : (
                                        <DangerButton disabled={isSubmitting}>
                                            {isSubmitting
                                                ? "Memproses..."
                                                : "Tolak Surat"}
                                        </DangerButton>
                                    )}
                                </div>
                            </form>
                        )}
                    </Modal>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
