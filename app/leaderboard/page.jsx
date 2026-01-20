"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import Link from "next/link";

export default function Leaderboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch("/api/leaderboard");
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-20">Loading Leaderboard...</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
                    <Trophy className="text-amber-500" size={32} />
                    Global Leaderboard
                </h1>
                <p className="text-slate-600 mt-2">Top learners competing for knowledge.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-emerald-50 text-emerald-800">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Rank</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Name</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user, index) => (
                                <tr key={user._id} className="hover:bg-slate-50 transition">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {index === 0 && <Medal className="text-amber-400 mr-1 sm:mr-2" size={16} />}
                                            {index === 1 && <Medal className="text-slate-400 mr-1 sm:mr-2" size={16} />}
                                            {index === 2 && <Medal className="text-amber-700 mr-1 sm:mr-2" size={16} />}
                                            <span className={`font-medium text-sm sm:text-base ${index < 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                                                #{index + 1}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-slate-900 font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{user.name}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                        <div className="text-emerald-600 font-bold text-sm sm:text-base">{user.correctAnswers || 0}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No players yet. Be the first to join!
                    </div>
                )}
            </div>

            {/* Dashboard Button */}
            <div className="text-center mt-8">
                <Link
                    href="/dashboard"
                    className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
