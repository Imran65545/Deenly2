import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/models/Question";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
    await dbConnect();

    try {
        const totalQuestions = await Question.countDocuments();
        console.log(`Total questions in DB: ${totalQuestions}`);

        const session = await getServerSession(authOptions);
        let answeredIds = [];

        if (session) {
            const user = await User.findById(session.user.id);
            if (user && user.answeredQuestions && user.answeredQuestions.length > 0) {
                // Ensure IDs are proper ObjectIds for aggregation
                answeredIds = user.answeredQuestions.map(id => new mongoose.Types.ObjectId(id));
            }
        }

        console.log(`Fetching questions. User: ${session?.user?.id}, Answered count: ${answeredIds.length}`);

        // Debug: Log the first few answered IDs vs some question IDs in DB
        if (answeredIds.length > 0) {
            console.log("Sample Answered IDs:", answeredIds.slice(0, 3));
        }

        const questions = await Question.aggregate([
            { $match: { _id: { $nin: answeredIds } } },
            { $sample: { size: 10 } },
            {
                $project: {
                    _id: 1,
                    question: 1,
                    options: 1,
                    correctAnswer: 1,
                    difficulty: 1,
                },
            },
        ]);

        console.log(`Questions found after filter: ${questions.length}`);
        return NextResponse.json({ questions }, { status: 200 });
    } catch (error) {
        console.error("Quiz Fetch Error:", error);
        return NextResponse.json(
            { message: "Error fetching quiz" },
            { status: 500 }
        );
    }
}
