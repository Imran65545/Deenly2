import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy",
});

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
        const hf = new HfInference(apiKey);

        // Zephyr is a very reliable, high-quality 7B model for free tier
        const modelName = "HuggingFaceH4/zephyr-7b-beta";
        const combinedPrompt = `<|system|>\n${systemPrompt}</s>\n<|user|>\n${userPrompt}</s>\n<|assistant|>\n`;

        console.log(`Attempting Hugging Face Generation with ${modelName}...`);

        const result = await hf.textGeneration({
            model: modelName,
            inputs: combinedPrompt,
            parameters: {
                max_new_tokens: 500,
                return_full_text: false,
                temperature: 0.5,
                // Avoid wait_for_model: true if we want to fail fast, 
                // but setting it to true helps if the model is just cold booting.
                wait_for_model: true
            }
        });

        // The SDK might return an object or array depending on the call, textGeneration returns object usually
        if (result && result.generated_text) {
            return result.generated_text.trim();
        }

        return "";

    } catch (hfError) {
        console.error("Hugging Face SDK failed:", hfError);
        throw new Error(`HF SDK Error: ${hfError.message}`);
    }
}
