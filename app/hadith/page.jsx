"use client";

import { useState, useEffect } from "react";
import { RefreshCw, BookOpen, Loader2, Volume2, VolumeX } from "lucide-react";

export default function HadithPage() {
    const [hadith, setHadith] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speech, setSpeech] = useState(null);

    const fetchHadith = async () => {
        setLoading(true);
        setError(null);
        stopSpeech(); // Stop any ongoing speech when fetching new hadith
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
            // Create text to read: narrator + hadith text
            let textToRead = "";
            if (hadith.header) {
                textToRead += hadith.header + ". ";
            }
            textToRead += hadith.hadith_english;

            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.rate = 0.9; // Slightly slower for better clarity
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

        // Cleanup: stop speech when component unmounts
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white">
                        <div className="flex items-center gap-4 justify-center">
                            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                <BookOpen size={48} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold">Hadith of the Day</h1>
                                <p className="text-amber-100 mt-1">Sahih al-Bukhari</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 size={48} className="text-amber-600 animate-spin mb-4" />
                                <p className="text-slate-600 text-lg">Loading hadith...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <p className="text-red-600 text-lg mb-4">{error}</p>
                                <button
                                    onClick={fetchHadith}
                                    className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : hadith ? (
                            <div className="space-y-8">
                                {/* Hadith Reference & Voice Button */}
                                <div className="flex items-center justify-between">
                                    <span className="inline-block bg-amber-200 text-amber-900 px-4 py-2 rounded-full text-sm font-bold">
                                        {hadith.refno || `Hadith #${hadith.id}`}
                                    </span>

                                    {/* Voice Button */}
                                    <button
                                        onClick={toggleSpeech}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${isPlaying
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                            }`}
                                    >
                                        {isPlaying ? (
                                            <>
                                                <VolumeX size={20} />
                                                Stop
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 size={20} />
                                                Listen
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Narrator/Header */}
                                {hadith.header && (
                                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-6">
                                        <p className="text-emerald-900 font-semibold">{hadith.header}</p>
                                    </div>
                                )}

                                {/* English Translation */}
                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-amber-100">
                                    <blockquote className="text-lg text-slate-700 leading-relaxed">
                                        {hadith.hadith_english}
                                    </blockquote>
                                </div>

                                {/* Book & Chapter Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {hadith.bookName && (
                                        <div className="bg-amber-100 rounded-xl p-6">
                                            <p className="text-sm text-amber-900 font-semibold mb-1">Book:</p>
                                            <p className="text-base text-amber-800">{hadith.bookName.trim()}</p>
                                        </div>
                                    )}
                                    {hadith.chapterName && (
                                        <div className="bg-amber-100 rounded-xl p-6">
                                            <p className="text-sm text-amber-900 font-semibold mb-1">Chapter:</p>
                                            <p className="text-base text-amber-800">{hadith.chapterName}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Next Button */}
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={fetchHadith}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                                        Generate New Hadith
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
