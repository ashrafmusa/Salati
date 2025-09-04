// FIX: Switched to Firebase v8 compat imports to resolve module export errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

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
// Check if the app is already initialized to avoid errors.
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// FIX: Switched to v8 compat syntax for auth and firestore.
export const auth = firebase.auth();
export const db = firebase.firestore();
