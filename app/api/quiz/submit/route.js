import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/models/Question";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { answers, correctCount } = await req.json();
        console.log("Quiz submission received:", { answersCount: Object.keys(answers).length, correctCount });

        await dbConnect();

        let score = 0;
        const questionIds = Object.keys(answers);
        const questions = await Question.find({ _id: { $in: questionIds } });

        console.log("Questions found:", questions.length);

        questions.forEach((q) => {
            if (answers[q._id] === q.correctAnswer) {
                score += 1;
            }
        });

        console.log("Calculated score:", score, "Correct count from frontend:", correctCount);

        // Update user's total score, correct answers count, and answered questions
        const updateResult = await User.findByIdAndUpdate(
            session.user.id,
            {
                $inc: {
                    totalScore: score,
                    correctAnswers: correctCount || score
                },
                $addToSet: { answeredQuestions: { $each: questionIds } }
            },
            { new: true }
        );

        console.log("User updated:", updateResult?.name, "New correctAnswers:", updateResult?.correctAnswers);

        return NextResponse.json({ score, total: questions.length }, { status: 200 });
    } catch (error) {
        console.error("Quiz submission error:", error);
        return NextResponse.json(
            { message: "Error submitting quiz", error: error.message },
            { status: 500 }
        );
    }
}
