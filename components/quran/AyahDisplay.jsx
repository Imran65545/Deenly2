"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { getAyahAudio } from "@/lib/quran-api";

export default function AyahDisplay({ ayah, showTranslation = true, showTransliteration = true, currentlyPlaying, onPlayStateChange, isHighlighted }) {
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef(null);
    const containerRef = useRef(null);
    const isPlaying = currentlyPlaying === ayah.verse_key;
    const isActive = isPlaying || isHighlighted;

    useEffect(() => {
        if (isHighlighted && containerRef.current) {
            containerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [isHighlighted]);

    // Debug: Log ayah data
    useEffect(() => {
        if (ayah.verse_number === 1) {
            console.log('First Ayah data:', {
                verse_key: ayah.verse_key,
                text_uthmani: ayah.text_uthmani?.substring(0, 50),
                translations: ayah.translations
            });
        }
    }, [ayah]);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.addEventListener('ended', () => {
                onPlayStateChange(null);
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handlePlayPause = async (e) => {
        e.stopPropagation();

        if (isPlaying) {
            audioRef.current?.pause();
            onPlayStateChange(null);
            return;
        }

        setIsLoading(true);

        try {
            const audioUrl = await getAyahAudio(ayah.verse_key);

            if (!audioUrl) {
                console.error('No audio URL found');
                setIsLoading(false);
                return;
            }

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                await audioRef.current.play();
                onPlayStateChange(ayah.verse_key);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isPlaying && audioRef.current) {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    const hasTranslation = ayah.translations && ayah.translations.length > 0;

    return (
        <div
            ref={containerRef}
            className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 mb-4 ${isActive ? 'border-emerald-800 bg-emerald-50 ring-4 ring-emerald-200' : 'border-emerald-500'
                }`}
        >
            {/* Arabic Text */}
            <div className="text-right mb-4">
                <p className="text-3xl leading-loose font-arabic text-gray-800" dir="rtl">
                    {ayah.text_uthmani}
                    <span className="inline-flex items-center gap-2 mr-2">
                        <button
                            onClick={handlePlayPause}
                            disabled={isLoading}
                            className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-full text-emerald-700 flex items-center justify-center transition-colors disabled:opacity-50"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : isPlaying ? (
                                <Pause size={14} fill="currentColor" />
                            ) : (
                                <Play size={14} fill="currentColor" className="ml-0.5" />
                            )}
                        </button>
                        <span className="inline-block w-8 h-8 bg-emerald-100 rounded-full text-emerald-700 text-sm font-sans text-center leading-8">
                            {ayah.verse_number}
                        </span>
                    </span>
                </p>
            </div>

            {/* Transliteration */}
            {showTransliteration && ayah.transliteration && (
                <div className="mt-3 pt-3">
                    <p className="text-gray-600 text-base italic leading-relaxed">
                        {ayah.transliteration}
                    </p>
                </div>
            )}

            {/* Translation */}
            {showTranslation && hasTranslation && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-gray-700 text-xl leading-relaxed font-medium">
                        {ayah.translations[0].text.replace(/<[^>]*>/g, '')}
                    </p>
                    {ayah.translations[0].resource_name && (
                        <p className="text-xs text-gray-500 mt-2">
                            — {ayah.translations[0].resource_name}
                        </p>
                    )}
                </div>
            )}

            {/* Debug: Show if no translation */}
            {showTranslation && !hasTranslation && (
                <div className="border-t border-red-200 pt-4 mt-4">
                    <p className="text-red-500 text-sm">No translation available</p>
                </div>
            )}
        </div>
    );
}
