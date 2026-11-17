import { useEffect, useState } from "react";
import formatRupiah from "@/Utils/formatRupiah";

// Urutan warna disusun agar dua ungu tidak bersebelahan (lebih mudah dibedakan)
const WARNA = ["#2A164E", "#F3B817", "#431D6D", "#CBD5E1"];
const R = 70;
const TEBAL = 22;
const KELILING = 2 * Math.PI * R;
const CELAH = 2;

function ringkas(n) {
    if (n >= 1e9) return `Rp ${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    if (n >= 1e6) return `Rp ${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
    return formatRupiah(n);
}

/**
 * Grafik donat komposisi; data: [{ kunci, label, nilai }]
 */
export default function DonutChart({ data = [], labelTotal = "Total" }) {
    const [tampil, setTampil] = useState(false);
    const [aktif, setAktif] = useState(null);

    useEffect(() => {
        const t = requestAnimationFrame(() => setTampil(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const total = data.reduce((s, d) => s + d.nilai, 0);
    const jumlahIsi = data.filter((d) => d.nilai > 0).length;

    let offset = 0;
    const segmen = data.map((d, i) => {
        const panjang = total > 0 ? (d.nilai / total) * KELILING : 0;
        const s = { ...d, warna: WARNA[i % WARNA.length], panjang, offset, persen: total > 0 ? (d.nilai / total) * 100 : 0 };
        offset += panjang;
        return s;
    });

    const fokus = aktif !== null ? segmen[aktif] : null;

    return (
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
            <div className="relative shrink-0" onMouseLeave={() => setAktif(null)}>
                <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Komposisi pengeluaran payroll">
                    <g transform="rotate(-90 95 95)">
                        <circle cx="95" cy="95" r={R} fill="none" stroke="#F1F5F9" strokeWidth={TEBAL} />
                        {segmen.map((s, i) => {
                            if (s.panjang <= 0) return null;
                            const tampak = Math.max(0, s.panjang - (jumlahIsi > 1 ? CELAH : 0));
                            return (
                                <circle
                                    key={s.kunci}
                                    cx="95"
                                    cy="95"
                                    r={R}
                                    fill="none"
                                    stroke={s.warna}
                                    strokeWidth={aktif === i ? TEBAL + 6 : TEBAL}
                                    strokeDasharray={`${tampil ? tampak : 0} ${KELILING}`}
                                    strokeDashoffset={-s.offset}
                                    style={{
                                        transition: "stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1), stroke-width 150ms, opacity 150ms",
                                        opacity: aktif !== null && aktif !== i ? 0.35 : 1,
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={() => setAktif(i)}
                                />
                            );
                        })}
                    </g>
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-tight">
                        {fokus ? fokus.label : labelTotal}
                    </span>
                    <span className="text-base font-bold text-[#2A164E] mt-0.5">{ringkas(fokus ? fokus.nilai : total)}</span>
                    {fokus && <span className="text-[11px] text-slate-500">{fokus.persen.toFixed(1)}%</span>}
                </div>
            </div>

            <ul className="w-full space-y-2.5">
                {segmen.map((s, i) => (
                    <li
                        key={s.kunci}
                        onMouseEnter={() => setAktif(i)}
                        onMouseLeave={() => setAktif(null)}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors ${aktif === i ? "bg-slate-50" : ""}`}
                    >
                        <span className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.warna }} />
                            <span className="truncate">{s.label}</span>
                        </span>
                        <span className="text-right shrink-0">
                            <span className="block text-xs font-semibold text-slate-800">{formatRupiah(s.nilai)}</span>
                            <span className="block text-[10px] text-slate-400">{s.persen.toFixed(1)}%</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
