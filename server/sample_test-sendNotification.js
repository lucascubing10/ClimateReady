//only for testing sending a notification from server to device

import admin from "firebase-admin";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./climateready-40665-firebase-adminsdk-fbsvc-caf96cfc09.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const message = {
  token: "<device_fcm_token>", // This comes from your Expo/Firebase client app
  notification: {
    title: "Emergency Alert",
    body: "This is a test notification",
  },
};

admin.messaging().send(message)
  .then((response) => console.log("✅ Message sent successfully:", response))
  .catch((error) => console.error("❌ Error sending message:", error));
