import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Firebase configuration is loaded from environment variables for security.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// A check to ensure all required environment variables are present during development.
if (import.meta.env.DEV && Object.values(firebaseConfig).some(value => !value)) {
    console.error("Firebase configuration is missing. Make sure you have a .env file with all the required VITE_FIREBASE_ variables.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Firestore offline persistence for a better offline experience and faster startup.
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // This can happen if multiple tabs are open.
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence.
        console.warn('Firestore persistence is not supported in this browser.');
    }
});
