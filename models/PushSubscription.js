import mongoose from 'mongoose';

const PushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: null
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    location: {
        lat: Number,
        lng: Number,
        city: String,
        country: String,
        type: String // 'coords' or 'city'
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    adhanAudioEnabled: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastNotificationSent: {
        type: Date,
        default: null
    }
});

// Index for faster queries
PushSubscriptionSchema.index({ endpoint: 1 });
PushSubscriptionSchema.index({ notificationsEnabled: 1 });

export default mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);
