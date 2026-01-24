import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

export async function POST(req) {
    try {
        const { text, targetLang = "hi" } = await req.json();

        if (!text) {
            return NextResponse.json({ message: "Text is required" }, { status: 400 });
        }

        const systemPrompt = "You are a professional translator. Translate text accurately and maintain the tone. specific religious terms should be handled respectfully. Return only the translated string.";
        const userPrompt = `Translate the following text into Hindi. Provide ONLY the translated text, no introductions or explanations.\n\nText: "${text}"`;

        const translatedText = await generateText(systemPrompt, userPrompt);

        return NextResponse.json({ translatedText: translatedText.trim() }, { status: 200 });

    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json({ message: "Translation failed" }, { status: 500 });
    }
}
