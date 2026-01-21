# Converting Deenly to an Android App

Since Deenly is a PWA (Progressive Web App), the best way to convert it to an Android App is using a **Trusted Web Activity (TWA)**. This wraps your live website into a native APK/AAB file that can be uploaded to the Play Store.

## Prerequisites
-   **Node.js** installed.
-   **Android Studio** installed (for the Android SDK).
-   **Deploy First:** Your app must be deployed to a live URL (e.g., Vercel) because the Android app will load that URL.

## Method: Using Bubblewrap (Recommended)
Bubblewrap is a formal tool from Google to convert PWAs to Android Apps easily.

### Step 1: Install Bubblewrap CLI
Open your terminal (Command Prompt or PowerShell) and run:
```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize the Android Project
1.  Create a new folder for the android project (e.g., `deenly-android`) and go into it.
2.  Run the init command with your **Live Vercel URL**:
    ```bash
    bubblewrap init --manifest https://your-deenly-app.vercel.app/manifest.json
    ```
    *(Replace the URL with your actual deployed URL)*

3.  **Answer the questions:**
    -   **Domain:** `your-deenly-app.vercel.app`
    -   **App Name:** Deenly
    -   **Launcher Color:** `#10b981` (Emerald Green)
    -   **Maskable Icon:** It will try to download the icon from your manifest. If it fails, point it to the local `public/pwa-icon-512.png`.

### Step 3: Build the APK
Run:
```bash
bubblewrap build
```
-   It might ask to install JDK or Android SDK tools; allow it to do so.
-   It will ask for a **KeyStore** (signing key). If you don't have one, it will help you create a new one. **Keep this key safe!** You need it to update the app later.

### Step 4: Install on Device
Once finished, you will have an `.apk` file (for testing) and an `.aab` file (for Play Store).
-   Connect your phone via USB (with Developer Options > USB Debugging enabled).
-   Run:
    ```bash
    bubblewrap install
    ```

---

## Important Note on Notifications & Audio
Since this app is essentially a "Special Browser Window" (TWA) pointing to your website:

1.  **Audio:** Background audio (Adhan) depends on Android's battery optimization. If the phone is locked, Android often pauses web audio to save battery.
    -   **Fix:** Users should allow "Background Activity" for the app in their Phone Settings.
2.  **Notifications:** The standard "Adhan" notification currently works when the app is open/active.
    -   For **guaranteed** background notifications (when app is closed), you would typically need to implement **Firebase Cloud Messaging (FCM)** (Web Push), which is a backend feature.
    -   However, installing the app improves the chances of local notifications working compared to just a browser tab.

## Alternative: Android Studio Manual WebView
If you prefer using Android Studio manually without Bubblewrap:
1.  Create a generic **"Empty Views Activity"** project.
2.  Add a `WebView` to `activity_main.xml`.
3.  In `MainActivity.java`, use `myWebView.loadUrl("https://your-site.vercel.app");`.
4.  Enable JavaScript: `myWebView.getSettings().setJavaScriptEnabled(true);`.
5.  Add `<uses-permission android:name="android.permission.INTERNET" />` to `AndroidManifest.xml`.

*Bubblewrap is strictly recommended over this manual method as it handles deep linking, status bars, and splashing screens automatically.*
