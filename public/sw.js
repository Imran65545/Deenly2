// Service Worker for background notifications and adhan audio
const CACHE_NAME = 'deenly-v1';

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/adhan.mp3',
                '/icon.png'
            ]).catch(err => {
                console.log('Cache failed for some files:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
    if (event.data.type === 'SCHEDULE_PRAYER_NOTIFICATIONS') {
        const { prayerTimes, notificationsEnabled, adhanAudioEnabled } = event.data;
        schedulePrayerNotifications(prayerTimes, notificationsEnabled, adhanAudioEnabled);
    }
});

// Handle push events from server
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const options = {
            body: data.body,
            icon: data.icon || '/icon.png',
            badge: data.badge || '/icon.png',
            tag: `prayer-${data.prayer}`,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
                url: '/prayer',
                playAudio: data.playAudio,
                prayer: data.prayer,
                time: data.time
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Schedule prayer notifications
function schedulePrayerNotifications(prayerTimes, notificationsEnabled, adhanAudioEnabled) {
    if (!notificationsEnabled) return;

    const NOTIFICATION_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();

    NOTIFICATION_PRAYERS.forEach(prayer => {
        const time = prayerTimes[prayer];
        if (!time) return;

        const [hours, minutes] = time.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);

        if (prayerTime > now) {
            const timeUntilPrayer = prayerTime.getTime() - now.getTime();

            setTimeout(() => {
                showPrayerNotification(prayer, time, adhanAudioEnabled);
            }, timeUntilPrayer);
        }
    });
}

// Show notification and play audio
async function showPrayerNotification(prayer, time, adhanAudioEnabled) {
    const notificationOptions = {
        body: `It's time for ${prayer} prayer`,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: `prayer-${prayer}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            prayer: prayer,
            time: time,
            playAudio: adhanAudioEnabled
        }
    };

    // Show notification
    await self.registration.showNotification('Prayer Time', notificationOptions);

    // Play adhan audio if enabled
    if (adhanAudioEnabled) {
        // Send message to all clients to play audio
        const clients = await self.clients.matchAll({ type: 'window' });

        if (clients.length > 0) {
            // If app is open, send message to play audio
            clients.forEach(client => {
                client.postMessage({
                    type: 'PLAY_ADHAN_AUDIO',
                    prayer: prayer
                });
            });
        }
    }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const playAudio = event.notification.data?.playAudio;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if app is already open
            for (let client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    // Send message to play audio
                    if (playAudio) {
                        client.postMessage({
                            type: 'PLAY_ADHAN_AUDIO',
                            prayer: event.notification.data.prayer
                        });
                    }
                    return;
                }
            }
            // If not open, open the prayer page
            return clients.openWindow('/prayer?playAudio=' + (playAudio ? '1' : '0'));
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
