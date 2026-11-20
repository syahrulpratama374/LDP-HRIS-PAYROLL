// Helper input nominal Rupiah (dipakai InputRupiah). Nilai mesin selalu string angka bulat tanpa pemisah
// ("492000") atau "" bila kosong; tampilan memakai pemisah ribuan Indonesia ("492.000").

/** Maksimal 15 digit agar tetap di bawah Number.MAX_SAFE_INTEGER. */
export const MAKS_DIGIT = 15;

/** Nilai mesin (angka / "492000" / "492000.00" dari server) -> string digit bulat, atau "". */
export function keDigit(nilai) {
    if (nilai === null || nilai === undefined || nilai === "") return "";
    if (typeof nilai === "number") return Number.isFinite(nilai) ? String(Math.round(nilai)) : "";
    const s = String(nilai).trim();
    // Format mesin dari server/DB: titik = desimal (mis. "492000.00")
    if (/^-?\d+(\.\d+)?$/.test(s)) return String(Math.round(Number(s)));
    return bacaTeks(s);
}

/** Format ribuan Indonesia: "1476000" -> "1.476.000". */
export function formatRibuan(digit) {
    if (!digit) return "";
    return digit.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Baca teks bebas yang ditempel/diketik pengguna menjadi string digit bulat.
 * Mengenali "Rp 1.476.000", "1.476.000,50", "1,476,000.50", "1476000.00", "1476000"; huruf diabaikan.
 */
export function bacaTeks(teks) {
    let s = String(teks ?? "").replace(/rp\.?/gi, "").replace(/[\s ]/g, "");
    s = s.replace(/[^\d.,]/g, "");
    if (!s) return "";

    let bulat;
    if (/^\d{1,3}(\.\d{3})+(,\d*)?$/.test(s)) {
        bulat = s.split(",")[0].replace(/\./g, ""); // Indonesia: 1.476.000,50
    } else if (/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) {
        bulat = s.split(".")[0].replace(/,/g, ""); // Inggris: 1,476,000.50
    } else if (/^\d+[.,]\d{1,2}$/.test(s)) {
        bulat = String(Math.round(Number(s.replace(",", ".")))); // desimal: 1476000.00 / 1476000,5
    } else {
        bulat = s.replace(/[.,]/g, ""); // selainnya: ambil semua digit
    }
    bulat = bulat.replace(/^0+(?=\d)/, "");
    return bulat.slice(0, MAKS_DIGIT);
}

/** Jumlah digit di kiri posisi kursor pada teks tampilan. */
export function digitSebelum(teks, posisi) {
    return (teks.slice(0, posisi).match(/\d/g) || []).length;
}

/** Posisi kursor di teks terformat tepat setelah digit ke-n. */
export function posisiSetelahDigit(teksFormat, n) {
    if (n <= 0) return 0;
    let hitung = 0;
    for (let i = 0; i < teksFormat.length; i++) {
        if (/\d/.test(teksFormat[i]) && ++hitung === n) return i + 1;
    }
    return teksFormat.length;
}
