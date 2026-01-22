import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';

export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint required' },
                { status: 400 }
            );
        }

        // Delete subscription
        await PushSubscription.deleteOne({ endpoint });

        return NextResponse.json({
            success: true,
            message: 'Subscription removed'
        });

    } catch (error) {
        console.error('Error removing push subscription:', error);
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        );
    }
}
