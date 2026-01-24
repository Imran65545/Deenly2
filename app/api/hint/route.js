import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { generateText } from "@/lib/ai";

export async function POST(req) {
    try {
        const { question, options, lang = "en" } = await req.json();

        const systemPrompt = `You are an Islamic scholar helper.`;
        const userPrompt = `
            Question: "${question}"
            Options: ${JSON.stringify(options)}
            
            Provide a short, subtle hint to help the user answer this question in ${lang === "hi" ? "HINDI" : "ENGLISH"}.
            RULES:
            1. DO NOT reveal the answer.
            2. DO NOT mention the options directly (e.g. "It's not A").
            3. Focus on the concept or history related to the question.
            4. Keep it under 2 sentences.
            ${lang === "hi" ? "5. Return ONLY the Hindi text." : ""}
        `;

        const hint = await generateText(systemPrompt, userPrompt);

        return NextResponse.json({ hint: hint || "No hint available." }, { status: 200 });
    } catch (error) {
        console.error("Hint API Error:", error);
        return NextResponse.json(
            { message: "Failed to generate hint", error: error.message },
            { status: 500 }
        );
    }
}
