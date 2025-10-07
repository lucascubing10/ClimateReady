import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

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

    // ✅ Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: "climateready-40665", // your Firebase project ID
    })).data;

    console.log("✅ Device Push Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting push notification token:", error);
    return null;
  }
}
