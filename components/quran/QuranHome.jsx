"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, List } from "lucide-react";

export default function QuranHome({ surahs, juzs }) {
    const [activeTab, setActiveTab] = useState("surah");

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-emerald-800 mb-2">القرآن الكريم</h1>
                    <h2 className="text-2xl font-semibold text-gray-700">The Holy Quran</h2>
                    <p className="text-emerald-100 text-sm">
                        Source: Quran.com
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-full p-1 shadow-md inline-flex">
                        <button
                            onClick={() => setActiveTab("surah")}
                            className={`px-8 py-3 rounded-full font-semibold transition-all ${activeTab === "surah"
                                ? "bg-emerald-600 text-white shadow-lg"
                                : "text-gray-600 hover:text-emerald-600"
                                }`}
                        >
                            <BookOpen className="inline mr-2" size={20} />
                            Surah
                        </button>
                        <button
                            onClick={() => setActiveTab("juz")}
                            className={`px-8 py-3 rounded-full font-semibold transition-all ${activeTab === "juz"
                                ? "bg-emerald-600 text-white shadow-lg"
                                : "text-gray-600 hover:text-emerald-600"
                                }`}
                        >
                            <List className="inline mr-2" size={20} />
                            Juz (Para)
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === "surah" ? (
                    <SurahList surahs={surahs} />
                ) : (
                    <JuzList juzs={juzs} />
                )}
            </div>
        </div>
    );
}

function SurahList({ surahs }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surahs.map((surah) => (
                <Link
                    key={surah.id}
                    href={`/quran/surah/${surah.id}`}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500 group"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    {surah.id}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                        {surah.name_simple}
                                    </h3>
                                    <p className="text-sm text-gray-500">{surah.translated_name.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                                <span className="bg-gray-100 px-3 py-1 rounded-full">
                                    {surah.verses_count} Ayahs
                                </span>
                                <span className="bg-gray-100 px-3 py-1 rounded-full">
                                    {surah.revelation_place}
                                </span>
                            </div>
                        </div>
                        <div className="text-3xl font-arabic text-emerald-700">
                            {surah.name_arabic}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function JuzList({ juzs }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {juzs.map((juz) => (
                <Link
                    key={juz.id}
                    href={`/quran/juz/${juz.id}`}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
                >
                    <div className="text-center">
                        <div className="text-white text-sm font-semibold mb-2">Juz / Para</div>
                        <div className="text-5xl font-bold text-white mb-2">{juz.id}</div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
