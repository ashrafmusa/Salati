// FIX: Switched to Firebase v9 modular imports to resolve module export errors across the app.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR WEB APP'S FIREBASE CONFIGURATION HERE ---
// You can get this from the Firebase console for your project.
const firebaseConfig = {
  apiKey: "AIzaSyDB3vIteP2K6ZEb2uRa_eO1S9OKUJpQwEQ",
  authDomain: "gen-lang-client-0735710592.firebaseapp.com",
  projectId: "gen-lang-client-0735710592",
  storageBucket: "gen-lang-client-0735710592.appspot.com",
  messagingSenderId: "611084672076",
  appId: "1:611084672076:web:8f206662371326677fe8e9",
};
// ---------------------------------------------------------


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);