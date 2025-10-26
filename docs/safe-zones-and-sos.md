# Safe Zone Mapping & Emergency SOS Overview

This document explains how the Safe Zone mapping experience and the Emergency SOS workflow operate inside the ClimateReady mobile app. It highlights the runtime flow, data sources, platform services, and configuration requirements discussed during our review.

---

## Safe Zones Feature

### High-Level Flow
- `app/tabs/safeZones.tsx` renders the Safe Zones screen and wires up animation, filters, and list rendering.
- The screen consumes the `useSafeZones` hook (`features/safe-zones/hooks/useSafeZones.ts`). On first load it:
  1. Requests foreground location permission using `expo-location`.
  2. Resolves the users coordinates via `getLastKnownPositionAsync` or `getCurrentPositionAsync`.
  3. Fetches nearby zones from Google Places via `fetchGoogleSafeZones` and curated Firestore entries via `fetchFirestoreSafeZones`.
  4. Computes the distance to each zone with `calculateDistanceMeters` and stores the data locally.
- Filtering remains client-side. Default categories are hospitals and shelters and the default radius is 5 km. Radius options are 2/5/10/20 km and can be reset via the animated drawer controls.
- The map view (`SafeZoneMap.tsx`) uses `react-native-maps` to draw user location, safe zone markers, and a radius circle. Selecting a zone animates the map to its coordinates. On the web build, `SafeZoneMap.web.tsx` shows an informational fallback with an "Open in Google Maps" link.
- Individual cards (`SafeZoneCard.tsx`) present zone metadata (icon, address, distance via `metersToKilometers`) and include action buttons that focus the map on the chosen location.
- The hook exposes pull-to-refresh, error messaging, and fails gracefully if the Google Maps API key is missing.

### Data & Configuration
- **Firebase Firestore**: Curated zones live in the `safe_zones` collection. Expected fields include `name`, `type`, `latitude`, `longitude`, optional contact details, and `isActive` flags.
- **Google Places API**: Requires a server-side or Expo runtime key. The app reads the key from `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, or `GOOGLE_MAPS_API_KEY`. Configure it through `app.config.js` or the build environment.
- **Dependencies**: `expo-location`, `react-native-maps`, `@expo/vector-icons`, Firebase Firestore SDK, React Native Animated API, Expo Router.
- **Permissions**: Foreground location access is mandatory; the UI includes prompts and reset states when permission is denied.
- **Platform Behavior**: Native apps display interactive maps; the web target shows a static helper panel due to the missing native map implementation.

### Failure & Retry Considerations
- Missing Google API keys trigger inline error messages and prevent remote results from populating.
- `AbortController` instances ensure fetches are cancelled when the user updates filters rapidly or leaves the screen.
- Firestore fetch failures are logged but do not crash the UI; the list simply renders empty with guidance for users.

---

## Emergency SOS Feature

### Main Activation Flow
1. `app/tabs/sos.tsx` loads, checks AsyncStorage (`SOS_ACTIVE_KEY`) via `checkActiveSOSSession`, and resumes an existing session if one exists.
2. When the user initiates SOS (`startSOSSession`):
   - A Firestore document is created in the `sos_sessions` collection with personal and medical metadata controlled by SOS settings.
   - A secure access token is minted using `expo-crypto` and stored alongside the session.
   - The session ID is persisted locally so background services know an alert is active.
3. Foreground location tracking starts with `Location.watchPositionAsync`, pushing updates to Firestore through `updateSOSLocation`.
4. Background tracking is configured through `backgroundLocationService.ts` using Expo Task Manager and Background Fetch. It keeps sending coordinates until the alert ends or permissions are revoked.
5. `createSOSTrackingLink` builds a shareable URL that points to the companion Vite tracker (`sos-live-tracker-map`) and includes the session token.
6. `sendSOSSMS` composes the emergency text (name, tracking link, optional medical details) and sends it using `expo-sms`. If SMS is unavailable, it opens the native composer with `Linking.openURL`.
7. A local notification is issued through `expo-notifications` so the user stays aware that SOS remains active.
8. `notificationService.ts` contains placeholder logic for notifying responders (currently logging and reusing the tracker link) and helper methods for storing Expo push tokens.

### Ending & Resuming Sessions
- Ending SOS calls `endSOSSession`, marking the Firestore document inactive, recording `endTime`, stopping foreground/background tracking, and clearing AsyncStorage.
- The `autoActivate=true` query parameter allows deep links or quick actions to launch the flow immediately without confirmation prompts.
- `sos-settings.tsx` lets users toggle which medical fields are shared, persisting choices with `AsyncStorage` via `saveSOSSettings`/`getSOSSettings`.
- `sos-history.tsx` queries Firestore for previous sessions ordered by start time. It surfaces durations, last known coordinates, and view counts to inform the user of past alerts.

### Data & Services
- **Firestore Collections**: `sos_sessions` stores session state, location updates, and access tokens. `users` holds profile data and optional Expo push tokens. AsyncStorage keeps local state for active sessions and sharing preferences.
- **Expo Packages**: `expo-location`, `expo-task-manager`, `expo-background-fetch`, `expo-sms`, `expo-linking`, `expo-notifications`, `expo-crypto`, and `expo-constants` (for environment extras).
- **Authentication**: `AuthContext` supplies the Firebase user ID, emergency contacts, and medical details required to populate the SOS payload.
- **External Dependencies**: None for messaging beyond the devices built-in SMS capability. Push notification support is scaffolded but requires backend integration to dispatch alerts to contacts.

### Permissions & Compliance
- Foreground and background location permissions are required for full functionality. Background tracking is attempted only after confirming availability (`Location.isBackgroundLocationAvailableAsync`).
- SMS requires carrier plan support; on devices without SMS capability (e.g., tablets) the fallback composer may still fail. The UI alerts users accordingly.
- Medical information sharing respects user toggles stored locally; by default the app shares age, blood type, allergies, conditions, and medications when the data exists.

### Operational Notes
- The tracker link depends on the environment variable `sosWebAppUrl` sourced from `app.config.js` or Expo extras. Ensure the companion tracker app honors the access token before exposing production data.
- `notificationService.ts` currently logs outbound responder alerts. Hook this into a backend or third-party SMS/push provider if automated responder notifications are required.
- Background tasks must be declared in native project settings (`app.json` / Android manifest) when shipping production builds. Expos bare or custom dev client is recommended for full testing.

---

## Shared Considerations
- **Navigation**: Expo Router handles screen transitions and deep-link return paths (`returnTo` query params) across both features.
- **UI/UX**: Icons originate from `Ionicons`. Styling is implemented with React Native`s `StyleSheet` to stay consistent across platforms.
- **Testing Tips**:
  - For Safe Zones, test with and without valid API keys, and simulate permission denial to validate empty/error states.
  - For SOS, use a physical device to validate SMS availability, background tracking, and Firestore updates; emulate the auto-activate parameter for quick-launch scenarios.
- **Environment Files**: Keep sensitive keys out of source control. Use `.env` + runtime extras for Google Maps and SOS tracker URLs. Firebase configuration is handled via `firebaseConfig.js` and `google-services.json` for Android.

---

## Quick Reference

| Area | Key Files | Primary Dependencies |
| --- | --- | --- |
| Safe Zones UI | `app/tabs/safeZones.tsx`, `SafeZoneMap.tsx`, `SafeZoneCard.tsx` | `expo-location`, `react-native-maps`, Firestore, Google Places API |
| Safe Zones Data | `useSafeZones.ts`, `services/firestore.ts`, `services/googlePlaces.ts` | Firestore SDK, Fetch API, Google Places REST |
| SOS Screen | `app/tabs/sos.tsx` | `expo-location`, `expo-sms`, `expo-notifications`, Firestore, AsyncStorage |
| SOS Background | `utils/sos/backgroundLocationService.ts`, `utils/sos/sosService.ts` | Expo Task Manager, Background Fetch, Firestore, Expo Crypto |
| SOS Settings | `app/tabs/sos-settings.tsx` | AsyncStorage, Auth context |
| SOS History | `app/tabs/sos-history.tsx` | Firestore query APIs |

Use this document as a single reference for onboarding, troubleshooting, or extending the Safe Zone Mapping and Emergency SOS features within ClimateReady.
