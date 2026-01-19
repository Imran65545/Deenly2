"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Award, RefreshCcw } from "lucide-react";

export default function Result() {
    const searchParams = useSearchParams();
    const score = searchParams.get("score");
    const total = searchParams.get("total");
    const router = useRouter();

    if (!score || !total) {
        return <div className="text-center mt-20">Invalid result data.</div>;
    }

    const percentage = (parseInt(score) / parseInt(total)) * 100;
    let message = "";
    if (percentage >= 80) message = "Ma shaa Allah! Excellent work!";
    else if (percentage >= 50) message = "Good effort! Keep learning.";
    else message = "Alhamdulillah. Keep trying to improve.";

    return (
        <div className="max-w-md mx-auto mt-20 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                    <Award size={48} />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">Quiz Completed!</h1>
                <p className="text-lg text-slate-600 mb-8">{message}</p>

                <div className="bg-slate-50 p-6 rounded-xl mb-8">
                    <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Your Score</p>
                    <p className="text-5xl font-extrabold text-emerald-600 mt-2">
                        {score} <span className="text-2xl text-slate-400 font-medium">/ {total}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/dashboard"
                        className="block w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                    >
                        Back to Dashboard
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="block w-full bg-white text-emerald-600 border border-emerald-600 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
                    >
                        View Leaderboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
