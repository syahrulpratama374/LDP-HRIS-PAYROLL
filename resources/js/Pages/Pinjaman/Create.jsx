{/* CONTENT */}
<div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
    {/* MAIN CARD */}
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {/* CARD HEADER */}
        <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-base font-bold text-[#2A164E]">
                Lengkapi Data Kasbon
            </h2>
        </div>

        <form onSubmit={submit}>
            <div className="space-y-5 p-5">
                {/* PENGAJUAN KASBON */}
                <div>
                    <h3 className="mb-3 text-sm font-bold text-[#431D6D]">
                        Pengajuan Kasbon
                    </h3>

                    <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        {/* NOMINAL */}
                        <div>
                            <label
                                htmlFor="total_pinjaman"
                                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                            >
                                Nominal Pinjaman{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                                    Rp
                                </span>

                                <input
                                    id="total_pinjaman"
                                    type="number"
                                    value={data.total_pinjaman}
                                    onChange={(e) =>
                                        setData(
                                            "total_pinjaman",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 1000000"
                                    min="50000"
                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                    required
                                />
                            </div>

                            {errors.total_pinjaman && (
                                <p className="mt-1 text-xs font-semibold text-red-500">
                                    {errors.total_pinjaman}
                                </p>
                            )}

                            <p className="mt-1 text-[10px] text-gray-400">
                                Minimal Rp 50.000
                            </p>
                        </div>

                        {/* TENOR */}
                        <div>
                            <label
                                htmlFor="tenor_bulan"
                                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500"
                            >
                                Tenor Cicilan{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <select
                                id="tenor_bulan"
                                value={data.tenor_bulan}
                                onChange={(e) =>
                                    setData(
                                        "tenor_bulan",
                                        e.target.value,
                                    )
                                }
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#431D6D] focus:ring-1 focus:ring-[#431D6D]/20"
                                required
                            >
                                <option value="1">1 Bulan</option>
                                <option value="2">2 Bulan</option>
                                <option value="3">3 Bulan</option>
                                <option value="6">6 Bulan</option>
                                <option value="12">12 Bulan</option>
                            </select>

                            {errors.tenor_bulan && (
                                <p className="mt-1 text-xs font-semibold text-red-500">
                                    {errors.tenor_bulan}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ESTIMASI CICILAN */}
                {data.total_pinjaman && (
                    <div>
                        <h3 className="mb-3 text-sm font-bold text-[#431D6D]">
                            Estimasi Cicilan
                        </h3>

                        <div className="flex items-center justify-between rounded-lg border border-[#F3B817]/30 bg-[#F3B817]/10 px-4 py-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                    Potongan / Bulan
                                </p>

                                <p className="mt-0.5 text-lg font-extrabold text-[#2A164E]">
                                    Rp{" "}
                                    {estimasiCicilan.toLocaleString("id-ID")}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                    Tenor
                                </p>

                                <p className="mt-0.5 text-sm font-bold text-[#431D6D]">
                                    {data.tenor_bulan} Bulan
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-3">
                <Link
                    href={route("pinjaman.index")}
                    className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    Batal
                </Link>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg bg-[#2A164E] px-6 text-sm font-semibold text-white transition hover:bg-[#431D6D] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {processing ? "Memproses..." : "Kirim Pengajuan"}
                </button>
            </div>
        </form>
    </div>
</div>