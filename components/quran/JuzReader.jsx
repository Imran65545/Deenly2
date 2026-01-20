"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AyahDisplay from "@/components/quran/AyahDisplay";
import TranslationToggle from "@/components/quran/TranslationToggle";
import { getJuzById } from "@/lib/quran-api";

export default function JuzReader({ juzData: initialJuzData }) {
    const [juzData, setJuzData] = useState(initialJuzData);
    const [showTranslation, setShowTranslation] = useState(true);
    const [showTransliteration, setShowTransliteration] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

    const handleAyahPlayStateChange = (verseKey) => {
        setCurrentlyPlaying(verseKey);
    };

    const handleLanguageChange = async (language) => {
        setSelectedLanguage(language);

        // Translation ID mapping
        const translationIds = {
            en: 20,  // English - Saheeh International
            hi: 122, // Hindi
            ur: 97   // Urdu - Maududi
        };

        const translationId = translationIds[language];

        // Refetch Juz data with new translation
        const newJuzData = await getJuzById(juzData.juzNumber, translationId);
        if (newJuzData) {
            setJuzData(newJuzData);
        }
    };

    if (!juzData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-gray-600">Failed to load Juz</p>
            </div>
        );
    }

    const { juzNumber, surahs } = juzData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    href="/quran"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-6"
                >
                    <ArrowLeft size={20} />
                    Back to Quran
                </Link>

                {/* Juz Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 text-white text-center mb-8 shadow-xl">
                    <div className="text-sm font-semibold mb-2 opacity-90">JUZ / PARA</div>
                    <h1 className="text-5xl font-bold mb-2">{juzNumber}</h1>
                    <p className="text-lg opacity-90">
                        {surahs.length} Surah{surahs.length > 1 ? 's' : ''} in this Juz
                    </p>
                </div>

                {/* Translation Toggle */}
                <TranslationToggle
                    onToggle={setShowTranslation}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={handleLanguageChange}
                />

                {/* Surahs in Juz */}
                <div className="space-y-8">
                    {surahs.map((surahGroup) => (
                        <div key={surahGroup.surahNumber}>
                            {/* Surah Header */}
                            <div className="bg-emerald-100 rounded-xl p-4 mb-4 border-l-4 border-emerald-600 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-800">
                                        {surahGroup.surahName}
                                    </h2>
                                    <p className="text-sm text-emerald-600">Surah {surahGroup.surahNumber}</p>
                                </div>
                                {surahGroup.surahNameArabic && (
                                    <div className="text-2xl font-arabic text-emerald-700">
                                        {surahGroup.surahNameArabic}
                                    </div>
                                )}
                            </div>

                            {/* Ayahs */}
                            <div className="space-y-4">
                                {surahGroup.ayahs.map((ayah) => (
                                    <AyahDisplay
                                        key={ayah.id}
                                        ayah={ayah}
                                        showTranslation={showTranslation}
                                        showTransliteration={showTransliteration}
                                        currentlyPlaying={currentlyPlaying}
                                        onPlayStateChange={handleAyahPlayStateChange}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Attribution */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>Powered by Quran.com</p>
                </div>
            </div>
        </div>
    );
}
