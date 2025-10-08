# ClimateReady Command Reference

This cheat sheet lists the CLI commands we rely on most when building and debugging the Expo-based Android app on Windows PowerShell.

## Expo development workflow

```powershell
# Start Metro for an installed development client (daily coding loop)
npx expo start --dev-client

# Rebuild and install the native Android development client
npx expo run:android --variant development

# Same as above, but with verbose Gradle logging for troubleshooting
npx expo run:android --variant development -- --stacktrace --info
```

## Android Gradle maintenance

```powershell
# Clean Gradle build artifacts (run after dependency changes or flaky builds)
cd android
.\gradlew.bat clean
cd ..
```

## Android Debug Bridge (ADB)

```powershell
# List connected Android devices and their status
adb devices

# Remove an existing installation of the dev client from a device
adb uninstall com.yourcompany.climateready

# Sideload the freshly built development APK onto a connected device
adb install -r android\app\build\outputs\apk\development\app-development.apk
```

## Environment helpers

```powershell
# (Example) Set Expo project ID for the current shell session
$env:EXPO_PUBLIC_PROJECT_ID = "your-eas-project-id"

# Print the active Java home path to confirm JDK 17 is selected
$env:JAVA_HOME
```

> **Tip:** When a command fails, re-run it with `--stacktrace --info` (for Gradle) or check the Metro console for detailed logs. Always confirm the device shows up in `adb devices` before installing builds.
