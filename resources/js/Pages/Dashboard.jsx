import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Users,
    UserCheck,
    CalendarOff,
    Wallet,
    Banknote,
    ArrowRight,
    Megaphone,
    ClipboardCheck,
    Building2,
    ShieldCheck,
    Calculator,
    CalendarClock,
    FileText,
    History,
    Plane,
    Clock,
    Layers,
    Inbox,
} from "lucide-react";
import formatRupiah from "@/Utils/formatRupiah";
import BarChartDepartemen from "@/Components/Dashboard/BarChartDepartemen";
import DonutChart from "@/Components/Dashboard/DonutChart";

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const IKON_PINTASAN = {
    "karyawan.index": Users,
    "admin.role.index": ShieldCheck,
    "admin.payroll.index": Calculator,
    "pengumuman.index": Megaphone,
    "admin.audit.index": History,
    "absensi.index": UserCheck,
    "admin.pinjaman.index": Wallet,
    "spj.menunggu": Plane,
    "admin.cuti.index": CalendarOff,
    "admin.lembur.index": Clock,
    "jadwal-shift.index": CalendarClock,
    "admin.komponen.index": Layers,
};

const IKON_JENIS = { Cuti: CalendarOff, Lembur: Clock, Kasbon: Wallet };

function sapaan() {
    const jam = new Date().getHours();
    if (jam < 11) return "Selamat pagi";
    if (jam < 15) return "Selamat siang";
    if (jam < 18) return "Selamat sore";
    return "Selamat malam";
}

function Kartu({ className = "", children }) {
    return <div className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm ${className}`}>{children}</div>;
}

function JudulKartu({ judul, sub, aksi }) {
    return (
        <div className="flex items-start justify-between gap-4 mb-5">
            <div>
                <h3 className="text-sm font-semibold text-[#2A164E]">{judul}</h3>
                {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
            </div>
            {aksi}
        </div>
    );
}

function KartuKpi({ ikon: Ikon, label, nilai, children }) {
    return (
        <Kartu className="p-5 flex flex-col">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span className="h-9 w-9 rounded-xl bg-[#2A164E]/5 text-[#431D6D] flex items-center justify-center">
                    <Ikon size={18} strokeWidth={1.75} />
                </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-[#2A164E] tracking-tight truncate" title={typeof nilai === "string" ? nilai : undefined}>
                {nilai}
            </div>
            <div className="mt-2 text-xs text-slate-500">{children}</div>
        </Kartu>
    );
}

function BadgeStatus({ status }) {
    const gaya =
        status === "Disetujui Atasan"
            ? "bg-[#F3B817]/15 text-[#7A5A00] ring-[#F3B817]/40"
            : "bg-[#2A164E]/5 text-[#431D6D] ring-[#431D6D]/15";
    return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${gaya}`}>{status}</span>;
}

function StatusPayroll({ status }) {
    const entri = Object.entries(status || {});
    if (!entri.length) return <span className="text-slate-400">Belum di-generate</span>;
    return (
        <span className="flex flex-wrap gap-1.5">
            {entri.map(([s, n]) => (
                <span
                    key={s}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        s === "Draft" ? "bg-[#F3B817]/15 text-[#7A5A00]" : "bg-[#2A164E]/5 text-[#431D6D]"
                    }`}
                >
                    {s} · {n}
                </span>
            ))}
        </span>
    );
}

export default function Dashboard({ kpi, sebaranDepartemen, komposisiPayroll, pending, jumlahPending, pengumuman, pintasan, aksiUtama, spjReimburse = null }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const namaDepan = (user.karyawan?.nama_lengkap || user.name || "").split(" ")[0];
    const tanggal = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const periodePayroll = `${NAMA_BULAN[kpi.payroll.bulan - 1]} ${kpi.payroll.tahun}`;
    const totalKomposisi = komposisiPayroll.reduce((s, k) => s + k.nilai, 0);
    const totalPending = jumlahPending.cuti + jumlahPending.lembur + jumlahPending.kasbon;

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] min-h-full">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* ===== HEADER SAPAAN ===== */}
                    <section
                        className="relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8 text-white shadow-sm"
                        style={{ background: "linear-gradient(135deg, #2A164E 0%, #431D6D 100%)" }}
                    >
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#F3B817]" />
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                                    <span>{tanggal}</span>
                                    <span className="h-1 w-1 rounded-full bg-white/40" />
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-white/90">{user.role?.nama_role ?? "Pengguna"}</span>
                                </div>
                                <h1 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight">
                                    {sapaan()}, {namaDepan}
                                </h1>
                                <p className="mt-1 text-sm text-white/70">Enterprise HRIS &amp; Network Operations Portal — PT Lintas Data Prima</p>
                            </div>
                            {aksiUtama && (
                                <Link
                                    href={aksiUtama.url}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F3B817] px-5 py-2.5 text-sm font-bold text-[#2A164E] shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                >
                                    {aksiUtama.label}
                                    <ArrowRight size={16} strokeWidth={2} />
                                </Link>
                            )}
                        </div>
                    </section>

                    {/* ===== 5 KARTU KPI ===== */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <KartuKpi ikon={Users} label="Total Karyawan Aktif" nilai={kpi.karyawan.total.toLocaleString("id-ID")}>
                            <span className="inline-flex items-center gap-1">
                                <Building2 size={12} strokeWidth={1.75} /> {kpi.karyawan.departemen} departemen
                            </span>
                        </KartuKpi>

                        <KartuKpi ikon={UserCheck} label="Kehadiran Hari Ini" nilai={kpi.kehadiran.total.toLocaleString("id-ID")}>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-[#F3B817] transition-all duration-700" style={{ width: `${Math.min(100, kpi.kehadiran.persen)}%` }} />
                                </div>
                                <span className="font-semibold text-slate-700">{kpi.kehadiran.persen}%</span>
                            </div>
                            <div className="mt-1.5 text-[11px] text-slate-400">
                                {kpi.kehadiran.hadir} hadir · {kpi.kehadiran.terlambat} terlambat · {kpi.kehadiran.dinasLuar} dinas luar
                            </div>
                        </KartuKpi>

                        <KartuKpi ikon={CalendarOff} label="Cuti & Izin Aktif" nilai={(kpi.cuti.cuti + kpi.cuti.izin).toLocaleString("id-ID")}>
                            {kpi.cuti.cuti} cuti disetujui · {kpi.cuti.izin} izin hari ini
                        </KartuKpi>

                        <KartuKpi ikon={Wallet} label="Kasbon Berjalan" nilai={kpi.kasbon.jumlah.toLocaleString("id-ID")}>
                            Sisa <span className="font-semibold text-slate-700">{formatRupiah(kpi.kasbon.sisa)}</span>
                        </KartuKpi>

                        <KartuKpi ikon={Banknote} label={kpi.payroll.bulanBerjalan ? "Payroll Bulan Ini" : "Payroll Terakhir"} nilai={formatRupiah(kpi.payroll.total)}>
                            <div className="mb-1.5 text-[11px] text-slate-400">
                                Periode {periodePayroll}
                                {!kpi.payroll.bulanBerjalan && " (bulan ini belum di-generate)"}
                            </div>
                            <StatusPayroll status={kpi.payroll.status} />
                        </KartuKpi>
                    </section>

                    {/* ===== GRAFIK ===== */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Kartu className="lg:col-span-7 p-6">
                            <JudulKartu judul="Sebaran Karyawan & Kehadiran per Departemen" sub="Karyawan aktif dibanding yang hadir (termasuk terlambat & dinas luar) hari ini" />
                            {sebaranDepartemen.length ? (
                                <BarChartDepartemen data={sebaranDepartemen} />
                            ) : (
                                <KosongKecil teks="Belum ada data departemen." />
                            )}
                        </Kartu>

                        <Kartu className="lg:col-span-5 p-6">
                            <JudulKartu judul="Komposisi Pengeluaran Payroll" sub={`Periode ${periodePayroll}`} />
                            {totalKomposisi > 0 ? (
                                <DonutChart data={komposisiPayroll} labelTotal="Total komponen" />
                            ) : (
                                <KosongKecil teks="Payroll periode ini belum di-generate." />
                            )}
                        </Kartu>
                    </section>

                    {/* ===== NOTA & SELISIH PENGINAPAN SPJ (HC, Finance, Admin) ===== */}
                    {spjReimburse && <PanelSpjReimburse data={spjReimburse} />}

                    {/* ===== OPERASIONAL & PENGUMUMAN ===== */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Kartu className="lg:col-span-7 p-6">
                            <JudulKartu
                                judul="Menunggu Persetujuan"
                                sub={`${totalPending} pengajuan · ${jumlahPending.cuti} cuti, ${jumlahPending.lembur} lembur, ${jumlahPending.kasbon} kasbon`}
                                aksi={
                                    <span className="h-9 w-9 rounded-xl bg-[#2A164E]/5 text-[#431D6D] flex items-center justify-center">
                                        <ClipboardCheck size={18} strokeWidth={1.75} />
                                    </span>
                                }
                            />
                            {pending.length ? (
                                <div className="-mx-6 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-400">
                                                <th className="px-6 py-2.5 font-medium">Karyawan</th>
                                                <th className="px-3 py-2.5 font-medium">Pengajuan</th>
                                                <th className="px-3 py-2.5 font-medium">Status</th>
                                                <th className="px-6 py-2.5" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {pending.map((p) => {
                                                const Ikon = IKON_JENIS[p.jenis] ?? FileText;
                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <div className="font-medium text-slate-800 truncate max-w-[180px]">{p.nama}</div>
                                                            <div className="text-[11px] text-slate-400">{p.departemen}</div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                                <Ikon size={14} strokeWidth={1.75} className="text-[#431D6D]" />
                                                                {p.jenis}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 whitespace-nowrap">{p.detail}</div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <BadgeStatus status={p.status} />
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            {p.url ? (
                                                                <Link href={p.url} className="text-xs font-semibold text-[#431D6D] hover:text-[#2A164E] whitespace-nowrap">
                                                                    Tinjau →
                                                                </Link>
                                                            ) : (
                                                                <span className="text-xs text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <KosongKecil teks="Tidak ada pengajuan yang menunggu persetujuan." />
                            )}
                        </Kartu>

                        <Kartu className="lg:col-span-5 p-6 flex flex-col">
                            <JudulKartu judul="Pengumuman Perusahaan" sub="Informasi aktif untuk Anda" />
                            {pengumuman.length ? (
                                <ul className="space-y-3">
                                    {pengumuman.map((p) => (
                                        <li key={p.id} className="border-l-2 border-[#F3B817] pl-3">
                                            <div className="text-sm font-medium text-slate-800">{p.judul}</div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{p.konten}</p>
                                            <div className="text-[11px] text-slate-400 mt-1">
                                                s.d. {new Date(p.tgl_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <KosongKecil teks="Belum ada pengumuman aktif." />
                            )}

                            {pintasan.length > 0 && (
                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    <div className="text-xs font-semibold text-[#2A164E] mb-3">Akses Cepat</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {pintasan.map((s) => {
                                            const Ikon = IKON_PINTASAN[s.kunci] ?? FileText;
                                            return (
                                                <Link
                                                    key={s.kunci}
                                                    href={s.url}
                                                    className="group flex items-center gap-2.5 rounded-xl border border-slate-200/70 px-3 py-2.5 text-sm text-slate-700 transition hover:border-[#431D6D]/30 hover:bg-[#2A164E]/[0.03]"
                                                >
                                                    <span className="h-8 w-8 shrink-0 rounded-lg bg-[#2A164E]/5 text-[#431D6D] flex items-center justify-center group-hover:bg-[#431D6D] group-hover:text-white transition">
                                                        <Ikon size={16} strokeWidth={1.75} />
                                                    </span>
                                                    <span className="truncate font-medium">{s.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Kartu>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

function PanelSpjReimburse({ data }) {
    return (
        <Kartu className="p-6">
            <JudulKartu
                judul="SPJ: Nota & Selisih Penginapan"
                sub={`Tahun ${data.tahun} · ${data.peringatanTahunIni} peringatan (di atas tarif), ${data.infoTahunIni} info (di bawah tarif)`}
                aksi={
                    <Link href={data.urlRekap} className="text-xs font-semibold text-[#431D6D] hover:text-[#2A164E] whitespace-nowrap">
                        Rekap per provinsi →
                    </Link>
                }
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Link
                    href={data.urlDaftar}
                    className="lg:col-span-3 rounded-xl border border-slate-200/70 p-4 hover:border-[#431D6D]/30 transition"
                >
                    <div className="text-xs text-slate-500">Nota menunggu validasi Finance</div>
                    <div className={`text-3xl font-bold mt-1 ${data.notaMenunggu > 0 ? "text-amber-600" : "text-slate-800"}`}>{data.notaMenunggu}</div>
                </Link>
                <div className="lg:col-span-9">
                    <div className="text-xs font-semibold text-[#2A164E] mb-2">Peringatan terbaru: nota penginapan di atas tarif</div>
                    {data.peringatanTerbaru.length ? (
                        <ul className="divide-y divide-slate-100 text-sm">
                            {data.peringatanTerbaru.map((k) => (
                                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                    <div>
                                        <span className="font-medium text-slate-800">{k.peserta}</span>
                                        <span className="text-slate-400"> · {k.provinsi} · {k.kategori_tarif}</span>
                                        <div className="text-[11px] text-slate-400">
                                            {formatRupiah(k.nota_per_malam)}/malam vs tarif {formatRupiah(k.tarif_per_malam)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-red-700">+{k.persen}%</span>
                                        <Link href={route("spj.show", k.spj_id)} className="text-xs font-semibold text-[#431D6D] hover:text-[#2A164E] whitespace-nowrap">
                                            {k.nomor_surat ?? "Lihat"} →
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <KosongKecil teks="Belum ada nota penginapan di atas tarif." />
                    )}
                </div>
            </div>
        </Kartu>
    );
}

function KosongKecil({ teks }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
            <Inbox size={28} strokeWidth={1.5} />
            <p className="mt-2 text-xs">{teks}</p>
        </div>
    );
}
