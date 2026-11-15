import React from "react";

export default function BannerHeader({ subtitle = "LDP HRIS", title }) {
    return (
        <section className="bg-white border-b border-gray-200 mb-6 md:mb-8">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#431D6D] mb-1">
                    {subtitle}
                </p>
                <h1 className="text-2xl font-bold text-[#2A164E]">
                    {title}
                </h1>
            </div>
        </section>
    );
}