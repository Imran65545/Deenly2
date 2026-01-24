import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import { sendPushNotification } from '@/lib/webpush';
import admin from '@/lib/firebase-admin';

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

        const utcNow = new Date();
        let sentCount = 0;
        const expiredSubscriptions = [];

        // Deduplicate Logic: Group by Location (Lat/Lng)
        // If a user re-subscribes (e.g. new FCM token) without the old one dying, 
        // we might have 2 active docs for the same person.
        const uniqueSubs = new Map();
        const duplicatesToDelete = [];

        subscriptions.forEach(sub => {
            // Create a unique key based on location (standardized)
            // Using 4 decimal places for precision (~11 meters) to group same-house users
            // but effectively distinct enough for "same user device"
            if (!sub.location || !sub.location.lat || !sub.location.lng) return;

            const key = `${sub.location.lat.toFixed(4)}_${sub.location.lng.toFixed(4)}`;

            if (uniqueSubs.has(key)) {
                // Conflict! We have a duplicate location.
                const existing = uniqueSubs.get(key);

                // DATA CLEANUP STRATEGY:
                // 1. Prefer FCM over VAPID
                // 2. Prefer Newer over Older

                let keepNew = false;

                // Priority: FCM > VAPID
                if (sub.tokenType === 'fcm' && existing.tokenType !== 'fcm') keepNew = true;
                else if (sub.tokenType !== 'fcm' && existing.tokenType === 'fcm') keepNew = false;
                // If both same type, keep newer
                else if (new Date(sub.createdAt) > new Date(existing.createdAt)) keepNew = true;

                if (keepNew) {
                    duplicatesToDelete.push(existing._id);
                    uniqueSubs.set(key, sub);
                } else {
                    duplicatesToDelete.push(sub._id);
                }
            } else {
                uniqueSubs.set(key, sub);
            }
        });

        // Delete duplicates immediately
        if (duplicatesToDelete.length > 0) {
            console.log(`Cleaning up ${duplicatesToDelete.length} duplicate subscriptions...`);
            await PushSubscription.deleteMany({ _id: { $in: duplicatesToDelete } });
        }

        const validSubscriptions = Array.from(uniqueSubs.values());

        // Process each unique subscription
        for (const sub of validSubscriptions) {
            try {
                // Fetch prayer times for this user's location
                const prayerData = await fetchPrayerTimes(sub.location);

                if (!prayerData) continue;

                const { timings, timezone } = prayerData;

                // Calculate User's Local Time
                // API usually returns timezone like "Asia/Kolkata" or "UTC"
                // We use this to convert Server UTC now to User Local now
                const userTimeStr = utcNow.toLocaleTimeString('en-GB', {
                    timeZone: timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                // userTimeStr will be "19:28" (HH:MM)

                // Check if current user time matches any prayer time
                const matchingPrayer = PRAYER_NAMES.find(prayer => {
                    const prayerTime = timings[prayer];
                    if (!prayerTime) return false;

                    // Aladhan returns "19:28 (IST)" sometimes, or just "19:28"
                    // We need to clean parsing just in case
                    const cleanPrayerTime = prayerTime.split(' ')[0]; //Remove (IST) if exists
                    const [hours, minutes] = cleanPrayerTime.split(':');

                    // Normalize to HH:MM (padding zeros)
                    const normalizedPrayerTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                    return normalizedPrayerTime === userTimeStr;
                });

                if (matchingPrayer) {
                    // Check if we already sent notification in the last minute
                    // This prevents double send if job runs twice quickly
                    if (sub.lastNotificationSent) {
                        const timeSinceLastNotification = utcNow - new Date(sub.lastNotificationSent);
                        if (timeSinceLastNotification < 60000) {
                            continue; // Skip if sent less than 1 minute ago
                        }
                    }

                    const payload = {
                        title: 'Prayer Time',
                        body: `It's time for ${matchingPrayer} prayer`,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        data: {
                            url: '/prayer',
                            playAudio: sub.adhanAudioEnabled ? 'true' : 'false',
                            prayer: matchingPrayer,
                            time: timings[matchingPrayer]
                        }
                    };

                    let result = { success: false, expired: false };

                    // Send based on token type
                    if (sub.tokenType === 'fcm' || (!sub.tokenType && sub.fcmToken)) {
                        // Send via Firebase Admin
                        try {
                            await admin.messaging().send({
                                token: sub.fcmToken,
                                notification: {
                                    title: payload.title,
                                    body: payload.body
                                },
                                webpush: {
                                    notification: {
                                        icon: payload.icon,
                                        badge: payload.badge,
                                        requireInteraction: true,
                                        vibrate: [200, 100, 200],
                                        data: payload.data
                                    },
                                    fcmOptions: {
                                        link: '/prayer'
                                    }
                                },
                                data: payload.data, // Also send as data payload
                            });
                            result.success = true;
                        } catch (fcmError) {
                            console.error(`FCM error for ${sub._id}:`, fcmError);
                            if (fcmError.code === 'messaging/registration-token-not-registered' ||
                                fcmError.code === 'messaging/invalid-registration-token') {
                                result.expired = true;
                            }
                        }
                    } else {
                        // Legacy VAPID Web Push
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: sub.keys
                        };
                        // Adapt payload for legacy SW format if needed, or keeping it consistent
                        // existing sw.js expects { title, body, icon, ... } in wrapper
                        const vapidPayload = {
                            title: payload.title,
                            body: payload.body,
                            icon: payload.icon,
                            badge: payload.badge,
                            playAudio: sub.adhanAudioEnabled, // Legacy SW used this prop directly
                            prayer: matchingPrayer,
                            time: timings[matchingPrayer]
                        };
                        result = await sendPushNotification(pushSubscription, vapidPayload);
                    }

                    if (result.success) {
                        sentCount++;
                        // Update last notification sent time
                        sub.lastNotificationSent = utcNow;
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
            serverUtcTime: utcNow.toISOString() // Helpful for debugging
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
            return {
                timings: data.data.timings,
                timezone: data.data.meta.timezone
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
    }
}
