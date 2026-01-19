"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
            <div className={`space-y-4 max-w-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                    Master Your <span className="text-emerald-600">Deen</span>
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                    Test your knowledge of Islam with authentic quizzes. Compete on the global leaderboard, earn rewards, and learn something new every day.
                </p>
            </div>

            <div className={`flex flex-wrap gap-4 justify-center transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Link
                    href={session ? "/dashboard" : "/register"}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                >
                    {session ? "Quiz" : "Start Quiz"} <ArrowRight size={20} />
                </Link>
                <Link
                    href="/leaderboard"
                    className="bg-white text-slate-700 border border-slate-300 px-8 py-3 rounded-full font-semibold hover:bg-slate-50 transition"
                >
                    View Leaderboard
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left max-w-5xl">
                <FeatureCard
                    title="Authentic Content"
                    description="Every question is verified and sourced from authentic Islamic texts and scholars."
                    icon="📚"
                    delay="delay-300"
                    isVisible={isVisible}
                />
                <FeatureCard
                    title="Global Competition"
                    description="See where you stand among thousands of other learners around the world."
                    icon="🏆"
                    delay="delay-500"
                    isVisible={isVisible}
                />
                <FeatureCard
                    title="Topic-Based Quizzes"
                    description="Focus your learning on specific topics like Namaz, Seerah, Quran, and more."
                    icon="🎯"
                    delay="delay-700"
                    isVisible={isVisible}
                />
            </div>
        </div>
    );
}

function FeatureCard({ title, description, icon, delay, isVisible }) {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-1000 ${delay} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    );
}
