import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import Groq from "groq-sdk";

export async function POST(req) {
    try {
        const { question, options, lang = "en" } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { hint: "This is a simulated hint. Add GROQ_API_KEY to get real AI hints!" },
                { status: 200 }
            );
        }

        const groq = new Groq({ apiKey });

        const prompt = `
            You are an Islamic scholar helper. 
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

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        const hint = completion.choices[0]?.message?.content || "No hint available.";

        return NextResponse.json({ hint }, { status: 200 });
    } catch (error) {
        console.error("Hint API Error:", error);
        console.error("API Key present:", !!process.env.GROQ_API_KEY);
        return NextResponse.json(
            { message: "Failed to generate hint", error: error.message },
            { status: 500 }
        );
    }
}
