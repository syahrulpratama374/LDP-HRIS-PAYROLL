import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Show({ karyawan, jabatans = [] }) {
    const [activeTab, setActiveTab] = useState('biodata');
    
    // State untuk memunculkan/menyembunyikan form input
    const [showFormJabatan, setShowFormJabatan] = useState(false);
    const [showFormGaji, setShowFormGaji] = useState(false);

    // Form Handler untuk Jabatan
    const formJabatan = useForm({
        jabatan_id: '',
        effective_date_start: '',
    });

    // Form Handler untuk Gaji
    const formGaji = useForm({
        nominal_gaji_pokok: '',
        effective_date_start: '',
    });

    const submitJabatan = (e) => {
        e.preventDefault();
        formJabatan.post(route('karyawan.updateJabatan', karyawan.id), {
            onSuccess: () => {
                setShowFormJabatan(false);
                formJabatan.reset();
            }
        });
    };

    const submitGaji = (e) => {
        e.preventDefault();
        formGaji.post(route('karyawan.updateGaji', karyawan.id), {
            onSuccess: () => {
                setShowFormGaji(false);
                formGaji.reset();
            }
        });
    };

    // Helper formatter Rupiah
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Profil Karyawan: {karyawan.nama_lengkap}</h2>}>
            <Head title={`Profil - ${karyawan.nama_lengkap}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
                    
                    {/* PANEL KIRI: Ringkasan Profil */}
                    <div className="w-full md:w-1/3">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col items-center border-t-4 border-indigo-500">
                            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 mb-4">
                                {karyawan.nama_lengkap.charAt(0)}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{karyawan.nama_lengkap}</h3>
                            <p className="text-sm text-gray-500 mb-4">{karyawan.jabatan?.nama_jabatan}</p>
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white w-full text-center ${karyawan.status_aktif ? 'bg-green-500' : 'bg-red-500'}`}>
                                {karyawan.status_aktif ? 'AKTIF BEKERJA' : 'NON-AKTIF'}
                            </span>

                            <div className="w-full mt-6 space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-500">NIK:</span>
                                    <span className="font-medium text-gray-900">{karyawan.nik_internal}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-500">Departemen:</span>
                                    <span className="font-medium text-gray-900">{karyawan.departemen?.nama_departemen}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-500">Bergabung:</span>
                                    <span className="font-medium text-gray-900">{karyawan.tgl_bergabung}</span>
                                </div>
                            </div>

                            <Link href={route('karyawan.index')} className="mt-6 w-full">
                                <SecondaryButton className="w-full justify-center">Kembali ke Daftar</SecondaryButton>
                            </Link>
                        </div>
                    </div>

                    {/* PANEL KANAN: Data Detail (Tabs) */}
                    <div className="w-full md:w-2/3">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            
                            {/* Navigasi Tabs */}
                            <div className="flex border-b overflow-x-auto">
                                <button onClick={() => setActiveTab('biodata')} className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'biodata' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Biodata & Kontak
                                </button>
                                <button onClick={() => setActiveTab('sensitif')} className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'sensitif' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Data Sensitif & Bank
                                </button>
                                <button onClick={() => setActiveTab('riwayat')} className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'riwayat' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Riwayat Gaji & Jabatan
                                </button>
                            </div>

                            {/* Konten Tabs */}
                            <div className="p-6">
                                
                                {activeTab === 'biodata' && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-gray-800 mb-4">Informasi Pribadi</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><p className="text-gray-500">Tempat, Tanggal Lahir</p><p className="font-medium text-gray-900">{karyawan.tempat_lahir}, {karyawan.tgl_lahir}</p></div>
                                            <div><p className="text-gray-500">Agama</p><p className="font-medium text-gray-900">{karyawan.agama}</p></div>
                                            <div><p className="text-gray-500">Status Pernikahan</p><p className="font-medium text-gray-900">{karyawan.status_pernikahan}</p></div>
                                            <div><p className="text-gray-500">Email Kantor (Login)</p><p className="font-medium text-gray-900">{karyawan.email_kantor}</p></div>
                                            <div><p className="text-gray-500">Nomor Telepon</p><p className="font-medium text-gray-900">{karyawan.no_telp || '-'}</p></div>
                                            <div><p className="text-gray-500">Golongan Gaji</p><p className="font-medium text-gray-900">{karyawan.golongan?.nama_golongan}</p></div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'sensitif' && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-red-600 mb-4">Data Rahasia (Terenkripsi)</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm bg-red-50 p-4 rounded border border-red-100">
                                            <div><p className="text-red-400">Nomor KTP</p><p className="font-bold text-red-700">{karyawan.no_ktp}</p></div>
                                            <div><p className="text-red-400">NPWP</p><p className="font-bold text-red-700">{karyawan.npwp}</p></div>
                                            <div><p className="text-red-400">No. Rekening BCA</p><p className="font-bold text-red-700">{karyawan.no_rek_bca}</p></div>
                                            <div><p className="text-red-400">BPJS Kesehatan</p><p className="font-bold text-red-700">{karyawan.no_bpjs_kesehatan || '-'}</p></div>
                                            <div><p className="text-red-400">BPJS Ketenagakerjaan</p><p className="font-bold text-red-700">{karyawan.no_bpjs_ketenagakerjaan || '-'}</p></div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'riwayat' && (
                                    <div className="space-y-10">
                                        
                                        {/* BAGIAN RIWAYAT JABATAN */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-bold text-gray-800">Riwayat Jabatan</h4>
                                                <PrimaryButton onClick={() => setShowFormJabatan(!showFormJabatan)} className="!py-1 !px-3 text-xs">
                                                    {showFormJabatan ? 'Batal' : '+ Mutasi Jabatan'}
                                                </PrimaryButton>
                                            </div>

                                            {/* Form Input Jabatan Baru */}
                                            {showFormJabatan && (
                                                <form onSubmit={submitJabatan} className="bg-gray-50 p-4 rounded-md mb-4 border flex gap-4 items-end">
                                                    <div className="w-1/2">
                                                        <InputLabel value="Jabatan Baru" />
                                                        <select className="mt-1 block w-full border-gray-300 rounded-md text-sm" 
                                                            value={formJabatan.data.jabatan_id} 
                                                            onChange={e => formJabatan.setData('jabatan_id', e.target.value)}>
                                                            <option value="">Pilih Jabatan...</option>
                                                            {jabatans.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                                                        </select>
                                                        <InputError message={formJabatan.errors.jabatan_id} className="mt-1" />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <InputLabel value="Tgl Berlaku Mulai" />
                                                        <TextInput type="date" className="mt-1 block w-full text-sm" 
                                                            value={formJabatan.data.effective_date_start} 
                                                            onChange={e => formJabatan.setData('effective_date_start', e.target.value)} />
                                                        <InputError message={formJabatan.errors.effective_date_start} className="mt-1" />
                                                    </div>
                                                    <PrimaryButton disabled={formJabatan.processing} className="mb-1">Simpan</PrimaryButton>
                                                </form>
                                            )}

                                            <table className="w-full text-sm text-left text-gray-500 border">
                                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                                    <tr>
                                                        <th className="px-4 py-2 border-r">Jabatan</th>
                                                        <th className="px-4 py-2 border-r">Mulai Berlaku</th>
                                                        <th className="px-4 py-2">Berakhir Pada</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {karyawan.riwayat_jabatans && karyawan.riwayat_jabatans.length > 0 ? (
                                                        karyawan.riwayat_jabatans.map((rj) => (
                                                            <tr key={rj.id} className="border-b">
                                                                <td className="px-4 py-2 border-r font-medium text-gray-900">{rj.jabatan?.nama_jabatan}</td>
                                                                <td className="px-4 py-2 border-r">{rj.effective_date_start}</td>
                                                                <td className="px-4 py-2">
                                                                    {rj.effective_date_end ? rj.effective_date_end : <span className="text-green-600 font-bold">Sekarang (Aktif)</span>}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="3" className="px-4 py-3 text-center">Belum ada riwayat tercatat.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* BAGIAN RIWAYAT GAJI */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-bold text-gray-800">Riwayat Gaji Pokok</h4>
                                                <PrimaryButton onClick={() => setShowFormGaji(!showFormGaji)} className="!py-1 !px-3 text-xs">
                                                    {showFormGaji ? 'Batal' : '+ Kenaikan Gaji'}
                                                </PrimaryButton>
                                            </div>

                                            {/* Form Input Gaji Baru */}
                                            {showFormGaji && (
                                                <form onSubmit={submitGaji} className="bg-green-50 p-4 rounded-md mb-4 border border-green-100 flex gap-4 items-end">
                                                    <div className="w-1/2">
                                                        <InputLabel value="Nominal Gaji Pokok Baru (Rp)" />
                                                        <TextInput type="number" className="mt-1 block w-full text-sm" 
                                                            value={formGaji.data.nominal_gaji_pokok} 
                                                            onChange={e => formGaji.setData('nominal_gaji_pokok', e.target.value)} />
                                                        <InputError message={formGaji.errors.nominal_gaji_pokok} className="mt-1" />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <InputLabel value="Tgl Berlaku Mulai" />
                                                        <TextInput type="date" className="mt-1 block w-full text-sm" 
                                                            value={formGaji.data.effective_date_start} 
                                                            onChange={e => formGaji.setData('effective_date_start', e.target.value)} />
                                                        <InputError message={formGaji.errors.effective_date_start} className="mt-1" />
                                                    </div>
                                                    <PrimaryButton disabled={formGaji.processing} className="mb-1 !bg-green-600 hover:!bg-green-700">Simpan</PrimaryButton>
                                                </form>
                                            )}

                                            <table className="w-full text-sm text-left text-gray-500 border">
                                                <thead className="text-xs text-gray-700 uppercase bg-green-100 border-b border-green-200">
                                                    <tr>
                                                        <th className="px-4 py-2 border-r border-green-200">Nominal Gaji</th>
                                                        <th className="px-4 py-2 border-r border-green-200">Mulai Berlaku</th>
                                                        <th className="px-4 py-2">Berakhir Pada</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {karyawan.riwayat_gajis && karyawan.riwayat_gajis.length > 0 ? (
                                                        karyawan.riwayat_gajis.map((rg) => (
                                                            <tr key={rg.id} className="border-b">
                                                                <td className="px-4 py-2 border-r font-bold text-gray-900">{formatRupiah(rg.nominal_gaji_pokok)}</td>
                                                                <td className="px-4 py-2 border-r">{rg.effective_date_start}</td>
                                                                <td className="px-4 py-2">
                                                                    {rg.effective_date_end ? rg.effective_date_end : <span className="text-green-600 font-bold">Sekarang (Aktif)</span>}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="3" className="px-4 py-3 text-center">Belum ada riwayat gaji tercatat.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}