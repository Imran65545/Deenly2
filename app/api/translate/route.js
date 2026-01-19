import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function POST(req) {
    try {
        const { text, targetLang = "hi" } = await req.json();

        if (!text) {
            return NextResponse.json({ message: "Text is required" }, { status: 400 });
        }

        const prompt = `Translate the following text into Hindi. Provide ONLY the translated text, no introductions or explanations.
        
        Text: "${text}"`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional translator. Translate text accurately and maintain the tone. specific religious terms should be handled respectfully. Return only the translated string."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            // Use a fast, efficient model
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
        });

        const translatedText = completion.choices[0]?.message?.content?.trim();

        return NextResponse.json({ translatedText }, { status: 200 });

    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json({ message: "Translation failed" }, { status: 500 });
    }
}
