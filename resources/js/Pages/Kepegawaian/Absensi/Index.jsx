import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, absensis }) {
    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Monitor Absensi Karyawan</h2>}>
            <Head title="Data Absensi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Riwayat Kehadiran Harian</h3>
                            {/* Tempat untuk fitur filter tanggal/bulan nantinya */}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Karyawan</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock In</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock Out</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi Masuk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {absensis.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                Belum ada data absensi yang terekam.
                                            </td>
                                        </tr>
                                    ) : (
                                        absensis.data.map((absen) => (
                                            <tr key={absen.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 border-b text-sm text-gray-700 whitespace-nowrap">
                                                    {new Date(absen.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">{absen.karyawan?.nama_lengkap}</div>
                                                    <div className="text-xs text-gray-500">{absen.karyawan?.departemen?.nama_departemen}</div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <div className="text-sm font-bold text-blue-600">{absen.waktu_masuk ? new Date(absen.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                    {absen.foto_masuk_path && (
                                                        <a href={`/storage/${absen.foto_masuk_path}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block">Lihat Foto</a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <div className="text-sm font-bold text-red-600">{absen.waktu_keluar ? new Date(absen.waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                    {absen.foto_keluar_path && (
                                                        <a href={`/storage/${absen.foto_keluar_path}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block">Lihat Foto</a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {absen.koordinat_masuk ? (
                                                        <a href={`https://www.google.com/maps?q=${absen.koordinat_masuk}`} target="_blank" rel="noreferrer" 
                                                           className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full hover:bg-green-200 transition">
                                                            📍 Buka Maps
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Sederhana */}
                        {absensis.links && absensis.links.length > 3 && (
                            <div className="mt-4 flex justify-end space-x-1">
                                {absensis.links.map((link, index) => (
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