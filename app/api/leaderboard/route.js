import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        const users = await User.find({ correctAnswers: { $gt: 0 } })
            .sort({ correctAnswers: -1 })
            .limit(10)
            .select("name totalScore correctAnswers");

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: "Error fetching leaderboard" },
            { status: 500 }
        );
    }
}
