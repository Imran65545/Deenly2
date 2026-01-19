"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Lightbulb, Loader2 } from "lucide-react";

function QuizContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [hint, setHint] = useState("");
    const [hintLoading, setHintLoading] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [lang, setLang] = useState("en"); // "en" or "hi"
    const [showWelcomeModal, setShowWelcomeModal] = useState(true);
    const [totalQuestionsAttempted, setTotalQuestionsAttempted] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        fetchQuestions();
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            const res = await fetch('/api/user/stats');
            if (res.ok) {
                const data = await res.json();
                setTotalQuestionsAttempted(data.totalQuestionsAttempted || 0);
            }
        } catch (error) {
            console.error("Error fetching user stats:", error);
        }
    };

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/quiz/start${category ? `?category=${category}` : ""}`);
            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error fetching questions:", errorData);

                if (res.status === 404) {
                    alert(errorData.message || "No more questions available. You've answered all questions!");
                    router.push("/dashboard");
                    return;
                }

                throw new Error(errorData.message || "Failed to fetch questions");
            }
            const data = await res.json();
            setQuestions(data.questions);
            setLoading(false);
        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "Failed to load quiz. Please try again.");
            router.push("/dashboard");
        }
    };

    const handleAnswer = (option) => {
        if (selectedAnswer !== null) return;

        const currentQ = questions[currentQuestion];

        // Get the current options being displayed (English or Hindi)
        const currentOptions = lang === "hi" && currentQ.options_hi && currentQ.options_hi.length > 0
            ? currentQ.options_hi
            : currentQ.options;

        // Find the index of the selected option
        const selectedIndex = currentOptions.indexOf(option);

        // Find the index of the correct answer in the English options
        const correctIndex = currentQ.options.indexOf(currentQ.correctAnswer);

        // Check if the selected index matches the correct index
        const isCorrect = selectedIndex === correctIndex;

        setSelectedAnswer(option);
        setAnswers({ ...answers, [currentQ._id]: option });

        if (isCorrect) {
            setCorrectCount(correctCount + 1);
        }
    };

    const handleNext = () => {
        setSelectedAnswer(null);
        setHint("");

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch("/api/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    questions,
                    correctCount
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit quiz");
            }

            const data = await res.json();
            router.push(`/result?score=${data.score}&total=${questions.length}`);
        } catch (error) {
            console.error("Error submitting quiz:", error);
            alert("Failed to submit quiz. Please try again.");
        }
    };

    const fetchHint = async () => {
        setHintLoading(true);
        try {
            const currentQ = questions[currentQuestion];
            const res = await fetch("/api/hint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: currentQ.question,
                    options: currentQ.options,
                    lang: lang // Pass current language
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to fetch hint");
            }

            const data = await res.json();
            setHint(data.hint);
        } catch (error) {
            console.error("Error fetching hint:", error);
            setHint("Unable to generate hint. Please try again.");
        } finally {
            setHintLoading(false);
        }
    };

    // Re-fetch hint if language changes and hint is already shown
    useEffect(() => {
        if (hint) {
            fetchHint();
        }
    }, [lang]);

    // Helper to get text based on language
    const getText = (obj, field) => {
        if (lang === "hi" && obj[`${field}_hi`]) {
            return obj[`${field}_hi`];
        }
        return obj[field];
    };

    const getOptions = (q) => {
        if (lang === "hi" && q.options_hi && q.options_hi.length > 0) {
            return q.options_hi;
        }
        return q.options;
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="text-center mt-20">
                <p className="text-xl text-slate-600">No questions available.</p>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const isAnswered = selectedAnswer !== null;
    const isCorrect = isAnswered && selectedAnswer === (lang === "hi" && currentQ.correctAnswer_hi ? currentQ.correctAnswer_hi : currentQ.correctAnswer);

    // We need to know which option is correct for display
    const correctOptionText = lang === "hi" && currentQ.correctAnswer_hi ? currentQ.correctAnswer_hi : currentQ.correctAnswer;

    const currentOptions = getOptions(currentQ);

    return (
        <div className="max-w-3xl mx-auto relative">
            {/* Welcome Modal */}
            {showWelcomeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-300 border-2 border-emerald-100">
                        <div className="text-center">
                            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                ⚖️
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Fair Play Reminder</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Please answer the questions honestly without using external help.
                                <br />
                                <span className="font-semibold text-emerald-700 block mt-2">
                                    "Indeed, Allah is ever, over you, an Observer."
                                </span>
                                <span className="text-xs text-slate-400">(Surah An-Nisa: 1)</span>
                            </p>
                            <button
                                onClick={() => setShowWelcomeModal(false)}
                                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 transform active:scale-95"
                            >
                                Bismillah (Start Quiz)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">
                    {lang === "hi" ? "प्रश्न" : "Question"} {currentQuestion + 1} / {questions.length}
                </h1>
                <div className="flex items-center gap-4">
                    <div className="text-blue-600 font-semibold text-lg">
                        {lang === "hi" ? "कुल प्र: " : "Total Q: "} {totalQuestionsAttempted}
                    </div>
                    <div className="text-emerald-600 font-semibold text-lg">
                        {lang === "hi" ? "सही: " : "Correct: "} {correctCount}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <div className="text-xl text-slate-700 mb-8 leading-relaxed">
                    {getText(currentQ, "question")}
                    <button
                        onClick={() => setLang(lang === "en" ? "hi" : "en")}
                        className="ml-4 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600 font-medium hover:bg-slate-100 transition align-middle"
                        title="Switch Language"
                    >
                        {lang === "en" ? "🇮🇳 Hindi" : "🇺🇸 English"}
                    </button>
                </div>

                <div className="space-y-4">
                    {currentOptions.map((option, index) => {
                        let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium ";

                        if (!isAnswered) {
                            buttonClass += "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50";
                        } else {
                            if (option === correctOptionText) {
                                buttonClass += "border-green-500 bg-green-50 text-green-900";
                            } else if (option === selectedAnswer) {
                                buttonClass += "border-red-500 bg-red-50 text-red-900";
                            } else {
                                buttonClass += "border-slate-200 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                disabled={isAnswered}
                                className={buttonClass}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                        <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                            {isCorrect ? (lang === "hi" ? "✓ सही!" : "✓ Correct!") : (lang === "hi" ? "✗ गलत" : "✗ Incorrect")}
                        </p>
                        {!isCorrect && (
                            <p className="text-slate-700 mt-2">
                                {lang === "hi" ? "सही उत्तर है: " : "The correct answer is: "} <span className="font-semibold text-green-700">{correctOptionText}</span>
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-8 flex gap-4">
                    {!isAnswered && (
                        <button
                            onClick={fetchHint}
                            disabled={hintLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition disabled:opacity-50"
                        >
                            <Lightbulb size={20} />
                            {hintLoading ? (lang === "hi" ? "लोड हो रहा है..." : "Loading...") : (lang === "hi" ? "संकेत दें" : "Get Hint")}
                        </button>
                    )}

                    {isAnswered && (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                        >
                            {currentQuestion < questions.length - 1 ? (lang === "hi" ? "अगला प्रश्न" : "Next Question") : (lang === "hi" ? "कोशिश जमा करें" : "Submit Quiz")}
                        </button>
                    )}
                </div>

                {hint && (
                    <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <p className="text-sm font-semibold text-blue-800 mb-2">💡 Hint:</p>
                        <p className="text-slate-700">{hint}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Quiz() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        }>
            <QuizContent />
        </Suspense>
    );
}
