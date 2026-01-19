"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <nav className="bg-emerald-600 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/deenly-logo-removebg-preview.png"
                            alt="Deenly"
                            width={350}
                            height={80}
                            className="h-28 w-auto"
                            priority
                        />
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/"
                            className={`hover:text-emerald-200 transition pb-1 ${isActive('/') ? 'border-b-2 border-white font-semibold' : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/leaderboard"
                            className={`hover:text-emerald-200 transition pb-1 ${isActive('/leaderboard') ? 'border-b-2 border-white font-semibold' : ''}`}
                        >
                            Leaderboard
                        </Link>
                        {session ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`hover:text-emerald-200 transition pb-1 ${isActive('/dashboard') ? 'border-b-2 border-white font-semibold' : ''}`}
                                >
                                    Dashboard
                                </Link>
                                {session.user.role === "admin" && (
                                    <Link
                                        href="/admin"
                                        className={`hover:text-emerald-200 transition pb-1 ${isActive('/admin') ? 'border-b-2 border-white font-semibold' : ''}`}
                                    >
                                        Admin
                                    </Link>
                                )}
                                <div className="flex items-center gap-4">
                                    <span className="text-sm bg-emerald-700 px-3 py-1 rounded-full">
                                        {session.user.name}
                                    </span>
                                    <button
                                        onClick={() => signOut()}
                                        className="bg-white text-emerald-600 px-4 py-2 rounded-md hover:bg-emerald-100 transition font-medium text-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="hover:text-emerald-200 transition">
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-white text-emerald-600 px-4 py-2 rounded-md hover:bg-emerald-100 transition font-medium text-sm"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(true)} className="p-2">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[998] md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed top-0 right-0 w-full h-full bg-white z-[999] transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full overflow-y-auto">
                    <div className="sticky top-0 bg-white z-10 flex justify-between items-center h-16 px-6 border-b border-gray-200">
                        <span className="text-xl font-bold text-gray-900">Menu</span>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X size={24} className="text-gray-900" />
                        </button>
                    </div>

                    <div className="flex-1 px-6 py-6">
                        {session && (
                            <div className="mb-8">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
                                    <p className="text-base font-semibold text-emerald-700">{session.user.name}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mb-8">
                            <Link
                                href="/"
                                className={`block py-3 px-4 rounded-lg text-base font-medium transition ${isActive('/') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/leaderboard"
                                className={`block py-3 px-4 rounded-lg text-base font-medium transition ${isActive('/leaderboard') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                Leaderboard
                            </Link>
                            {session && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className={`block py-3 px-4 rounded-lg text-base font-medium transition ${isActive('/dashboard') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    {session.user.role === "admin" && (
                                        <Link
                                            href="/admin"
                                            className={`block py-3 px-4 rounded-lg text-base font-medium transition ${isActive('/admin') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Admin
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            {session ? (
                                <button
                                    onClick={() => {
                                        signOut();
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-red-600 text-center py-3 px-4 rounded-lg font-medium hover:bg-red-50 transition"
                                >
                                    Logout
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/register"
                                        className="w-full bg-emerald-600 text-white text-center py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="w-full border-2 border-emerald-600 text-emerald-600 text-center py-3 px-4 rounded-lg font-semibold hover:bg-emerald-50 transition"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Login
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
