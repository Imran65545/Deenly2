import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Please provide the question text'],
    },
    options: {
        type: [String],
        required: [true, 'Please provide options'],
        validate: [arrayLimit, '{PATH} exceeds the limit of 4'],
    },
    correctAnswer: {
        type: String,
        required: [true, 'Please provide the correct answer'],
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy',
    },
    reference: {
        type: String,
    },
}, { timestamps: true });

function arrayLimit(val) {
    return val.length <= 4;
}

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
