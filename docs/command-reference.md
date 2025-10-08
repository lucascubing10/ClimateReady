# ClimateReady Command Reference

Go-to CLI commands for developing and debugging the Expo-based Android app on Windows PowerShell. Commands are grouped in the order you typically need them.

## Project setup

```powershell
# Install JS dependencies after cloning or pulling new changes
npm install
```

## Daily development loop

```powershell
# 1) Start Metro for an already-installed development client
npx expo start --dev-client

# 2) (Only when native code or config changes) rebuild and reinstall dev client
npx expo run:android --variant development

# 3) Re-run the native build with verbose logging when diagnosing Gradle failures
npx expo run:android --variant development -- --stacktrace --info
```

## Native build maintenance

```powershell
# Clear Gradle caches/artifacts when builds behave oddly or after dependency changes
cd android
.\gradlew.bat clean
cd ..
```

## Android device management (ADB)

```powershell
# Confirm your device is connected and authorized
adb devices

# Uninstall any previously installed ClimateReady dev client (prevents signature conflicts)
adb uninstall com.yourcompany.climateready

# Sideload the freshly built development APK onto the connected device
adb install -r android\app\build\outputs\apk\development\app-development.apk
```

## Environment helpers

```powershell
# (Per-shell) Set Expo project ID before running native builds
$env:EXPO_PUBLIC_PROJECT_ID = "your-eas-project-id"

# Persist the Expo project ID for future shells (optional)
setx EXPO_PUBLIC_PROJECT_ID "your-eas-project-id"

# Check the active Java home to verify JDK 17 is selected
echo $env:JAVA_HOME
```

> **Tips:**
> - When a native build fails, add `--stacktrace --info` (already shown above) for more Gradle diagnostics.
> - Always confirm the device appears as `device` (not `unauthorized`) in `adb devices` before installing builds.
> - After rebuilding the dev client, return to `npx expo start --dev-client` for hot-reload development.
