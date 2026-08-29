import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        jenis_cuti: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        alasan: '',
        dokumen_bukti: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('cuti.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Formulir Pengajuan Cuti & Izin</h2>}>
            <Head title="Ajukan Cuti" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8">
                        
                        <form onSubmit={submit} encType="multipart/form-data">
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Cuti / Izin <span className="text-red-500">*</span></label>
                                <select 
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.jenis_cuti}
                                    onChange={e => setData('jenis_cuti', e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Jenis --</option>
                                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                                    <option value="Izin Sakit">Izin Sakit</option>
                                    <option value="Izin Penting">Izin Keperluan Penting</option>
                                </select>
                                {errors.jenis_cuti && <div className="text-red-500 text-xs mt-1">{errors.jenis_cuti}</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.tanggal_mulai}
                                        onChange={e => setData('tanggal_mulai', e.target.value)}
                                        required
                                    />
                                    {errors.tanggal_mulai && <div className="text-red-500 text-xs mt-1">{errors.tanggal_mulai}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.tanggal_selesai}
                                        onChange={e => setData('tanggal_selesai', e.target.value)}
                                        required
                                    />
                                    {errors.tanggal_selesai && <div className="text-red-500 text-xs mt-1">{errors.tanggal_selesai}</div>}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Detail <span className="text-red-500">*</span></label>
                                <textarea 
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    rows="4"
                                    value={data.alasan}
                                    onChange={e => setData('alasan', e.target.value)}
                                    placeholder="Jelaskan alasan cuti/izin Anda..."
                                    required
                                ></textarea>
                                {errors.alasan && <div className="text-red-500 text-xs mt-1">{errors.alasan}</div>}
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dokumen Pendukung (Opsional)</label>
                                <p className="text-xs text-gray-500 mb-2">Wajib diunggah jika memilih Izin Sakit (Surat Dokter). Format: JPG, PNG, PDF (Max 2MB).</p>
                                <input 
                                    type="file" 
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={e => setData('dokumen_bukti', e.target.files[0])}
                                />
                                {errors.dokumen_bukti && <div className="text-red-500 text-xs mt-1">{errors.dokumen_bukti}</div>}
                            </div>

                            <div className="flex items-center justify-end space-x-3 border-t pt-4">
                                <Link href={route('cuti.index')} className="px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50">
                                    Batal
                                </Link>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 ${processing && 'opacity-75 cursor-not-allowed'}`}
                                >
                                    {processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}