import webpush from 'web-push';

// Configure VAPID details only if they exist
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL || 'admin@deenly.app'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Send a push notification to a subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 */
export async function sendPushNotification(subscription, payload) {
    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);

        // If subscription is invalid/expired, return error
        if (error.statusCode === 410 || error.statusCode === 404) {
            return { success: false, expired: true };
        }

        return { success: false, error: error.message };
    }
}

/**
 * Send push notifications to multiple subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @param {Object} payload - Notification payload
 */
export async function sendBulkPushNotifications(subscriptions, payload) {
    const results = await Promise.allSettled(
        subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    return results.map((result, index) => ({
        subscription: subscriptions[index],
        success: result.status === 'fulfilled' && result.value.success,
        expired: result.status === 'fulfilled' && result.value.expired,
        error: result.status === 'rejected' ? result.reason : result.value?.error
    }));
}

export default webpush;
