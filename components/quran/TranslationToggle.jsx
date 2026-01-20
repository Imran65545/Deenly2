"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function TranslationToggle({ onToggle, selectedLanguage = "en", onLanguageChange, showTransliteration = true, onTransliterationToggle }) {
    const [showTranslation, setShowTranslation] = useState(true);
    const [showTranslit, setShowTranslit] = useState(true);

    const handleToggle = () => {
        const newValue = !showTranslation;
        setShowTranslation(newValue);
        if (onToggle) onToggle(newValue);
    };

    const handleLanguageChange = (e) => {
        if (onLanguageChange) onLanguageChange(e.target.value);
    };

    const handleTransliterationToggle = () => {
        const newValue = !showTranslit;
        setShowTranslit(newValue);
        if (onTransliterationToggle) onTransliterationToggle(newValue);
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-md mb-6 flex items-center justify-center gap-4">
            {/* Translation Toggle */}
            <button
                onClick={handleToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${showTranslation
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                    }`}
            >
                {showTranslation ? <Eye size={20} /> : <EyeOff size={20} />}
                {showTranslation ? "Hide Translation" : "Show Translation"}
            </button>

            {/* Language Dropdown */}
            <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="px-4 py-2 rounded-lg border-2 border-emerald-600 text-emerald-700 font-semibold bg-white hover:bg-emerald-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ur">Urdu</option>
            </select>
        </div>
    );
}
