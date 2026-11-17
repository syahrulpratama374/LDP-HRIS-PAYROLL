import { useEffect, useRef, useState } from "react";

const WARNA_KARYAWAN = "#431D6D";
const WARNA_HADIR = "#F3B817";
const TINGGI = 280;
const MARGIN = { atas: 16, kanan: 8, bawah: 32, kiri: 32 };

// Batang dengan ujung atas membulat 4px, menempel di garis dasar
function pathBatang(x, y, w, h, r = 4) {
    if (h <= 0) return "";
    const rr = Math.min(r, w / 2, h);
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

function skalaAtas(maks) {
    if (maks <= 5) return 5;
    const kasar = Math.pow(10, Math.floor(Math.log10(maks)));
    for (const k of [1, 2, 2.5, 5, 10]) {
        if (k * kasar >= maks) return k * kasar;
    }
    return 10 * kasar;
}

/**
 * Grafik batang berkelompok: jumlah karyawan aktif (ungu) vs hadir hari ini (emas) per departemen.
 */
export default function BarChartDepartemen({ data = [] }) {
    const wadahRef = useRef(null);
    const [lebar, setLebar] = useState(640);
    const [tampil, setTampil] = useState(false);
    const [aktif, setAktif] = useState(null);

    useEffect(() => {
        const el = wadahRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setLebar(Math.max(280, e.contentRect.width)));
        ro.observe(el);
        const t = requestAnimationFrame(() => setTampil(true));
        return () => {
            ro.disconnect();
            cancelAnimationFrame(t);
        };
    }, []);

    const maks = skalaAtas(Math.max(1, ...data.map((d) => d.karyawan)));
    const lebarPlot = lebar - MARGIN.kiri - MARGIN.kanan;
    const tinggiPlot = TINGGI - MARGIN.atas - MARGIN.bawah;
    const slot = data.length ? lebarPlot / data.length : lebarPlot;
    const lebarBatang = Math.max(4, Math.min(18, (slot - 12) / 2 - 1));
    const y = (v) => MARGIN.atas + tinggiPlot - (v / maks) * tinggiPlot;
    const garisBantu = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maks * f));

    const d = aktif !== null ? data[aktif] : null;
    const xTengah = (i) => MARGIN.kiri + slot * i + slot / 2;

    return (
        <div>
            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-3">
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WARNA_KARYAWAN }} />
                    Karyawan aktif
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WARNA_HADIR }} />
                    Hadir hari ini
                </span>
            </div>

            <div ref={wadahRef} className="relative w-full" onMouseLeave={() => setAktif(null)}>
                <svg width={lebar} height={TINGGI} role="img" aria-label="Sebaran karyawan dan kehadiran per departemen" className="block">
                    {garisBantu.map((v) => (
                        <g key={v}>
                            <line x1={MARGIN.kiri} x2={lebar - MARGIN.kanan} y1={y(v)} y2={y(v)} stroke="#E2E8F0" strokeDasharray={v === 0 ? "" : "3 4"} />
                            <text x={MARGIN.kiri - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-slate-400" fontSize="10">
                                {v}
                            </text>
                        </g>
                    ))}

                    {data.map((item, i) => {
                        const x0 = xTengah(i) - lebarBatang - 1;
                        const x1 = xTengah(i) + 1;
                        const redup = aktif !== null && aktif !== i;
                        const gaya = (tunda) => ({
                            transform: tampil ? "scaleY(1)" : "scaleY(0)",
                            transformOrigin: "bottom",
                            transformBox: "fill-box",
                            transition: `transform 700ms cubic-bezier(.2,.8,.2,1) ${tunda}ms, opacity 200ms`,
                            opacity: redup ? 0.35 : 1,
                        });
                        return (
                            <g key={item.kode}>
                                {aktif === i && (
                                    <rect x={MARGIN.kiri + slot * i + 2} y={MARGIN.atas} width={slot - 4} height={tinggiPlot} rx="6" fill="#2A164E" opacity="0.04" />
                                )}
                                <path d={pathBatang(x0, y(item.karyawan), lebarBatang, y(0) - y(item.karyawan))} fill={WARNA_KARYAWAN} style={gaya(i * 40)} />
                                <path d={pathBatang(x1, y(item.hadir), lebarBatang, y(0) - y(item.hadir))} fill={WARNA_HADIR} style={gaya(i * 40 + 80)} />
                                <text x={xTengah(i)} y={TINGGI - 10} textAnchor="middle" fontSize="11" className={aktif === i ? "fill-[#2A164E] font-semibold" : "fill-slate-500"}>
                                    {item.kode}
                                </text>
                                {/* Area hover lebih besar dari batang */}
                                <rect
                                    x={MARGIN.kiri + slot * i}
                                    y={MARGIN.atas}
                                    width={slot}
                                    height={tinggiPlot + MARGIN.bawah}
                                    fill="transparent"
                                    onMouseEnter={() => setAktif(i)}
                                    onFocus={() => setAktif(i)}
                                    tabIndex={0}
                                    aria-label={`${item.nama}: ${item.karyawan} karyawan, ${item.hadir} hadir`}
                                />
                            </g>
                        );
                    })}
                </svg>

                {d && (
                    <div
                        className="pointer-events-none absolute z-10 w-52 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-xs shadow-lg"
                        style={{
                            left: Math.min(Math.max(xTengah(aktif) - 104, 0), lebar - 208),
                            top: Math.max(0, y(d.karyawan) - 96),
                        }}
                    >
                        <div className="font-semibold text-[#2A164E] mb-1.5 truncate">{d.nama}</div>
                        <div className="flex justify-between text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm" style={{ background: WARNA_KARYAWAN }} />
                                Karyawan aktif
                            </span>
                            <span className="font-semibold text-slate-800">{d.karyawan}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 mt-0.5">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm" style={{ background: WARNA_HADIR }} />
                                Hadir hari ini
                            </span>
                            <span className="font-semibold text-slate-800">{d.hadir}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                            <span>Tingkat kehadiran</span>
                            <span className="font-semibold text-slate-800">
                                {d.karyawan > 0 ? Math.round((d.hadir / d.karyawan) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
