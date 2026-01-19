require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        // Use MONGODB_URI from .env.local
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }

        console.log('Connecting to Atlas database...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

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
                    totalScore: 0,
                    correctAnswers: 0,
                    answeredQuestions: []
                }
            },
            { upsert: true }
        );
        console.log('Admin user created/updated');

        // Load Questions from JSON file
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
        const formattedQuestions = questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.answer,
            category: "General",
            difficulty: "Medium",
            reference: ""
        }));

        // Clear existing questions
        const deleteResult = await mongoose.connection.collection('questions').deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} existing questions`);

        // Insert new questions
        await mongoose.connection.collection('questions').insertMany(formattedQuestions);
        console.log(`Seeded ${formattedQuestions.length} questions to Atlas database`);

        // Show summary
        const userCount = await mongoose.connection.collection('users').countDocuments();
        const questionCount = await mongoose.connection.collection('questions').countDocuments();

        console.log('\n=== Database Summary ===');
        console.log(`Users: ${userCount}`);
        console.log(`Questions: ${questionCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
