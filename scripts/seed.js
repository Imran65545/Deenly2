const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017/deenly';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create Admin User
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await mongoose.connection.collection('users').updateOne(
            { email: 'admin@deenly.com' },
            {
                $set: {
                    name: 'Admin User',
                    email: 'admin@deenly.com',
                    password: hashedPassword,
                    role: 'admin',
                    totalScore: 0
                }
            },
            { upsert: true }
        );
        console.log('Admin user created/updated');

        // Load Questions from JSON file if exists, otherwise clean or error
        // For this update, we expect the user to have provided a list, 
        // but since I don't have the 100 questions file yet, I will mock a few in the new format
        // to demonstrate the import logic.
        // In production, this would read `data/questions.json`

        const questionsDataPath = path.join(__dirname, '../data/questions.json');
        let questions = [];

        if (fs.existsSync(questionsDataPath)) {
            const fileData = fs.readFileSync(questionsDataPath, 'utf-8');
            questions = JSON.parse(fileData);
            console.log(`Loaded ${questions.length} questions from file.`);
        } else {
            console.log("No data/questions.json found. Using mock data for demo.");
            questions = [
                {
                    "question": "What is the maximum number of wives a man is allowed at once in Islam under specific conditions?",
                    "options": ["One", "Two", "Three", "Four"],
                    "answer": "Four"
                },
                {
                    "question": "Which Surah is known as the Heart of the Quran?",
                    "options": ["Surah Yasin", "Surah Rahman", "Surah Fatiha", "Surah Ikhlas"],
                    "answer": "Surah Yasin"
                }
            ];
        }

        // Transform to Schema format
        // New format: { question, options, answer }
        // Schema format: { question, options, correctAnswer, category (default: 'General' or randomized if mixed not supported by schema), difficulty }

        const formattedQuestions = questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.answer, // Map 'answer' to 'correctAnswer'
            category: "General", // Default category since we removed specific ones
            difficulty: "Medium",
            reference: ""
        }));

        // Clear existing questions
        await mongoose.connection.collection('questions').deleteMany({});

        await mongoose.connection.collection('questions').insertMany(formattedQuestions);
        console.log(`Seeded ${formattedQuestions.length} questions`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
