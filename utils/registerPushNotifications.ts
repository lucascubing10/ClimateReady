import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserDocument } from "../firebaseConfig";

// Configure how notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log("Must use physical device for push notifications");
      return null;
    }

    if (Constants.appOwnership === "expo") {
      console.warn(
        "Push notifications are not supported in Expo Go starting with SDK 53. Use an EAS development build instead: https://docs.expo.dev/develop/development-builds/introduction/."
      );
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Ask for permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permissions denied");
      return null;
    }

    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.expoProjectId ??
      (process.env.EXPO_PUBLIC_PROJECT_ID as string | undefined) ??
      (process.env.EXPO_PROJECT_ID as string | undefined);

    if (!projectId) {
      console.warn(
        "Expo project ID not found. Set EXPO_PUBLIC_PROJECT_ID or update app config to include extra.expoProjectId for push notifications."
      );
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const token = tokenResponse.data;

    console.log("✅ Device Push Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting push notification token:", error);
    return null;
  }
}

type StoredPushToken = {
  token: string;
  syncedAt?: number;
};

const getStorageKey = (userId: string) => `push_token:${userId}`;

export async function syncPushTokenForUser(userId: string | null | undefined): Promise<string | null> {
  if (!userId) {
    console.warn("Cannot sync push token without a user id");
    return null;
  }

  const token = await registerForPushNotificationsAsync();
  if (!token) {
    return null;
  }

  const storageKey = getStorageKey(userId);
  let stored: StoredPushToken | null = null;

  try {
    const storedRaw = await AsyncStorage.getItem(storageKey);
    stored = storedRaw ? (JSON.parse(storedRaw) as StoredPushToken) : null;
  } catch (error) {
    console.warn("Failed to read cached push token", error);
  }

  if (stored?.token === token && stored?.syncedAt) {
    return token;
  }

  const result = await updateUserDocument(userId, {
    pushToken: token,
    pushTokenUpdatedAt: Date.now(),
  });

  if (!result.success) {
    console.warn("Failed to sync push token to Firestore", result.error);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify({ token } as StoredPushToken));
    } catch (error) {
      console.warn("Failed to cache push token after unsuccessful sync", error);
    }
    return token;
  }

  try {
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ token, syncedAt: Date.now() } as StoredPushToken)
    );
  } catch (error) {
    console.warn("Failed to cache push token after sync", error);
  }

  return token;
}
