import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/models/Question";
import { getServerSession } from "next-auth/next";
import { GET as authOptions } from "@/app/api/auth/[...nextauth]/route";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "admin";
}

export async function POST(req) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { question, options, correctAnswer, category, difficulty, reference } =
            await req.json();

        await dbConnect();

        await Question.create({
            question,
            options,
            correctAnswer,
            category,
            difficulty,
            reference,
        });

        return NextResponse.json(
            { message: "Question added successfully" },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Error adding question" },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id, ...updateData } = await req.json();
        await dbConnect();
        await Question.findByIdAndUpdate(id, updateData);
        return NextResponse.json({ message: "Question updated" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating question" }, { status: 500 });
    }
}

export async function DELETE(req) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await req.json();
        await dbConnect();
        await Question.findByIdAndDelete(id);
        return NextResponse.json({ message: "Question deleted" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting question" }, { status: 500 });
    }
}
