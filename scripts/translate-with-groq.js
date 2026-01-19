const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'questions.json');

async function translateBatch(items) {
    const prompt = `
    You are a translator. Translate the following JSON array of quiz questions into Hindi.
    Return ONLY a valid JSON array with the exact same structure, but add "question_hi", "options_hi", and "answer_hi" fields.
    
    Input:
    ${JSON.stringify(items, null, 2)}
    
    Output JSON:
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that translates JSON data to Hindi. Return only pure JSON, no markdown formatting.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        // Clean up any markdown code blocks if present
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Translation error:', error.message);
        return null; // Fail safe
    }
}

async function main() {
    console.log('Starting translation...');

    if (!fs.existsSync(QUESTIONS_PATH)) {
        console.error('questions.json not found!');
        return;
    }

    let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
    let modifiedCount = 0;
    const BATCH_SIZE = 5;
    const MAX_ITEMS = 3000; // Increased limit to cover all questions

    // items that need translation
    const itemsToTranslateIndices = [];
    questions.forEach((q, idx) => {
        if (!q.question_hi && itemsToTranslateIndices.length < MAX_ITEMS) {
            itemsToTranslateIndices.push(idx);
        }
    });

    console.log(`Found ${itemsToTranslateIndices.length} items to translate.`);

    for (let i = 0; i < itemsToTranslateIndices.length; i += BATCH_SIZE) {
        const batchIndices = itemsToTranslateIndices.slice(i, i + BATCH_SIZE);
        const batchItems = batchIndices.map(idx => {
            const { question, options, answer } = questions[idx];
            return { question, options, answer }; // Send minimal data to save tokens
        });

        console.log(`Translating batch ${i / BATCH_SIZE + 1}...`);

        const translatedBatch = await translateBatch(batchItems);

        if (translatedBatch && Array.isArray(translatedBatch) && translatedBatch.length === batchIndices.length) {
            batchIndices.forEach((originalIdx, batchIdx) => {
                const translation = translatedBatch[batchIdx];
                questions[originalIdx].question_hi = translation.question_hi;
                questions[originalIdx].options_hi = translation.options_hi;
                questions[originalIdx].answer_hi = translation.answer_hi;

                // Fallback validation
                if (!questions[originalIdx].answer_hi) {
                    // Try to match answer index if textual translation fails exact match logic later
                    const ansIdx = questions[originalIdx].options.indexOf(questions[originalIdx].answer);
                    if (ansIdx !== -1 && questions[originalIdx].options_hi) {
                        questions[originalIdx].answer_hi = questions[originalIdx].options_hi[ansIdx];
                    }
                }
            });
            modifiedCount += batchIndices.length;

            // Save progress periodically
            fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 4));
        } else {
            console.warn('Batch translation failed or returned invalid format. Skipping.');
        }

        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Translation complete. Translated ${modifiedCount} items.`);
}

main();
