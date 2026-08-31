import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function AdminIndex({ auth, pengajuanCuti }) {
    
    const handleApproval = (id, status) => {
        if (confirm(`Apakah Anda yakin ingin memberikan status "${status}" pada pengajuan ini?`)) {
            router.post(route('admin.cuti.update', id), {
                status_approval: status
            }, { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Approval Pengajuan Cuti & Izin</h2>}>
            <Head title="Approval Cuti" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Tgl Pengajuan</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Karyawan</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Detail Cuti</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">Dokumen</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">Status & Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pengajuanCuti.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Belum ada pengajuan cuti yang masuk.</td>
                                        </tr>
                                    ) : (
                                        pengajuanCuti.data.map((cuti) => (
                                            <tr key={cuti.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 border-b text-sm text-gray-700 whitespace-nowrap">
                                                    {new Date(cuti.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">{cuti.karyawan?.nama_lengkap}</div>
                                                    <div className="text-xs text-gray-500">{cuti.karyawan?.departemen?.nama_departemen || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-indigo-600">{cuti.jenis_cuti}</div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {new Date(cuti.tanggal_mulai).toLocaleDateString('id-ID')} s/d {new Date(cuti.tanggal_selesai).toLocaleDateString('id-ID')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 italic">"{cuti.alasan}"</div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {cuti.dokumen_bukti_path ? (
                                                        <a href={`/storage/${cuti.dokumen_bukti_path}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Lihat Lampiran</a>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {cuti.status_approval === 'Pending' ? (
                                                        <div className="flex justify-center space-x-2">
                                                            <button onClick={() => handleApproval(cuti.id, 'Disetujui')} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded shadow hover:bg-green-600 transition">Setujui</button>
                                                            <button onClick={() => handleApproval(cuti.id, 'Ditolak')} className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded shadow hover:bg-red-600 transition">Tolak</button>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${cuti.status_approval === 'Disetujui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {cuti.status_approval}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pengajuanCuti.links && pengajuanCuti.links.length > 3 && (
                            <div className="mt-4 flex justify-end space-x-1">
                                {pengajuanCuti.links.map((link, index) => (
                                    <Link key={index} href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 border rounded text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                    />
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}