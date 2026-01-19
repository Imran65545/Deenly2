"use client";

import { useState, useEffect } from "react";
import { RefreshCw, BookOpen, Loader2, Volume2, VolumeX } from "lucide-react";

export default function HadithPage() {
    const [hadith, setHadith] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speech, setSpeech] = useState(null);
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const fetchHadith = async () => {
        setLoading(true);
        setError(null);
        setTranslatedText(null); // Reset translation on new hadith
        stopSpeech();
        try {
            const response = await fetch("https://random-hadith-generator.vercel.app/bukhari/");
            if (!response.ok) throw new Error("Failed to fetch hadith");
            const result = await response.json();
            setHadith(result.data);
        } catch (err) {
            setError("Failed to load hadith. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTranslate = async () => {
        if (!hadith?.hadith_english) return;

        setIsTranslating(true);
        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: hadith.hadith_english })
            });

            if (!res.ok) throw new Error("Translation failed");

            const data = await res.json();
            setTranslatedText(data.translatedText);
        } catch (error) {
            console.error(error);
            alert("Failed to translate. Please try again.");
        } finally {
            setIsTranslating(false);
        }
    };

    const stopSpeech = () => {
        if (speech) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }
    };

    const toggleSpeech = () => {
        if (!hadith) return;

        if (isPlaying) {
            stopSpeech();
        } else {
            let textToRead = "";
            if (hadith.header) {
                textToRead += hadith.header + ". ";
            }
            textToRead += hadith.hadith_english;

            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            utterance.onend = () => {
                setIsPlaying(false);
            };

            utterance.onerror = () => {
                setIsPlaying(false);
            };

            setSpeech(utterance);
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        fetchHadith();

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-3xl w-full">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-6 md:p-8 text-white">
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center text-center sm:text-left">
                            <div className="bg-white/20 p-3 sm:p-4 rounded-full backdrop-blur-sm">
                                <BookOpen size={36} className="sm:w-12 sm:h-12" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">Hadith of the Day</h1>
                                <p className="text-amber-100 mt-1 text-sm sm:text-base">Sahih al-Bukhari</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 md:p-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                                <Loader2 size={48} className="text-amber-600 animate-spin mb-4" />
                                <p className="text-slate-600 text-base sm:text-lg">Loading hadith...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-16 sm:py-20">
                                <p className="text-red-600 text-base sm:text-lg mb-4">{error}</p>
                                <button
                                    onClick={fetchHadith}
                                    className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : hadith ? (
                            <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                {/* Hadith Reference & Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                                    <span className="inline-block bg-amber-200 text-amber-900 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-center">
                                        {hadith.refno || `Hadith #${hadith.id}`}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {/* Translate Button */}
                                        <button
                                            onClick={handleTranslate}
                                            disabled={isTranslating}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full text-sm font-semibold transition flex items-center gap-2"
                                        >
                                            {isTranslating ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <span className="text-lg">文A</span>
                                            )}
                                            {isTranslating ? "Translating..." : "Translate to Hindi"}
                                        </button>

                                        {/* Voice Button */}
                                        <button
                                            onClick={toggleSpeech}
                                            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold transition-all shadow-lg text-sm sm:text-base ${isPlaying
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                }`}
                                        >
                                            {isPlaying ? (
                                                <>
                                                    <VolumeX size={18} className="sm:w-5 sm:h-5" />
                                                    <span className="hidden sm:inline">Stop</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 size={18} className="sm:w-5 sm:h-5" />
                                                    <span className="hidden sm:inline">Listen</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Narrator/Header */}
                                {hadith.header && (
                                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4 sm:p-6">
                                        <p className="text-emerald-900 font-semibold text-sm sm:text-base break-words">{hadith.header}</p>
                                    </div>
                                )}

                                {/* English Translation */}
                                <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm border border-amber-100">
                                    <blockquote className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                                        {hadith.hadith_english}
                                    </blockquote>
                                </div>

                                {/* Hindi Translation Display */}
                                {translatedText && (
                                    <div className="bg-indigo-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <h3 className="text-indigo-900 font-bold mb-3 flex items-center gap-2">
                                            <span>🇮🇳</span> Hindi Translation
                                        </h3>
                                        <blockquote className="text-base sm:text-lg md:text-xl text-indigo-900 leading-relaxed break-words whitespace-pre-wrap font-medium">
                                            {translatedText}
                                        </blockquote>
                                    </div>
                                )}

                                {/* Book & Chapter Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {hadith.bookName && (
                                        <div className="bg-amber-100 rounded-lg sm:rounded-xl p-4 sm:p-6">
                                            <p className="text-xs sm:text-sm text-amber-900 font-semibold mb-1">Book:</p>
                                            <p className="text-sm sm:text-base text-amber-800 break-words">{hadith.bookName.trim()}</p>
                                        </div>
                                    )}
                                    {hadith.chapterName && (
                                        <div className="bg-amber-100 rounded-lg sm:rounded-xl p-4 sm:p-6">
                                            <p className="text-xs sm:text-sm text-amber-900 font-semibold mb-1">Chapter:</p>
                                            <p className="text-sm sm:text-base text-amber-800 break-words">{hadith.chapterName}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Next Button */}
                                <div className="flex justify-center pt-2 sm:pt-4">
                                    <button
                                        onClick={fetchHadith}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sm:gap-3"
                                    >
                                        <RefreshCw size={20} className={`sm:w-6 sm:h-6 ${loading ? "animate-spin" : ""}`} />
                                        <span className="hidden sm:inline">Generate New Hadith</span>
                                        <span className="sm:hidden">New Hadith</span>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
