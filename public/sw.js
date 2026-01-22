// Service Worker for background notifications and adhan audio
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = 'deenly-v1';

const firebaseConfig = {
    apiKey: "AIzaSyBMfVKGRwJpys6jxS20m4N8xHK93ympaeI",
    authDomain: "deenly-f4c21.firebaseapp.com",
    projectId: "deenly-f4c21",
    storageBucket: "deenly-f4c21.firebasestorage.app",
    messagingSenderId: "4360465603",
    appId: "1:4360465603:web:e9586fd2dd628ae0930676",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

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

// Legacy 'push' listener removed to prevent conflict with FCM onBackgroundMessage

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
