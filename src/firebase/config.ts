// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { seedDatabase } from "./seed";

// Firebase configuration is loaded from environment variables for security.
// FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'" when accessing environment variables in Vite.
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

// A check to ensure all required environment variables are present during development.
// FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'" when accessing environment variables in Vite.
if ((import.meta as any).env.DEV && Object.values(firebaseConfig).some(value => !value)) {
    console.error("Firebase configuration is missing. Make sure you have a .env file with all the required VITE_FIREBASE_ variables.");
}

// FIX: Refactored Firebase initialization to use v8 compat syntax.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// FIX: Refactored Firebase service exports to use v8 compat syntax.
export const auth = firebase.auth();
export const db = firebase.firestore();

// Export an initialization function that handles asynchronous setup.
export const initializeFirebase = async () => {
  try {
    // Enable Firestore offline persistence for a better offline experience and faster startup.
    // FIX: Refactored enable persistence call to use v8 compat syntax.
    await db.enablePersistence();
  } catch (err: any) {
    if (err.code == 'failed-precondition') {
        // This can happen if multiple tabs are open.
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence.
        console.warn('Firestore persistence is not supported in this browser.');
    }
  }
  // The automatic seeding call has been removed from here to prevent permission errors on startup.
  // Seeding should be done manually by a Super Admin from the settings page.
};
