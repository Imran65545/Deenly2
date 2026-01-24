import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy",
});

// Using Mistral v0.2 which is more reliable for free access
const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

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

        // Read key fresh from env inside the error handler
        const hfKey = process.env.HUGGINGFACE_API_KEY;

        if (!hfKey) {
            console.error("No HUGGINGFACE_API_KEY found. Cannot fallback.");
            throw new Error(`AI Service Unavailable: Primary failed (${groqError.message}) and No HUGGINGFACE_API_KEY.`);
        }

        return await generateWithHuggingFace(systemPrompt, userPrompt, hfKey);
    }
}

async function generateWithHuggingFace(systemPrompt, userPrompt, apiKey) {
    try {
        // Mistral Instruct format
        const combinedPrompt = `<s>[INST] ${systemPrompt}\n\n${userPrompt} [/INST]`;

        const response = await fetch(HF_API_URL, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
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
            const errText = await response.text();
            console.error("HF API Error Body:", errText);
            throw new Error(`HF Error: ${response.status} ${response.statusText} - ${errText}`);
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
        throw new Error(hfError.message);
    }
}
