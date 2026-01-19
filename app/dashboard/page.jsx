"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

const dailyHadiths = [
    {
        text: "The best of people are those who are most beneficial to people.",
        reference: "Sahih al-Bukhari"
    },
    {
        text: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
        reference: "Sahih Muslim"
    },
    {
        text: "The strong person is not the one who can overpower others, but the one who controls himself when angry.",
        reference: "Sahih al-Bukhari"
    },
    {
        text: "None of you truly believes until he loves for his brother what he loves for himself.",
        reference: "Sahih al-Bukhari"
    },
    {
        text: "The most beloved deeds to Allah are those that are most consistent, even if they are small.",
        reference: "Sahih Muslim"
    }
];

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dailyHadith, setDailyHadith] = useState(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const today = new Date().getDate();
        const hadithIndex = today % dailyHadiths.length;
        setDailyHadith(dailyHadiths[hadithIndex]);
    }, []);

    if (status === "loading") {
        return <div className="text-center mt-20">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">
                    Assalamu Alaikum, {session?.user?.name}!
                </h1>
                <p className="text-slate-600 mt-2">
                    Ready to test your knowledge today?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                {/* Start Quiz Card */}
                <Link href="/quiz">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white p-10 rounded-3xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center gap-6 border-4 border-white/20 h-full">
                        <div className="bg-white/30 p-6 rounded-full backdrop-blur-sm">
                            <Sparkles size={48} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight">Start Quiz</h2>
                        <p className="text-emerald-50 text-center text-base font-medium">
                            Challenge yourself with Islamic knowledge questions
                        </p>
                        <button className="mt-2 bg-white text-emerald-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-emerald-50 transition-all shadow-lg">
                            Begin Now →
                        </button>
                    </div>
                </Link>

                {/* Daily Hadith Card */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-10 rounded-3xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-white/20 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white/30 p-4 rounded-full backdrop-blur-sm">
                            <BookOpen size={40} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight">Daily Hadith</h2>
                    </div>

                    {dailyHadith && (
                        <div className="flex-1 flex flex-col justify-center">
                            <blockquote className="text-lg font-medium text-white/95 italic mb-4 leading-relaxed">
                                "{dailyHadith.text}"
                            </blockquote>
                            <p className="text-amber-100 text-sm font-semibold">
                                — {dailyHadith.reference}
                            </p>
                        </div>
                    )}

                    <Link href="/hadith">
                        <button className="mt-6 w-full bg-white text-amber-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-50 transition-all shadow-lg">
                            Read More Hadiths →
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
