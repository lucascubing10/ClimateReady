// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB40FDC0EdiQIi2yOAmNUeK5qxRf2NTcnI",
  authDomain: "climateready-40665.firebaseapp.com",
  projectId: "climateready-40665",
  storageBucket: "climateready-40665.firebasestorage.app",
  messagingSenderId: "438204560483",
  appId: "1:438204560483:web:76dd8e0a5f5551e85fb456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth & firestore
export const auth = getAuth(app);
export const db = getFirestore(app);