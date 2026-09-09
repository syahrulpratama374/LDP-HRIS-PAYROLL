import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";

import MascotImage from "@/Assets/LoginScreen.jpg";
import LogoLDP from "@/Assets/LogoLDP.png"; 

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <>
            <Head title="Log in | LDP Portal" />

            {/* Container utama: full height */}
            <div className="min-h-screen w-full bg-white font-sans text-[#151031] flex overflow-hidden">
                
                {/* =====================================================
                    LEFT PANEL (MASCOT & BANNER) - Hidden di Mobile
                ====================================================== */}
                <div className="hidden lg:block lg:w-1/2 relative bg-[#151031]">
                    <img
                        src={MascotImage}
                        alt="Eldrim LDP Mascot"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                </div>

                {/* =====================================================
                    RIGHT PANEL (LDP BRANDING THEME) - Responsive Mobile
                ====================================================== */}
                <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
                    
                    {/* =================================================
                        DOT MATRIX BACKGROUND
                        Di mobile kita sembunyikan (hidden) atau kurangi ukurannya
                        biar nggak numpuk sama logo & form. Muncul di md ke atas.
                    ================================================== */}
                    <div className="hidden md:block absolute top-10 right-10 w-40 h-40 pointer-events-none z-0 opacity-10 text-[#623695]">
                        <svg width="100%" height="100%" fill="none" viewBox="0 0 100 100">
                            <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                                <circle cx="3" cy="3" r="3" fill="currentColor" />
                            </pattern>
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
                        </svg>
                    </div>
                    <div className="hidden md:block absolute bottom-10 left-10 w-32 h-32 pointer-events-none z-0 opacity-10 text-[#623695]">
                        <svg width="100%" height="100%" fill="none" viewBox="0 0 100 100">
                            <pattern id="dots2" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                                <circle cx="3" cy="3" r="3" fill="currentColor" />
                            </pattern>
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#dots2)" />
                        </svg>
                    </div>

                    {/* Pembungkus Form - Menggunakan min-h-screen di mobile biar bisa ditarik ke tengah */}
                    <div className="flex-1 flex items-center justify-center px-6 py-10 lg:p-12 relative z-10 min-h-screen lg:min-h-0">
                        <div className="w-full max-w-sm">
                            
                            {/* =================================================
                                HEADER & LOGO
                            ================================================== */}
                            <div className="mb-10 flex flex-col items-center text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <img 
                                        src={LogoLDP} 
                                        alt="Icon LDP" 
                                        className="h-12 w-12 sm:h-14 sm:w-14 object-contain shrink-0"
                                    />
                                    <span className="text-4xl sm:text-5xl font-black text-[#623695] tracking-tight">
                                        LDP
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-2xl sm:text-[26px] text-[#F2B300] font-['Yellowtail',_cursive]">
                                        Jadikan Satu !
                                    </span>
                                </div>
                            </div>

                            {status && (
                                <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 border border-green-100">
                                    {status}
                                </div>
                            )}

                            {/* =================================================
                                FORM LOGIN
                            ================================================== */}
                            <form onSubmit={submit} className="space-y-5 sm:space-y-6">
                                
                                {/* USERNAME */}
                                <div>
                                    <label htmlFor="username" className="block text-[11px] sm:text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">
                                        Username
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-4 text-gray-400 pointer-events-none">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <TextInput
                                            id="username"
                                            type="text"
                                            name="username"
                                            value={data.username}
                                            className="block w-full h-[48px] sm:h-[52px] pl-11 pr-4 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm focus:border-[#623695] focus:ring-1 focus:ring-[#623695] transition-all placeholder:text-gray-300"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData("username", e.target.value)}
                                            placeholder="Enter your username"
                                        />
                                    </div>
                                    <InputError message={errors.username} className="mt-1 text-red-500 text-xs ml-1" />
                                </div>

                                {/* PASSWORD */}
                                <div>
                                    <label htmlFor="password" className="block text-[11px] sm:text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">
                                        Password
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-4 text-gray-400 pointer-events-none">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                        </div>
                                        <TextInput
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={data.password}
                                            className="block w-full h-[48px] sm:h-[52px] pl-11 pr-11 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm focus:border-[#623695] focus:ring-1 focus:ring-[#623695] transition-all placeholder:text-gray-300"
                                            autoComplete="current-password"
                                            onChange={(e) => setData("password", e.target.value)}
                                            placeholder="Enter your password"
                                        />
                                        
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-0 px-3.5 flex items-center text-gray-400 hover:text-[#623695] transition-colors focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="mt-1 text-red-500 text-xs ml-1" />
                                </div>

                                {/* REMEMBER ME & FORGOT PASSWORD */}
                                <div className="flex items-center justify-between pt-1 pb-2">
                                    <label className="flex items-center cursor-pointer group ml-1">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) => setData("remember", e.target.checked)}
                                            className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-[#623695] border-gray-300 rounded shadow-sm focus:ring-[#623695]"
                                        />
                                        <span className="ml-2 text-[12px] sm:text-[13px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                                            Remember me
                                        </span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route("password.request")}
                                            className="text-[12px] sm:text-[13px] font-bold text-[#151031] hover:text-[#F2B300] transition-colors"
                                        >
                                            Forgot Password?
                                        </Link>
                                    )}
                                </div>

                                {/* SUBMIT BUTTON */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`w-full h-[48px] sm:h-[52px] flex items-center justify-center rounded-xl font-bold text-sm tracking-wide transition-all duration-300 ${
                                            processing
                                                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                                : "bg-transparent border-2 border-[#151031] text-[#151031] hover:bg-[#F2B300] hover:border-transparent hover:text-[#151031] hover:shadow-[0_8px_20px_-6px_rgba(242,179,0,0.5)] active:scale-[0.98]"
                                        }`}
                                    >
                                        {processing ? "Memproses..." : "Sign In"}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>

                    {/* Footer - Posisi absolute di bawah khusus untuk mobile biar rapi */}
                    <div className="absolute bottom-4 sm:bottom-8 w-full text-center z-10">
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 px-4">
                            &copy; {new Date().getFullYear()} PT Lintas Data Prima. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}