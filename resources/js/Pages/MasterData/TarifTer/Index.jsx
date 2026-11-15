import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Index({ tarifs }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        kategori: 'A',
        batas_bawah: '',
        batas_atas: '',
        tarif: '',
    });

    const formatRupiah = (angka) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    const openModal = (tarif = null) => {
        clearErrors();
        if (tarif) {
            setIsEditMode(true);
            setEditId(tarif.id);
            setData({
                kategori: tarif.kategori,
                batas_bawah: tarif.batas_bawah,
                batas_atas: tarif.batas_atas ?? '',
                tarif: tarif.tarif,
            });
        } else {
            setIsEditMode(false);
            setEditId(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('tarif-ter.update', editId), { onSuccess: () => closeModal() });
        } else {
            post(route('tarif-ter.store'), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus baris tarif ini?')) {
            destroy(route('tarif-ter.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data - Tarif TER</h2>}>
            <Head title="Master Tarif TER" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-700">Tarif Efektif Rata-rata (PP 58/2023)</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Tarif</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 border">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 border-r text-center">Kategori</th>
                                        <th className="px-6 py-3 border-r text-right">Bruto Bulanan Dari</th>
                                        <th className="px-6 py-3 border-r text-right">Sampai</th>
                                        <th className="px-6 py-3 border-r text-right">Tarif (%)</th>
                                        <th className="px-6 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tarifs.length > 0 ? (
                                        tarifs.map((t) => (
                                            <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 border-r text-center font-bold text-gray-900">{t.kategori}</td>
                                                <td className="px-6 py-4 border-r text-right">{formatRupiah(t.batas_bawah)}</td>
                                                <td className="px-6 py-4 border-r text-right">{t.batas_atas === null ? 'Tak terbatas' : formatRupiah(t.batas_atas)}</td>
                                                <td className="px-6 py-4 border-r text-right font-semibold text-green-700">{Number(t.tarif)}%</td>
                                                <td className="px-6 py-4 text-center space-x-2">
                                                    <SecondaryButton onClick={() => openModal(t)} className="!py-1 !px-2">Edit</SecondaryButton>
                                                    <DangerButton onClick={() => handleDelete(t.id)} className="!py-1 !px-2">Hapus</DangerButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Belum ada data tarif TER.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">{isEditMode ? 'Edit Tarif TER' : 'Tambah Tarif TER Baru'}</h2>
                    <div className="mb-4">
                        <InputLabel htmlFor="kategori" value="Kategori" />
                        <select id="kategori" value={data.kategori} onChange={(e) => setData('kategori', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                        <InputError message={errors.kategori} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel htmlFor="batas_bawah" value="Bruto Bulanan Dari (Rp)" />
                        <TextInput id="batas_bawah" type="number" value={data.batas_bawah} className="mt-1 block w-full" onChange={(e) => setData('batas_bawah', e.target.value)} />
                        <InputError message={errors.batas_bawah} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel htmlFor="batas_atas" value="Sampai (Rp) — kosongkan bila tak terbatas" />
                        <TextInput id="batas_atas" type="number" value={data.batas_atas} className="mt-1 block w-full" onChange={(e) => setData('batas_atas', e.target.value)} />
                        <InputError message={errors.batas_atas} className="mt-2" />
                    </div>
                    <div className="mb-6">
                        <InputLabel htmlFor="tarif" value="Tarif (%)" />
                        <TextInput id="tarif" type="number" step="0.01" value={data.tarif} className="mt-1 block w-full" onChange={(e) => setData('tarif', e.target.value)} placeholder="Cth: 1.5" />
                        <InputError message={errors.tarif} className="mt-2" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Data'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
