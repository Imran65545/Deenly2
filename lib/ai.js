import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy",
});

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

/**
 * Generates text using AI with fallback mechanism.
 * @param {string} systemPrompt - The system instruction.
 * @param {string} userPrompt - The user query.
 * @returns {Promise<string>} - The generated text.
 */
export async function generateText(systemPrompt, userPrompt) {
    try {
        console.log("Attempting Groq AI...");
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        return completion.choices[0]?.message?.content || "";
    } catch (groqError) {
        console.warn("Groq API failed, switching to Hugging Face fallback...", groqError.message);

        if (!HF_API_KEY) {
            console.error("No HUGGINGFACE_API_KEY found. Cannot fallback.");
            throw new Error("AI Service Unavailable: Primary failed and no Secondary key.");
        }

        return await generateWithHuggingFace(systemPrompt, userPrompt);
    }
}

async function generateWithHuggingFace(systemPrompt, userPrompt) {
    try {
        // Mistral Instruct format
        const combinedPrompt = `<s>[INST] ${systemPrompt}\n\n${userPrompt} [/INST]`;

        const response = await fetch(HF_API_URL, {
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: combinedPrompt,
                parameters: {
                    max_new_tokens: 500,
                    return_full_text: false,
                    temperature: 0.5
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`HF Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // HF returns array of objects like [{ generated_text: "..." }]
        if (Array.isArray(result) && result[0]?.generated_text) {
            return result[0].generated_text.trim();
        } else if (typeof result === 'object' && result.generated_text) {
            return result.generated_text.trim();
        }

        return "";

    } catch (hfError) {
        console.error("Hugging Face API also failed:", hfError);
        throw new Error("All AI services unavailable.");
    }
}
