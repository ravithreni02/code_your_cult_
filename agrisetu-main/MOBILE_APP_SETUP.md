# Build the AgriSetu mobile app

AgriSetu uses Capacitor to package the Vite production build. The app is configured to load the local `dist/` directory, so the APK does not depend on a hosted development preview.

## Prerequisites

- Node.js 18 or newer
- Android Studio with an Android SDK
- Java version supported by the installed Android Gradle plugin

## Build

```bash
npm install
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

In Android Studio, use **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The debug APK is written under `android/app/build/outputs/apk/debug/`.

After web changes, repeat:

```bash
npm run build
npx cap sync android
```

Configure the production Supabase URL and OAuth redirect URLs in the Supabase dashboard before testing sign-in on a device.
