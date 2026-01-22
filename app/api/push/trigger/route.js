import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import { sendPushNotification } from '@/lib/webpush';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export async function GET(request) {
    try {
        await dbConnect();

        // Get all active subscriptions
        const subscriptions = await PushSubscription.find({
            notificationsEnabled: true
        });

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active subscriptions',
                sent: 0
            });
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour}:${String(currentMinute).padStart(2, '0')}`;

        let sentCount = 0;
        const expiredSubscriptions = [];

        // Process each subscription
        for (const sub of subscriptions) {
            try {
                // Fetch prayer times for this user's location
                const prayerTimes = await fetchPrayerTimes(sub.location);

                if (!prayerTimes) continue;

                // Check if current time matches any prayer time
                const matchingPrayer = PRAYER_NAMES.find(prayer => {
                    const prayerTime = prayerTimes[prayer];
                    if (!prayerTime) return false;

                    const [hours, minutes] = prayerTime.split(':');
                    const prayerTimeStr = `${parseInt(hours)}:${minutes}`;

                    return prayerTimeStr === currentTime;
                });

                if (matchingPrayer) {
                    // Check if we already sent notification in the last minute
                    if (sub.lastNotificationSent) {
                        const timeSinceLastNotification = now - new Date(sub.lastNotificationSent);
                        if (timeSinceLastNotification < 60000) {
                            continue; // Skip if sent less than 1 minute ago
                        }
                    }

                    // Send push notification
                    const payload = {
                        title: 'Prayer Time',
                        body: `It's time for ${matchingPrayer} prayer`,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        playAudio: sub.adhanAudioEnabled,
                        prayer: matchingPrayer,
                        time: prayerTimes[matchingPrayer]
                    };

                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: sub.keys
                    };

                    const result = await sendPushNotification(pushSubscription, payload);

                    if (result.success) {
                        sentCount++;
                        // Update last notification sent time
                        sub.lastNotificationSent = now;
                        await sub.save();
                    } else if (result.expired) {
                        // Mark for deletion
                        expiredSubscriptions.push(sub._id);
                    }
                }
            } catch (error) {
                console.error(`Error processing subscription ${sub._id}:`, error);
            }
        }

        // Clean up expired subscriptions
        if (expiredSubscriptions.length > 0) {
            await PushSubscription.deleteMany({
                _id: { $in: expiredSubscriptions }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Checked ${subscriptions.length} subscriptions`,
            sent: sentCount,
            expired: expiredSubscriptions.length,
            currentTime
        });

    } catch (error) {
        console.error('Error in push trigger:', error);
        return NextResponse.json(
            { error: 'Failed to process notifications' },
            { status: 500 }
        );
    }
}

async function fetchPrayerTimes(location) {
    try {
        if (!location) return null;

        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        let url;
        if (location.type === 'coords' && location.lat && location.lng) {
            url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${location.lat}&longitude=${location.lng}&method=2`;
        } else if (location.city && location.country) {
            url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${location.city}&country=${location.country}&method=2`;
        } else {
            return null;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200 && data.data) {
            return data.data.timings;
        }

        return null;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
    }
}
