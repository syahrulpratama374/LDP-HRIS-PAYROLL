import { forwardRef, useLayoutEffect, useRef } from "react";
import { bacaTeks, digitSebelum, formatRibuan, keDigit, posisiSetelahDigit } from "@/Utils/angkaRupiah";

/**
 * Input nominal Rupiah yang dipakai ulang. Tampil "Rp 492.000"; onChange menerima string angka bulat
 * tanpa pemisah ("492000") atau "" bila kosong, sehingga nilai yang dikirim ke server tetap angka.
 * Mendukung tempel "Rp 1.476.000", menolak huruf, dan menjaga posisi kursor saat mengetik di tengah angka.
 */
export default forwardRef(function InputRupiah(
    { value, onChange, className = "", wrapperClassName = "", disabled = false, ...props },
    ref,
) {
    const inputRef = useRef(null);
    const kursor = useRef(null); // jumlah digit di kiri kursor yang harus dipulihkan setelah render

    const tampil = formatRibuan(keDigit(value));

    useLayoutEffect(() => {
        if (kursor.current === null || !inputRef.current) return;
        const pos = posisiSetelahDigit(tampil, kursor.current);
        inputRef.current.setSelectionRange(pos, pos);
        kursor.current = null;
    }, [tampil]);

    const setRef = (el) => {
        inputRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
    };

    const kirim = (digit, digitKiri) => {
        kursor.current = Math.min(digitKiri, digit.length);
        onChange?.(digit);
    };

    const handleChange = (e) => {
        const teks = e.target.value;
        const digit = teks.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
        kirim(digit, digitSebelum(teks, e.target.selectionStart ?? teks.length));
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const el = e.target;
        const tempel = bacaTeks(e.clipboardData.getData("text"));
        const kiri = el.value.slice(0, el.selectionStart).replace(/\D/g, "");
        const kanan = el.value.slice(el.selectionEnd).replace(/\D/g, "");
        const digit = (kiri + tempel + kanan).replace(/^0+(?=\d)/, "").slice(0, 15);
        kirim(digit, kiri.length + tempel.length);
    };

    const handleKeyDown = (e) => {
        const el = e.target;
        const { selectionStart: a, selectionEnd: b, value: v } = el;
        // Backspace/Delete tepat di titik pemisah: lompati titiknya agar digit di sebelahnya yang terhapus
        if (a === b && e.key === "Backspace" && v[a - 1] === ".") el.setSelectionRange(a - 1, a - 1);
        if (a === b && e.key === "Delete" && v[a] === ".") el.setSelectionRange(a + 1, a + 1);
        // Tolak huruf/simbol yang diketik (pintasan Ctrl/Cmd tetap jalan)
        if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
        props.onKeyDown?.(e);
    };

    return (
        <div className={`relative ${wrapperClassName}`}>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span>
            <input
                {...props}
                ref={setRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                value={tampil}
                onChange={handleChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className={`w-full rounded-md border-gray-300 pl-10 shadow-sm tabular-nums focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 ${className}`}
            />
        </div>
    );
});
