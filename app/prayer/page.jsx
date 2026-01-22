"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, Calendar, RefreshCw, Loader2, Bell, BellOff, Settings, Compass, Moon, Volume2 } from "lucide-react";
import Link from "next/link";

const PRAYER_NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const NOTIFICATION_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// VAPID Public Key for Web Push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const PRAYER_ICONS = {
    Fajr: "🌙",
    Sunrise: "🌅",
    Dhuhr: "☀️",
    Asr: "🌤️",
    Maghrib: "🌆",
    Isha: "🌃"
};



const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export default function PrayerTimes() {
    const [location, setLocation] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationDenied, setLocationDenied] = useState(false);
    const [dateInfo, setDateInfo] = useState(null);
    const [cityInput, setCityInput] = useState("");
    const [countryInput, setCountryInput] = useState("");
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState("default");
    const [isRamadan, setIsRamadan] = useState(false);
    const [hijriDate, setHijriDate] = useState(null);
    const [showQibla, setShowQibla] = useState(false);
    const [qiblaDirection, setQiblaDirection] = useState(null);
    const [deviceHeading, setDeviceHeading] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [adhanAudioEnabled, setAdhanAudioEnabled] = useState(false);
    const [testDemoScheduled, setTestDemoScheduled] = useState(false);
    const [testDemoCountdown, setTestDemoCountdown] = useState(0);
    const [currentAudio, setCurrentAudio] = useState(null);
    const [pushEndpoint, setPushEndpoint] = useState(null);

    useEffect(() => {
        requestLocation();
        checkNotificationPermission();
        loadNotificationPreference();
        registerServiceWorker();
        setupVolumeButtonListener();
    }, []);

    useEffect(() => {
        if (dateInfo?.hijri) {
            setHijriDate(dateInfo.hijri);
            setIsRamadan(dateInfo.hijri.month.number === 9);
        }
    }, [dateInfo]);

    useEffect(() => {
        if (prayerTimes) {
            calculateNextPrayer();
            const interval = setInterval(calculateNextPrayer, 1000);
            if (notificationsEnabled) {
                schedulePrayerNotifications();
                sendNotificationsToServiceWorker(); // Send to Service Worker for background
                subscribeToPushNotifications(); // Subscribe to server push
            }
            return () => clearInterval(interval);
        }
    }, [prayerTimes, notificationsEnabled, adhanAudioEnabled, location]);

    useEffect(() => {
        if (testDemoCountdown > 0) {
            const timer = setInterval(() => {
                setTestDemoCountdown(prev => {
                    if (prev <= 1) {
                        setTestDemoScheduled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [testDemoCountdown]);

    // Register Service Worker for background notifications
    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);

                // Listen for messages from Service Worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'PLAY_ADHAN_AUDIO') {
                        playAdhanAudio();
                    }
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    };

    // Setup volume button listener to stop adhan
    const setupVolumeButtonListener = () => {
        // Listen for any key press (volume buttons trigger keydown on mobile)
        const handleKeyPress = (e) => {
            if (currentAudio && !currentAudio.paused) {
                stopAdhanAudio();
            }
        };

        // Listen for visibility change (when user interacts with phone)
        const handleVisibilityChange = () => {
            if (document.hidden && currentAudio && !currentAudio.paused) {
                // User pressed power button or switched apps
                stopAdhanAudio();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    };

    // Play adhan audio
    const playAdhanAudio = () => {
        try {
            const audio = new Audio('/adhan.mp3');
            setCurrentAudio(audio);

            audio.play().catch(err => {
                console.error('Error playing adhan audio:', err);
            });

            // Auto-stop after audio ends
            audio.onended = () => {
                setCurrentAudio(null);
            };
        } catch (err) {
            console.error('Error creating audio:', err);
        }
    };

    // Stop adhan audio
    const stopAdhanAudio = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            setCurrentAudio(null);
        }
    };

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    // Fetch city name from coordinates using reverse geocoding
                    try {
                        const geoResponse = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                        );
                        const geoData = await geoResponse.json();

                        const city = geoData.address?.city ||
                            geoData.address?.town ||
                            geoData.address?.village ||
                            geoData.address?.state ||
                            "Unknown";
                        const country = geoData.address?.country || "Unknown";

                        const loc = {
                            lat,
                            lng,
                            city,
                            country,
                            type: "coords"
                        };
                        setLocation(loc);
                        fetchPrayerTimes(loc);
                    } catch (geoError) {
                        console.error("Geocoding error:", geoError);
                        // Fallback to coordinates without city name
                        const loc = {
                            lat,
                            lng,
                            city: "Current Location",
                            country: "",
                            type: "coords"
                        };
                        setLocation(loc);
                        fetchPrayerTimes(loc);
                    }
                },
                (error) => {
                    console.error("Location error:", error);
                    setLocationDenied(true);
                    setLoading(false);
                }
            );
        } else {
            setLocationDenied(true);
            setLoading(false);
        }
    };

    const checkNotificationPermission = () => {
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }
    };

    const loadNotificationPreference = () => {
        const saved = localStorage.getItem("prayerNotificationsEnabled");
        if (saved !== null) {
            setNotificationsEnabled(saved === "true");
        }
        const savedAudio = localStorage.getItem("prayerAdhanAudioEnabled");
        if (savedAudio !== null) {
            setAdhanAudioEnabled(savedAudio === "true");
        }
    };

    const requestNotificationPermission = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === "granted") {
                setNotificationsEnabled(true);
                localStorage.setItem("prayerNotificationsEnabled", "true");
            }
        }
    };

    const toggleNotifications = async () => {
        if (!notificationsEnabled && notificationPermission !== "granted") {
            await requestNotificationPermission();
        } else {
            const newState = !notificationsEnabled;
            setNotificationsEnabled(newState);
            localStorage.setItem("prayerNotificationsEnabled", String(newState));
            if (!newState) {
                clearScheduledNotifications();
            }
        }
    };

    const schedulePrayerNotifications = () => {
        if (!prayerTimes || notificationPermission !== "granted") return;

        clearScheduledNotifications();

        const now = new Date();
        const scheduledIds = [];

        NOTIFICATION_PRAYERS.forEach(prayer => {
            const time = prayerTimes[prayer];
            if (!time) return;

            const [hours, minutes] = time.split(":").map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(hours, minutes, 0, 0);

            if (prayerTime > now) {
                const timeUntilPrayer = prayerTime.getTime() - now.getTime();

                const timeoutId = setTimeout(() => {
                    showPrayerNotification(prayer, time);
                }, timeUntilPrayer);

                scheduledIds.push(timeoutId);
            }
        });

        localStorage.setItem("scheduledNotifications", JSON.stringify(scheduledIds));
    };

    const clearScheduledNotifications = () => {
        const saved = localStorage.getItem("scheduledNotifications");
        if (saved) {
            try {
                const ids = JSON.parse(saved);
                ids.forEach(id => clearTimeout(id));
                localStorage.removeItem("scheduledNotifications");
            } catch (e) {
                console.error("Error clearing notifications:", e);
            }
        }
    };

    const showPrayerNotification = (prayer, time) => {
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("Prayer Time", {
                body: `It's time for ${prayer} prayer`,
                icon: "/icon.png",
                badge: "/icon.png",
                tag: `prayer-${prayer}`,
                requireInteraction: false,
                silent: !adhanAudioEnabled
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        // Play adhan audio if enabled using the new function
        if (adhanAudioEnabled) {
            playAdhanAudio();
        }
    };

    // Send prayer times to Service Worker for background scheduling
    const sendNotificationsToServiceWorker = () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_PRAYER_NOTIFICATIONS',
                prayerTimes: prayerTimes,
                notificationsEnabled: notificationsEnabled,
                adhanAudioEnabled: adhanAudioEnabled
            });
        }
    };

    // Subscribe to push notifications
    const subscribeToPushNotifications = async () => {
        try {
            console.log('subscribeToPushNotifications called');
            console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY env var:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
            
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.log('Push notifications not supported');
                return;
            }

            console.log('VAPID_PUBLIC_KEY value:', VAPID_PUBLIC_KEY);
            console.log('VAPID_PUBLIC_KEY is empty?', !VAPID_PUBLIC_KEY);

            if (!VAPID_PUBLIC_KEY) {
                console.log('VAPID key not configured - push will be skipped');
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                try {
                    console.log('Attempting to subscribe with VAPID key length:', VAPID_PUBLIC_KEY.length);
                    const uint8Array = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                    console.log('Uint8Array created, length:', uint8Array.length);
                    
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: uint8Array

                    });
                    console.log('Push subscription created successfully');
                } catch (subError) {
                    console.error('Push subscribe failed:', subError.name, subError.message);
                    return; // Gracefully fail - local notifications will still work
                }
            }


            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription,
                    location,
                    notificationsEnabled,
                    adhanAudioEnabled
                })
            }).catch(err => console.log('Subscription save failed:', err));

            setPushEndpoint(subscription?.endpoint);
        } catch (error) {
            console.error('Push notification setup error:', error.message);
        }
    };

    // Helper function to convert VAPID key
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const scheduleTestDemo = () => {
        // Request notification permission first if needed
        if (notificationPermission !== "granted") {
            requestNotificationPermission().then(() => {
                if (Notification.permission === "granted") {
                    startTestDemo();
                }
            });
        } else {
            startTestDemo();
        }
    };

    const startTestDemo = async () => {
        setTestDemoScheduled(true);
        setTestDemoCountdown(180); // 180 seconds = 3 minutes

        // Send test notification after 3 minutes using server
        setTimeout(async () => {
            try {
                if (!pushEndpoint) {
                    alert('Please enable notifications first!');
                    setTestDemoScheduled(false);
                    setTestDemoCountdown(0);
                    return;
                }

                const response = await fetch('/api/push/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: pushEndpoint
                    })
                });

                const data = await response.json();

                if (data.success) {
                    console.log('Test notification sent successfully');
                } else {
                    console.error('Failed to send test notification:', data.error);
                }
            } catch (error) {
                console.error('Error sending test notification:', error);
            }

            setTestDemoScheduled(false);
            setTestDemoCountdown(0);
        }, 3 * 60 * 1000); // 3 minutes

        alert("Test demo scheduled! You'll receive a push notification in 3 minutes.\n\nYou can now CLOSE the app completely to test background notifications!");
    };


    const fetchPrayerTimes = async (loc) => {
        try {
            setLoading(true);
            setError(null);

            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            let url;
            if (loc.type === "coords") {
                url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${loc.lat}&longitude=${loc.lng}&method=2`;
            } else {
                url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${loc.city}&country=${loc.country}&method=2`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch prayer times");

            const data = await response.json();

            if (data.code === 200 && data.data) {
                setPrayerTimes(data.data.timings);
                setDateInfo(data.data.date);
                setLocationDenied(false);
            } else {
                throw new Error("Invalid API response");
            }
        } catch (err) {
            console.error("Error fetching prayer times:", err);
            setError("Failed to load prayer times. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const calculateNextPrayer = () => {
        if (!prayerTimes) return;

        const now = new Date();
        const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        let next = null;
        let minDiff = Infinity;

        PRAYER_NAMES.forEach(prayer => {
            const time = prayerTimes[prayer];
            if (!time) return;

            const [hours, minutes] = time.split(":").map(Number);
            const prayerSeconds = hours * 3600 + minutes * 60;

            const diff = prayerSeconds - currentSeconds;

            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                next = prayer;
            }
        });

        if (!next) {
            const firstPrayer = PRAYER_NAMES[0];
            const [hours, minutes] = prayerTimes[firstPrayer].split(":").map(Number);
            const prayerSeconds = hours * 3600 + minutes * 60;
            const diff = (24 * 3600 - currentSeconds) + prayerSeconds;
            minDiff = diff;
            next = firstPrayer;
        }

        setNextPrayer(next);

        const hours = Math.floor(minDiff / 3600);
        const mins = Math.floor((minDiff % 3600) / 60);
        const secs = minDiff % 60;
        setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
    };

    const handleCitySubmit = (e) => {
        e.preventDefault();
        if (cityInput.trim() && countryInput.trim()) {
            const loc = {
                city: cityInput.trim(),
                country: countryInput.trim(),
                type: "city"
            };
            setLocation(loc);
            fetchPrayerTimes(loc);
        }
    };



    const calculateQiblaDirection = () => {
        if (!location?.lat || !location?.lng) return;

        const lat1 = location.lat * Math.PI / 180;
        const lat2 = KAABA_LAT * Math.PI / 180;
        const dLng = (KAABA_LNG - location.lng) * Math.PI / 180;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        const bearing = Math.atan2(y, x) * 180 / Math.PI;

        setQiblaDirection((bearing + 360) % 360);
        setShowQibla(true);

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    const handleOrientation = (event) => {
        const heading = event.alpha || 0;
        setDeviceHeading(heading);
    };

    const closeQibla = () => {
        setShowQibla(false);
        window.removeEventListener('deviceorientation', handleOrientation);
    };

    const formatTime = (time24) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "pm" : "am";
        const h12 = h % 12 || 12;
        return `${h12}:${minutes}${ampm}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Loading Prayer Times...</p>
                </div>
            </div>
        );
    }

    if (locationDenied && !location) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
                    <div className="text-center mb-6">
                        <MapPin className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Location Required</h2>
                        <p className="text-slate-600">
                            Please enter your city to view accurate prayer times
                        </p>
                    </div>

                    <form onSubmit={handleCitySubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                placeholder="e.g., Mumbai"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Country
                            </label>
                            <input
                                type="text"
                                value={countryInput}
                                onChange={(e) => setCountryInput(e.target.value)}
                                placeholder="e.g., India"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                        >
                            Get Prayer Times
                        </button>
                    </form>

                    <button
                        onClick={requestLocation}
                        className="w-full mt-4 text-emerald-600 py-2 text-sm hover:text-emerald-700 transition"
                    >
                        Or allow location access
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => location && fetchPrayerTimes(location)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-sky-400 via-blue-300 to-orange-200 rounded-3xl shadow-2xl overflow-hidden">
                {/* Top Info Bar */}
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between text-white/90 text-sm mb-6">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>
                                {location?.city && location?.country
                                    ? `${location.city}, ${location.country}`
                                    : location?.city || "Current Location"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
                                className="hover:bg-white/20 p-2 rounded-lg transition"
                                title="Prayer Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => location && fetchPrayerTimes(location)}
                                className="hover:bg-white/20 p-2 rounded-lg transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Current Prayer & Countdown */}
                    {nextPrayer && (
                        <div className="text-center mb-6">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                                {nextPrayer} {formatTime(prayerTimes[nextPrayer])}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-slate-800">
                                <Clock className="w-5 h-5" />
                                <p className="text-lg font-medium">
                                    Remaining: {timeRemaining}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Date Display */}
                    {dateInfo && (
                        <div className="flex items-center justify-center gap-2 text-slate-800 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {dateInfo.gregorian?.date} • {dateInfo.hijri?.date} ({dateInfo.hijri?.month?.en})
                            </span>
                        </div>
                    )}
                </div>

                {/* Ramadan Fasting Section */}
                {/* Ramadan Fasting Section */}
                {prayerTimes && (
                    <div
                        className={`mx-6 mb-6 p-4 rounded-2xl border transition-all cursor-pointer ${isRamadan
                            ? "bg-emerald-50 border-emerald-100"
                            : "bg-slate-50 border-slate-100 opacity-75 hover:opacity-100"
                            }`}
                        onClick={() => {
                            if (!isRamadan) {
                                alert("Ramadan Mode will automatically activate during the holy month of Ramadan, showing Sehri and Iftar times.");
                            }
                        }}
                    >
                        <div className={`flex items-center gap-2 mb-3 ${isRamadan ? "text-emerald-800" : "text-slate-500"}`}>
                            <Moon className="w-5 h-5" />
                            <h3 className="font-bold">
                                {isRamadan ? "Ramadan Fasting" : "Ramadan Mode"}
                            </h3>
                            {!isRamadan && (
                                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-medium">
                                    Auto
                                </span>
                            )}
                        </div>

                        {isRamadan ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Sehri Ends</p>
                                    <p className="text-xl font-bold text-slate-800">{formatTime(prayerTimes.Fajr)}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Iftar Time</p>
                                    <p className="text-xl font-bold text-slate-800">{formatTime(prayerTimes.Maghrib)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 italic">
                                Activate seamlessly during Ramadan
                            </div>
                        )}
                    </div>
                )}

                {/* Qibla Compass Card */}
                <div
                    onClick={calculateQiblaDirection}
                    className="mx-6 mb-6 p-4 bg-white/50 rounded-2xl border border-white/50 cursor-pointer hover:bg-white/80 transition flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition">
                            <Compass className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Qibla Finder</h3>
                            <p className="text-xs text-slate-500">Locate Kaaba direction</p>
                        </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                        <span className="text-xl">🕋</span>
                    </div>
                </div>

                {/* Prayer Times Cards */}
                <div className="bg-gradient-to-b from-orange-100 to-orange-200 p-6 space-y-3">
                    {PRAYER_NAMES.map((prayer) => {
                        const isNext = prayer === nextPrayer;
                        return (
                            <div
                                key={prayer}
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isNext
                                    ? "bg-gradient-to-r from-orange-300 to-orange-400 shadow-lg scale-105 border-2 border-orange-500"
                                    : "bg-white/80 hover:bg-white/90"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl md:text-2xl">{PRAYER_ICONS[prayer]}</span>
                                    <span className={`font-semibold text-base md:text-lg ${isNext ? "text-slate-900" : "text-slate-700"
                                        }`}>
                                        {prayer}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3">
                                    <span className={`font-bold text-base md:text-lg ${isNext ? "text-slate-900" : "text-slate-600"
                                        }`}>
                                        {formatTime(prayerTimes[prayer])}
                                    </span>
                                    {isNext && (
                                        <span className="bg-slate-900 text-white text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full font-medium shadow-sm whitespace-nowrap">
                                            Upcoming
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Qibla Compass Modal */}
            {showQibla && (
                <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm aspect-[3/4] p-8 flex flex-col items-center relative overflow-hidden">
                        <button
                            onClick={closeQibla}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-slate-800 mb-1">Qibla Compass</h3>
                            <p className="text-slate-500 text-sm">Align top with Kaaba</p>
                        </div>

                        <div className="flex-1 flex items-center justify-center w-full relative">
                            {/* Compass Rose */}
                            <div
                                className="w-64 h-64 border-4 border-slate-200 rounded-full relative shadow-inner flex items-center justify-center transition-transform duration-500 ease-out"
                                style={{ transform: `rotate(${-deviceHeading}deg)` }}
                            >
                                <span className="absolute top-2 text-slate-400 font-bold text-xs">N</span>
                                <span className="absolute bottom-2 text-slate-400 font-bold text-xs">S</span>
                                <span className="absolute right-2 text-slate-400 font-bold text-xs">E</span>
                                <span className="absolute left-2 text-slate-400 font-bold text-xs">W</span>

                                {/* Qibla Indicator (Kaaba) */}
                                {qiblaDirection !== null && (
                                    <div
                                        className="absolute w-full h-full flex justify-center items-start"
                                        style={{ transform: `rotate(${qiblaDirection}deg)` }}
                                    >
                                        <div className="mt-4 flex flex-col items-center">
                                            <div className="text-4xl">🕋</div>
                                            <div className="w-1 h-3 bg-emerald-500 rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Static Phone Indicator */}
                            <div className="absolute w-full h-64 flex justify-center pointer-events-none">
                                <div className="w-1 h-8 bg-slate-800/20 rounded-full absolute top-0"></div>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            {qiblaDirection !== null && (
                                <p className="text-lg font-mono font-bold text-emerald-600">
                                    {Math.round(qiblaDirection)}°
                                </p>
                            )}
                            {(!window.DeviceOrientationEvent) && (
                                <p className="text-xs text-red-400 mt-2">
                                    Device orientation not supported
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsSettingsOpen(false)}
                >
                    <div
                        className="bg-white text-slate-900 w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 pb-12 md:pb-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">Prayer Settings</h3>
                        <div className="space-y-4">
                            {/* Notification Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <div className="font-bold text-slate-800">Adhan Notifications</div>
                                        <div className="text-xs text-slate-500">Get notified at prayer times</div>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!notificationsEnabled && notificationPermission !== "granted") {
                                            await requestNotificationPermission();
                                        } else {
                                            const newState = !notificationsEnabled;
                                            setNotificationsEnabled(newState);
                                            localStorage.setItem("prayerNotificationsEnabled", String(newState));
                                            if (!newState) {
                                                clearScheduledNotifications();
                                            }
                                        }
                                    }}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${notificationsEnabled ? "bg-emerald-500" : "bg-slate-300"
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${notificationsEnabled ? "translate-x-7" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Audio Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <div className="font-bold text-slate-800">Adhan Audio</div>
                                        <div className="text-xs text-slate-500">Play adhan sound at prayer times</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newState = !adhanAudioEnabled;
                                        setAdhanAudioEnabled(newState);
                                        localStorage.setItem("prayerAdhanAudioEnabled", String(newState));
                                    }}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${adhanAudioEnabled ? "bg-emerald-500" : "bg-slate-300"
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${adhanAudioEnabled ? "translate-x-7" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Test Demo Button */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-2xl">🧪</div>
                                    <div>
                                        <div className="font-bold text-slate-800">Test Demo Mode</div>
                                        <div className="text-xs text-slate-500">Test notification & audio in 3 minutes</div>
                                    </div>
                                </div>
                                {testDemoScheduled ? (
                                    <div className="bg-white p-3 rounded-lg text-center">
                                        <div className="text-sm text-slate-600 mb-1">Test scheduled in:</div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {Math.floor(testDemoCountdown / 60)}:{String(testDemoCountdown % 60).padStart(2, '0')}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={scheduleTestDemo}
                                        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                                    >
                                        Schedule Test Demo
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="w-full mt-6 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
