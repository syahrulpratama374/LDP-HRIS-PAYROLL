import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function HC({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard Human Capital
                </h2>
            }
        >
            <Head title="Dashboard HC" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 font-bold text-gray-900">
                        Selamat datang di Dasbor Human Capital. (Manajemen
                        Pegawai, Cuti Dinamis, & Persuratan)
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
