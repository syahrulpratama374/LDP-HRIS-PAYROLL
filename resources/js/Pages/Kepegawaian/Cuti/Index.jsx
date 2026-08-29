import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ riwayatCuti }) {
    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Riwayat Cuti & Izin</h2>}>
            <Head title="Pengajuan Cuti" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Tombol Ajukan Baru */}
                    <div className="mb-6 flex justify-end">
                        <Link href={route('cuti.create')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all">
                            + Ajukan Cuti / Izin Baru
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Tgl Pengajuan</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Jenis</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Tanggal Pelaksanaan</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Alasan</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riwayatCuti.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                Anda belum pernah mengajukan cuti atau izin.
                                            </td>
                                        </tr>
                                    ) : (
                                        riwayatCuti.map((cuti) => (
                                            <tr key={cuti.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(cuti.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm font-bold text-gray-800">
                                                    {cuti.jenis_cuti}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(cuti.tanggal_mulai).toLocaleDateString('id-ID')} s/d <br/>
                                                    {new Date(cuti.tanggal_selesai).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-600">
                                                    {cuti.alasan}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${cuti.status_approval === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                          cuti.status_approval === 'Disetujui' ? 'bg-green-100 text-green-800' : 
                                                          'bg-red-100 text-red-800'}`}>
                                                        {cuti.status_approval}
                                                    </span>
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
        </AuthenticatedLayout>
    );
}