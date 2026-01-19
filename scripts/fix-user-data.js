const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/deenly';

async function fixUserData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Add correctAnswers field to all users who don't have it
        const result = await mongoose.connection.collection('users').updateMany(
            { correctAnswers: { $exists: false } },
            { $set: { correctAnswers: 0 } }
        );

        console.log(`Updated ${result.modifiedCount} users with correctAnswers field`);

        // Show all users
        const users = await mongoose.connection.collection('users').find({}).toArray();
        console.log('\nCurrent users:');
        users.forEach(user => {
            console.log(`- ${user.name}: correctAnswers=${user.correctAnswers || 0}, totalScore=${user.totalScore}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixUserData();
