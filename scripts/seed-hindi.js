const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load Environment Variables (Assuming .env.local contains MONGODB_URI)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = require("dotenv").parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Please define the MONGODB_URI environment variable inside .env.local");
    process.exit(1);
}

const QuestionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    question_hi: String,
    options_hi: [String],
    correctAnswer_hi: String,
    category: String,
    difficulty: String,
    reference: String,
}, { timestamps: true });

const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

async function seedHindi() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const questionsPath = path.join(process.cwd(), "data", "questions.json");
        const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));

        let updatedCount = 0;

        for (const item of questionsData) {
            // Only update if Hindi data is present
            if (item.question_hi) {
                // Find by English question text to update the correct document
                const result = await Question.findOneAndUpdate(
                    { question: item.question },
                    {
                        $set: {
                            question_hi: item.question_hi,
                            options_hi: item.options_hi,
                            correctAnswer_hi: item.answer_hi // Note: JSON uses 'answer', schema uses 'correctAnswer', assuming 'answer_hi' maps to 'correctAnswer_hi'
                        }
                    },
                    { new: true }
                );

                if (result) {
                    updatedCount++;
                    console.log(`Updated: ${item.question.substring(0, 30)}...`);
                } else {
                    console.log(`Not found: ${item.question.substring(0, 30)}...`);
                }
            }
        }

        console.log(`\nSuccessfully updated ${updatedCount} questions with Hindi translations.`);

    } catch (error) {
        console.error("Error seeding Hindi data:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seedHindi();
