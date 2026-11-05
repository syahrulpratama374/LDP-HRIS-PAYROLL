import React from "react";

export default function BannerHeader({ subtitle = "LDP HRIS", title }) {
    return (
        // Menambahkan h-16 agar tingginya sama persis dengan tinggi header sidebar (64px)
        <section className="bg-[#2A164E] -mt-6 -mx-6 md:-mt-8 md:-mx-8 mb-6 md:mb-8 h-16 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-[1600px] px-4 text-center flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F3B817] leading-none mb-1">
                    {subtitle}
                </p>
                <h1 className="text-lg font-bold text-white sm:text-xl leading-none">
                    {title}
                </h1>
            </div>
        </section>
    );
}