// Quran.com API integration utilities
// Base URL for Quran.com API v4
const BASE_URL = 'https://api.quran.com/api/v4';

/**
 * Fetch all Surahs (Chapters)
 * @returns {Promise<Array>} List of all 114 Surahs
 */
export async function getSurahs() {
    try {
        const response = await fetch(`${BASE_URL}/chapters?language=en`, {
            cache: 'force-cache'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Surahs');
        }

        const data = await response.json();
        return data.chapters || [];
    } catch (error) {
        console.error('Error fetching Surahs:', error);
        return [];
    }
}

/**
 * Fetch a specific Surah with all its Ayahs
 * @param {number} surahId - Surah number (1-114)
 * @param {number} translationId - Translation ID (default: 131 for English - Sahih International)
 * @returns {Promise<Object>} Surah data with Ayahs
 */
export async function getSurahById(surahId, translationId = 20) {
    try {
        // Fetch Surah info
        const surahResponse = await fetch(`${BASE_URL}/chapters/${surahId}?language=en`, {
            cache: 'force-cache'
        });

        if (!surahResponse.ok) {
            throw new Error(`Failed to fetch Surah info: ${surahResponse.status}`);
        }

        const surahData = await surahResponse.json();

        // Fetch Arabic text
        const arabicResponse = await fetch(
            `${BASE_URL}/quran/verses/uthmani?chapter_number=${surahId}`,
            { cache: 'force-cache' }
        );

        if (!arabicResponse.ok) {
            throw new Error(`Failed to fetch Arabic text`);
        }

        const arabicData = await arabicResponse.json();

        // Fetch metadata (verse numbers, etc.)
        const metaResponse = await fetch(
            `${BASE_URL}/verses/by_chapter/${surahId}?words=false&translations=${translationId}&per_page=300`,
            { cache: 'force-cache' }
        );

        if (!metaResponse.ok) {
            throw new Error(`Failed to fetch verse metadata`);
        }

        const metaData = await metaResponse.json();

        // Fetch transliteration (optional - don't break if it fails)
        let transliterationData = { transliterations: [] };
        try {
            const transliterationResponse = await fetch(
                `${BASE_URL}/quran/transliterations/1?chapter_number=${surahId}`,
                { cache: 'force-cache' }
            );

            if (transliterationResponse.ok) {
                transliterationData = await transliterationResponse.json();
            }
        } catch (error) {
            console.warn('Transliteration fetch failed, continuing without it:', error);
        }

        // Merge Arabic text with metadata, translations, and transliteration
        const verses = (metaData.verses || []).map(verse => {
            const arabicVerse = (arabicData.verses || []).find(
                v => v.verse_key === verse.verse_key
            );
            const transliterationVerse = (transliterationData.transliterations || []).find(
                v => v.verse_key === verse.verse_key
            );

            return {
                ...verse,
                text_uthmani: arabicVerse?.text_uthmani || '',
                transliteration: transliterationVerse?.text || '',
                translations: verse.translations || []
            };
        });

        console.log('First merged verse:', verses[0]);

        return {
            surah: surahData.chapter,
            ayahs: verses
        };
    } catch (error) {
        console.error('Error fetching Surah:', error);
        return null;
    }
}

/**
 * Fetch list of all 30 Juz
 * @returns {Promise<Array>} List of all Juz (1-30)
 */
export async function getJuzList() {
    // Return exactly 30 Juz (hard-coded, non-negotiable)
    return Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        juz_number: i + 1
    }));
}

/**
 * Fetch all Ayahs in a specific Juz
 * @param {number} juzId - Juz number (1-30)
 * @param {number} translationId - Translation ID (default: 131 for English)
 * @returns {Promise<Object>} Juz data with Ayahs grouped by Surah
 */
export async function getJuzById(juzId, translationId = 20) {
    if (juzId < 1 || juzId > 30) {
        throw new Error(`Invalid Juz number: ${juzId}. Juz must be between 1 and 30.`);
    }

    try {
        // Fetch Arabic text
        const arabicResponse = await fetch(
            `${BASE_URL}/quran/verses/uthmani?juz_number=${juzId}`,
            { cache: 'force-cache' }
        );

        if (!arabicResponse.ok) {
            throw new Error('Failed to fetch Juz Arabic text');
        }

        const arabicData = await arabicResponse.json();

        // Fetch metadata with translations
        const metaResponse = await fetch(
            `${BASE_URL}/verses/by_juz/${juzId}?words=false&translations=${translationId}&per_page=300`,
            { cache: 'force-cache' }
        );

        if (!metaResponse.ok) {
            throw new Error('Failed to fetch Juz metadata');
        }

        const metaData = await metaResponse.json();

        // Fetch transliteration (optional - don't break if it fails)
        let transliterationData = { transliterations: [] };
        try {
            const transliterationResponse = await fetch(
                `${BASE_URL}/quran/transliterations/1?juz_number=${juzId}`,
                { cache: 'force-cache' }
            );

            if (transliterationResponse.ok) {
                transliterationData = await transliterationResponse.json();
            }
        } catch (error) {
            console.warn('Juz transliteration fetch failed, continuing without it:', error);
        }

        // Merge Arabic with metadata, translations, and transliteration
        const verses = (metaData.verses || []).map(verse => {
            const arabicVerse = (arabicData.verses || []).find(
                v => v.verse_key === verse.verse_key
            );
            const transliterationVerse = (transliterationData.transliterations || []).find(
                v => v.verse_key === verse.verse_key
            );

            return {
                ...verse,
                text_uthmani: arabicVerse?.text_uthmani || '',
                transliteration: transliterationVerse?.text || '',
                translations: verse.translations || []
            };
        });

        // Fetch Surahs for names
        const surahsResponse = await fetch(`${BASE_URL}/chapters?language=en`, {
            cache: 'force-cache'
        });
        const surahsData = await surahsResponse.json();
        const surahsMap = {};
        (surahsData.chapters || []).forEach(surah => {
            surahsMap[surah.id] = surah;
        });

        // Group by Surah
        const groupedBySurah = verses.reduce((acc, ayah) => {
            const surahId = ayah.verse_key.split(':')[0];
            if (!acc[surahId]) {
                const surahInfo = surahsMap[parseInt(surahId)];
                acc[surahId] = {
                    surahNumber: parseInt(surahId),
                    surahName: surahInfo ? surahInfo.name_simple : `Surah ${surahId}`,
                    surahNameArabic: surahInfo ? surahInfo.name_arabic : '',
                    ayahs: []
                };
            }
            acc[surahId].ayahs.push(ayah);
            return acc;
        }, {});

        return {
            juzNumber: juzId,
            surahs: Object.values(groupedBySurah)
        };
    } catch (error) {
        console.error('Error fetching Juz:', error);
        return null;
    }
}

/**
 * Get audio URL for a specific Ayah
 * @param {string} verseKey - Verse key (e.g., "1:1")
 * @returns {Promise<string>} Audio URL
 */
export async function getAyahAudio(verseKey) {
    // Use everyayah.com CDN - more reliable
    // Format: http://everyayah.com/data/Alafasy_128kbps/001001.mp3
    const [surah, ayah] = verseKey.split(':');
    const paddedSurah = surah.padStart(3, '0');
    const paddedAyah = ayah.padStart(3, '0');
    return `http://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`;
}

/**
 * Get audio URL and timestamps for entire Surah
 * @param {number} surahId - Surah number (1-114)
 * @param {number} reciterId - Reciter ID (default: 7 - Mishary Rashid Alafasy)
 * @returns {Promise<Object>} Object containing audio_url and timestamps
 */
export async function getSurahAudio(surahId, reciterId = 7) {
    try {
        const response = await fetch(
            `${BASE_URL}/chapter_recitations/${reciterId}/${surahId}?segments=true`,
            { cache: 'force-cache' }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch Surah audio');
        }

        const data = await response.json();
        return {
            url: data.audio_file?.audio_url || null,
            timestamps: data.audio_file?.timestamps || []
        };
    } catch (error) {
        console.error('Error fetching Surah audio:', error);
        return { url: null, timestamps: [] };
    }
}

/**
 * Get available translations
 * @returns {Promise<Array>} List of available translations
 */
export async function getTranslations() {
    try {
        const response = await fetch(`${BASE_URL}/resources/translations?language=en`, {
            cache: 'force-cache'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch translations');
        }

        const data = await response.json();
        return data.translations || [];
    } catch (error) {
        console.error('Error fetching translations:', error);
        return [
            { id: 131, name: 'Sahih International', language_name: 'english' },
            { id: 158, name: 'Hindi - Suhel Farooq Khan', language_name: 'hindi' }
        ];
    }
}
