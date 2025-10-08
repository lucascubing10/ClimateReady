# ClimateReady

ClimateReady is a mobile-first climate resilience companion built with Expo and React Native. It helps households and communities prepare for extreme weather through tailored guidance, safe-zone coordination, SOS tools, and educational content that works offline-first.

## ✨ Feature highlights
- **Personalised preparedness hub** – aggregated climate news, weather updates, and at-a-glance emergency tasks.
- **Safe zone & SOS workflows** – share live locations, trigger SOS notifications, and review safety history.
- **Community engagement** – discussion boards and chat threads that keep neighbours informed.
- **Toolkit & simulations** – interactive mini-games and education modules to build practical readiness skills.
- **Push notifications** – Expo notifications deliver urgent alerts when using a development or production build.

## 🧰 Tech stack
- [Expo SDK 54](https://docs.expo.dev/versions/latest/) on top of **React Native 0.81** with [Expo Router](https://expo.github.io/router/).
- Firebase for authentication and data synchronisation.
- Socket.io for live SOS tracking and community events.
- TypeScript, Expo modules, and Gradle-managed native Android project (`android/`).

## 📂 Repository tour
- `app/` – screens, stacks, and tabs implemented with Expo Router.
- `components/` – shared UI building blocks.
- `constants/`, `utils/`, `services/` – configuration, helpers, and API clients (including the push notification helper).
- `context/` – React contexts such as authentication state.
- `android/` – committed native project customised for Expo SDK 54 (Gradle settings, Kotlin config, dev build variant).
- `docs/` – additional documentation such as the [command reference](docs/command-reference.md).
- `sos-live-tracker-map/` – companion Vite app for SOS live-tracking visualisations.

## 🚀 Getting started

### Prerequisites
- Node.js **18 LTS** or newer (Expo SDK 54 requirement)
- npm (ships with Node)
- Android Studio with SDK **36**, NDK **27.1.12297006**, and at least one emulator or a physical device
- JDK **17** (set `JAVA_HOME` accordingly for Gradle)
- Optional: [Expo CLI](https://docs.expo.dev/get-started/installation/), [EAS CLI](https://docs.expo.dev/build/setup/) if you plan to run remote builds

### Clone & install
```powershell
git clone https://github.com/NIKKAvRULZ/ClimateReady.git
cd ClimateReady
npm install
```

### Configure environment variables
Create a `.env` file (not committed to Git) and provide the values used by `app.config.js` and runtime helpers:

```
EXPO_PUBLIC_PROJECT_ID=<your-eas-project-id>
OPENWEATHER_API_KEY=<openweathermap-api-key>
SOS_WEB_APP_URL=<url-of-live-tracking-app>
```

Other Expo configuration values (for example `APP_NAME`, `ANDROID_PACKAGE_NAME`) can also live in the `.env` file as needed; see `app.config.js` for the full list. When using PowerShell, you can set one-off values like this:

```powershell
$env:EXPO_PUBLIC_PROJECT_ID = "<your-eas-project-id>"
```

## 🏃‍♀️ Development workflow

1. **(First time)** Build and install the native development client on your Android device:
   ```powershell
   npx expo run:android --variant development
   ```
   Add `-- --stacktrace --info` whenever you need deeper Gradle diagnostics.

2. **Start Metro in dev-client mode** and connect your device or emulator:
   ```powershell
   npx expo start --dev-client
   ```

3. **Optional maintenance commands** are documented in [`docs/command-reference.md`](docs/command-reference.md) – including `adb` utilities and Gradle clean.

4. **Linting:**
   ```powershell
   npm run lint
   ```

## 🔔 Push notifications
- Expo Go no longer supports remote push tokens as of SDK 53. Always run the climate app inside a **development build** or production build when testing notifications.
- Ensure `EXPO_PUBLIC_PROJECT_ID` (or `EXPO_PROJECT_ID`) is available before launching; otherwise `registerPushNotifications.ts` will log a warning and skip registration.
- Android channels are configured automatically in the helper. Watch the Metro logs for the “Expo push token ready” message after sign-in.

## 🌐 Companion apps
The SOS live-tracking web experience lives in a standalone repository: [ClimateReady SOS Live Tracker Map](https://github.com/R-Tharanka/sos-live-tracker-map). Consult that project’s README for build and deployment instructions, and keep `SOS_WEB_APP_URL` in sync with the hosted URL.

## 🤝 Contributing
Contributions are welcome! Please open an issue to discuss significant changes. When submitting a PR, run `npm run lint` and include any relevant updates to documentation or screenshots.

## 📄 License
Released under the [MIT License](LICENSE).
