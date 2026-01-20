"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Play, Pause, Loader2 } from "lucide-react";
import Link from "next/link";
import AyahDisplay from "@/components/quran/AyahDisplay";
import TranslationToggle from "@/components/quran/TranslationToggle";
import { getSurahAudio, getSurahById } from "@/lib/quran-api";

export default function SurahReader({ surahData: initialSurahData }) {
    const [surahData, setSurahData] = useState(initialSurahData);
    const [showTranslation, setShowTranslation] = useState(true);
    const [showTransliteration, setShowTransliteration] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [isSurahPlaying, setIsSurahPlaying] = useState(false);
    const [isSurahLoading, setIsSurahLoading] = useState(false);
    const [surahTimestamps, setSurahTimestamps] = useState([]);
    const [activeVerseKey, setActiveVerseKey] = useState(null);
    const surahAudioRef = useRef(null);
    const timestampsRef = useRef([]);

    // Update ref when state changes so event listener can access latest without re-binding
    useEffect(() => {
        timestampsRef.current = surahTimestamps;
    }, [surahTimestamps]);

    useEffect(() => {
        if (!surahAudioRef.current) {
            surahAudioRef.current = new Audio();

            surahAudioRef.current.addEventListener('ended', () => {
                setIsSurahPlaying(false);
                setActiveVerseKey(null);
            });

            surahAudioRef.current.addEventListener('timeupdate', () => {
                if (surahAudioRef.current && timestampsRef.current.length > 0) {
                    const currentTime = surahAudioRef.current.currentTime * 1000; // Convert to ms
                    const currentSegment = timestampsRef.current.find(
                        segment => currentTime >= segment.timestamp_from && currentTime <= segment.timestamp_to
                    );

                    if (currentSegment) {
                        setActiveVerseKey(currentSegment.verse_key);
                    }
                }
            });
        }

        return () => {
            if (surahAudioRef.current) {
                surahAudioRef.current.pause();
                surahAudioRef.current = null;
            }
        };
    }, []); // Run once on mount

    const handleSurahPlayPause = async () => {
        if (isSurahPlaying) {
            surahAudioRef.current?.pause();
            setIsSurahPlaying(false);
            return;
        }

        // Stop any Ayah audio
        setCurrentlyPlaying(null);
        setActiveVerseKey(null);

        setIsSurahLoading(true);

        try {
            // Check if we already have the URL and timestamps
            // Ideally we could cache this, but for now we fetch fresh
            const { url: audioUrl, timestamps } = await getSurahAudio(surahData.surah.id);

            if (!audioUrl) {
                console.error('No Surah audio URL found');
                setIsSurahLoading(false);
                return;
            }

            setSurahTimestamps(timestamps || []);

            if (surahAudioRef.current) {
                if (surahAudioRef.current.src !== audioUrl) {
                    surahAudioRef.current.src = audioUrl;
                }

                try {
                    const playPromise = surahAudioRef.current.play();
                    if (playPromise !== undefined) {
                        await playPromise;
                        setIsSurahPlaying(true);
                    }
                } catch (error) {
                    // Ignore abort errors (happens if user pauses quickly)
                    if (error.name !== 'AbortError') {
                        console.error('Playback error:', error);
                    }
                    setIsSurahPlaying(false);
                }
            }
        } catch (error) {
            console.error('Error playing Surah audio:', error);
        } finally {
            setIsSurahLoading(false);
        }
    };

    const handleAyahPlayStateChange = (verseKey) => {
        // Stop Surah audio when Ayah starts playing
        if (verseKey && isSurahPlaying) {
            surahAudioRef.current?.pause();
            setIsSurahPlaying(false);
        }
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

        // Refetch Surah data with new translation
        const newSurahData = await getSurahById(surahData.surah.id, translationId);
        if (newSurahData) {
            setSurahData(newSurahData);
        }
    };

    if (!surahData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-gray-600">Failed to load Surah</p>
            </div>
        );
    }

    const { surah, ayahs } = surahData;

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

                {/* Surah Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white text-center mb-8 shadow-xl">
                    <div className="text-4xl font-arabic mb-2">{surah.name_arabic}</div>
                    <h1 className="text-3xl font-bold mb-2">{surah.name_simple}</h1>
                    <p className="text-lg opacity-90 mb-4">{surah.translated_name.name}</p>
                    <div className="flex items-center justify-center gap-6 text-sm mb-4">
                        <span className="bg-white/20 px-4 py-2 rounded-full">
                            Surah {surah.id}
                        </span>
                        <span className="bg-white/20 px-4 py-2 rounded-full">
                            {surah.verses_count} Ayahs
                        </span>
                        <span className="bg-white/20 px-4 py-2 rounded-full">
                            {surah.revelation_place}
                        </span>
                    </div>

                    {/* Listen Button */}
                    <button
                        onClick={handleSurahPlayPause}
                        disabled={isSurahLoading}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${isSurahPlaying
                            ? 'bg-white text-emerald-600'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                            } disabled:opacity-50`}
                    >
                        {isSurahLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : isSurahPlaying ? (
                            <Pause size={20} fill="currentColor" />
                        ) : (
                            <Play size={20} fill="currentColor" />
                        )}
                        {isSurahPlaying ? 'Pause' : 'Listen'}
                    </button>
                </div>

                {/* Translation Toggle */}
                <TranslationToggle
                    onToggle={setShowTranslation}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={handleLanguageChange}
                    onTransliterationToggle={setShowTransliteration}
                />

                {/* Bismillah (except Surah 9) */}
                {surah.id !== 9 && surah.id !== 1 && (
                    <div className="text-center mb-8">
                        <p className="text-4xl font-arabic text-emerald-700">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            In the name of Allah, the Most Gracious, the Most Merciful
                        </p>
                    </div>
                )}

                {/* Ayahs */}
                <div className="space-y-4">
                    {ayahs.map((ayah) => (
                        <AyahDisplay
                            key={ayah.id}
                            ayah={ayah}
                            showTranslation={showTranslation}
                            showTransliteration={showTransliteration}
                            currentlyPlaying={currentlyPlaying}
                            onPlayStateChange={handleAyahPlayStateChange}
                            isHighlighted={activeVerseKey === ayah.verse_key}
                        />
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
