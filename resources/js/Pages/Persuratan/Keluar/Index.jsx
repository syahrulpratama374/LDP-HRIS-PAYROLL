import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";
import SignModal from "@/Components/SignModal";
export default function Index({ auth, suratKeluars }) {
    const { user } = usePage().props.auth;
    const [selectedSurat, setSelectedSurat] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    // Buka Modal Tracking Timeline
    const handleOpenDetail = (surat) => {
        setSelectedSurat(surat);
        setShowDetailModal(true);
    };

    // Buka Modal Eksekusi TTD / Persetujuan Pimpinan
    const handleOpenApproval = (surat) => {
        setSelectedSurat(surat);
        setShowApprovalModal(true);
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
            case "Batal":
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
                                        const activeStep =
                                            surat.approvals?.find(
                                                (a) => a.status === "Menunggu",
                                            );

                                        const userJabatanId =
                                            auth?.user?.karyawan?.jabatan_id ||
                                            user?.karyawan?.jabatan_id ||
                                            user?.jabatan_id;

                                        // Cek Wewenang Persetujuan (atau Super Admin bypass)
                                        const isMyTurn =
                                            (activeStep &&
                                                Number(userJabatanId) ===
                                                    Number(
                                                        activeStep.jabatan_id,
                                                    )) ||
                                            auth?.user?.role_id === 1;

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

                                                        {/* TOMBOL PERSETUJUAN */}
                                                        {surat.can_approve &&
                                                            isMyTurn &&
                                                            surat.status !==
                                                                "Terbit" && (
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

                                                        {/* TOMBOL CETAK PDF */}
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

                                <div className="mb-4 bg-gray-50 p-4 rounded-lg border text-xs grid grid-cols-2 gap-4">
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
                                            {selectedSurat.karyawan
                                                ?.nama_lengkap || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* LAMPIRAN BERKAS PENDUKUNG */}
                                <div className="mb-6 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100">
                                    <h4 className="font-bold text-xs text-blue-900 mb-2 uppercase flex items-center gap-1.5">
                                        📁 Lampiran Berkas Pendukung (
                                        {selectedSurat.lampirans?.length || 0})
                                    </h4>
                                    {selectedSurat.lampirans &&
                                    selectedSurat.lampirans.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSurat.lampirans.map(
                                                (file) => (
                                                    <a
                                                        key={file.id}
                                                        href={`/storage/${file.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium transition shadow-sm"
                                                    >
                                                        📎 {file.nama_file_asli}
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">
                                            Tidak ada lampiran berkas pendukung
                                            pada surat ini.
                                        </p>
                                    )}
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

                    {/* MODAL 2: POP-UP PERSETUJUAN TTD CANVAS & QR CODE */}
                    {selectedSurat && (
                        <SignModal
                            isOpen={showApprovalModal}
                            onClose={() => {
                                setShowApprovalModal(false);
                                setSelectedSurat(null);
                            }}
                            suratId={selectedSurat.id}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
