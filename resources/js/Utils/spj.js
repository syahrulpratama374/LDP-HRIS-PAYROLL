// Utilitas tampilan modul SPJ Perjalanan Dinas.

const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const urai = (tgl) => {
    if (!tgl) return null;
    const [y, m, d] = String(tgl).slice(0, 10).split("-").map(Number);
    return { y, m, d };
};

/** "27 - 29 Agustus 2026", "30 Agustus - 2 September 2026", atau satu tanggal. */
export function formatRentangTanggal(mulai, selesai) {
    const a = urai(mulai);
    const b = urai(selesai);
    if (!a) return "-";
    const lengkap = (t) => `${t.d} ${BULAN[t.m - 1]} ${t.y}`;
    if (!b || (a.y === b.y && a.m === b.m && a.d === b.d)) return lengkap(a);
    if (a.y === b.y && a.m === b.m) return `${a.d} - ${b.d} ${BULAN[a.m - 1]} ${a.y}`;
    if (a.y === b.y) return `${a.d} ${BULAN[a.m - 1]} - ${lengkap(b)}`;
    return `${lengkap(a)} - ${lengkap(b)}`;
}

export function formatTanggal(tgl) {
    const t = urai(tgl);
    return t ? `${t.d} ${BULAN[t.m - 1]} ${t.y}` : "-";
}

export const WARNA_STATUS_SPJ = {
    Draft: "bg-gray-100 text-gray-700 border-gray-200",
    Diajukan: "bg-amber-50 text-amber-700 border-amber-200",
    Disetujui: "bg-green-50 text-green-700 border-green-200",
    Ditolak: "bg-red-50 text-red-700 border-red-200",
    Selesai: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Dibatalkan: "bg-gray-50 text-gray-400 border-gray-200",
};
