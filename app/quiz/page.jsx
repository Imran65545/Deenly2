"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Lightbulb, Loader2 } from "lucide-react";

export default function Quiz() {
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

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    // Reset hint and selection on question change
    useEffect(() => {
        setHint("");
        setSelectedAnswer(null);
    }, [currentQuestion]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/quiz/start?category=${category}`);
            const data = await res.json();
            if (res.ok) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (option) => {
        if (selectedAnswer) return; // Prevent changing answer after selection

        setSelectedAnswer(option);
        setAnswers({ ...answers, [questions[currentQuestion]._id]: option });

        // Check if answer is correct
        if (option === questions[currentQuestion].correctAnswer) {
            setCorrectCount(correctCount + 1);
        }
    };

    const getHint = async () => {
        if (hint) return;
        setHintLoading(true);
        try {
            const res = await fetch("/api/hint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: questions[currentQuestion].question,
                    options: questions[currentQuestion].options
                }),
            });
            const data = await res.json();
            if (res.ok) setHint(data.hint);
        } catch (error) {
            console.error("Failed to get hint");
        } finally {
            setHintLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    correctCount
                }),
            });

            if (res.ok) {
                const result = await res.json();
                // Redirect to result page with score
                router.push(`/result?score=${result.score}&total=${result.total}&correct=${correctCount}`);
            }
        } catch (error) {
            console.error("Submit failed", error);
        }
    };

    if (loading) return <div className="text-center mt-20">Loading Quiz...</div>;

    if (questions.length === 0) {
        return (
            <div className="text-center mt-20 p-8 max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Questions Exhausted!</h2>
                <p className="text-slate-600 mb-6">
                    You have completed all available questions. We will update more soon!
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const question = questions[currentQuestion];

    const getOptionStyle = (option) => {
        if (!selectedAnswer) {
            // Before selection
            return "border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700";
        }

        // After selection
        if (option === question.correctAnswer) {
            // Correct answer - always green
            return "border-green-500 bg-green-100 text-green-800";
        } else if (option === selectedAnswer) {
            // Wrong selected answer - red
            return "border-red-500 bg-red-100 text-red-800";
        } else {
            // Other options - dimmed
            return "border-slate-200 bg-slate-50 text-slate-400";
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-emerald-800">
                    Question {currentQuestion + 1} / {questions.length}
                </h2>
                <div className="text-sm font-medium text-emerald-600">
                    Correct: {correctCount}
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 mb-8">
                <h3 className="text-2xl font-medium text-slate-800 mb-6">
                    {question.question}
                </h3>

                {hint && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-3 shadow-sm">
                        <Lightbulb className="flex-shrink-0" size={20} />
                        <p className="italic">Hint: {hint}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(option)}
                            disabled={selectedAnswer !== null}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${getOptionStyle(option)}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {selectedAnswer && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-sm font-medium text-emerald-800">
                            <span className="font-bold">Correct Answer:</span> {question.correctAnswer}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={getHint}
                    disabled={hintLoading || !!hint || selectedAnswer !== null}
                    className="flex items-center gap-2 text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {hintLoading ? <Loader2 className="animate-spin" size={20} /> : <Lightbulb size={20} />}
                    {hint ? "Hint Revealed" : "Get Hint"}
                </button>

                <button
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {currentQuestion === questions.length - 1 ? "Submit Quiz" : "Next Question"}
                </button>
            </div>
        </div>
    );
}
