import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';

export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { subscription, location, notificationsEnabled, adhanAudioEnabled } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription' },
                { status: 400 }
            );
        }

        // Check if subscription already exists
        const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

        if (existing) {
            // Update existing subscription
            existing.keys = subscription.keys;
            existing.location = location;
            existing.notificationsEnabled = notificationsEnabled;
            existing.adhanAudioEnabled = adhanAudioEnabled;
            await existing.save();

            return NextResponse.json({
                success: true,
                message: 'Subscription updated',
                subscription: existing
            });
        }

        // Create new subscription
        const newSubscription = await PushSubscription.create({
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            location,
            notificationsEnabled,
            adhanAudioEnabled
        });

        return NextResponse.json({
            success: true,
            message: 'Subscription created',
            subscription: newSubscription
        });

    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}
