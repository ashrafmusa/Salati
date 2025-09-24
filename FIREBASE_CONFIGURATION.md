# Firebase Configuration Guide for Salati App

This document provides a step-by-step guide to connect the Salati application to a live Firebase backend, replacing the current mock data and `localStorage` implementation with a scalable, real-time solution.

## Step 1: Create a Firebase Project

First, you need a Firebase project to host your backend services.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click on **"Add project"** and give your project a name (e.g., "Salati-App").
3.  Follow the on-screen instructions. You can disable Google Analytics for this project if you wish.
4.  Once your project is ready, click the **Web icon (`</>`)** on the project overview page to add a new web app.
5.  Register your app with a nickname (e.g., "Salati Web App").
6.  Firebase will provide you with a configuration object. **Copy this `firebaseConfig` object.** You will need it in Step 5.

---

## Step 2: Set Up Firebase Authentication with Phone Sign-In

The app is designed for users to sign in with their mobile number via a One-Time Password (OTP).

1.  In the Firebase Console, go to **Authentication** from the left-hand menu.
2.  Click the **"Sign-in method"** tab.
3.  Select **"Phone"** from the list of providers and **enable it**.
4.  **Important**: For the reCAPTCHA verification to work on your local machine, you must authorize your development domain.
    *   Go to Authentication -> Settings -> **Authorized domains**.
    *   Click **"Add domain"** and add `localhost`.

---

## Step 3: Set Up Cloud Firestore Database

Firestore will store all your application data, from products to user orders.

1.  In the Firebase Console, go to **Firestore Database**.
2.  Click **"Create database"**.
3.  Start in **Production mode**. This ensures your data is secure by default.
4.  Choose a location for your database (e.g., `us-central`). Click **"Enable"**.

Your database will use the following collections based on the app's structure:
-   `products`: For all products like groceries, electronics, etc.
-   `extras`: For all optional extra items.
-   `promotionalBanners`: For promotional banners on the home screen.
-   `reviews`: For user-submitted reviews.
-   `users`: Stores public information for each user.
    -   `users/{userId}/orders`: A subcollection for each user's order history.
    -   `users/{userId}/wishlist`: A subcollection for each user's favorited items.

---

## Step 4: Configure Firestore Security Rules

These rules protect your data by defining who can access what.

1.  In the Firestore console, go to the **"Rules"** tab.
2.  Replace the default rules with the following code. These rules make product data public while ensuring user data remains private.

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
    
        // PUBLIC DATA: Anyone can read this information.
        // Writing should be restricted to admins (handled via backend logic or admin roles).
        match /products/{productId} {
          allow read: if true;
          allow write: if false; // Protects data from being changed by users
        }
        match /extras/{extraId} {
          allow read: if true;
          allow write: if false;
        }
        match /promotionalBanners/{bannerId} {
          allow read: if true;
          allow write: if false;
        }
        match /reviews/{reviewId} {
          allow read: if true;
          // Allow users to create reviews if they are logged in.
          allow create: if request.auth != null;
        }
    
        // USER DATA: Only the authenticated user can access their own private data.
        match /users/{userId} {
          // A user can create, read, and update their own profile document.
          allow create, read, update: if request.auth != null && request.auth.uid == userId;
    
          // A user can manage their own orders (create and read only).
          match /orders/{orderId} {
            allow create, read: if request.auth != null && request.auth.uid == userId;
            allow update, delete: if false; // Prevent users from changing their order history
          }
    
          // A user can manage their own wishlist.
          match /wishlist/{productId} {
            allow read, write, delete: if request.auth != null && request.auth.uid == userId;
          }
        }
      }
    }
    ```
3.  Click **"Publish"**.

---

## Step 5: Connect Your App to Firebase

1.  In your project code, open the file `firebase/config.ts`.
2.  **Paste your unique `firebaseConfig` object** from Step 1 into the designated place. The file should now look like this:

    ```typescript
    // firebase/config.ts
    import firebase from "firebase/compat/app";
    import "firebase/compat/auth";
    import "firebase/compat/firestore";

    // Your web app's Firebase configuration - PASTE YOUR CONFIG HERE
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "1:..."
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);

    // Initialize and export Firebase services
    export const auth = firebase.auth();
    export const db = firebase.firestore();
    ```
---

## Step 6: (Optional) Add Initial Data Manually

To see products in your app immediately, you can add some of the mock data to Firestore.

1.  Go to the Firestore console.
2.  Click **"+ Start collection"** and enter `products` as the Collection ID.
3.  Click **"Auto-ID"** to create a new document for your first product.
4.  Add fields that match the `Product` type in `types.ts`. For example:
    *   `arabicName` (Type: string, Value: 'سلة الفطور السوداني')
    *   `category` (Type: string, Value: 'منتجات غذائية')
    *   `price` (Type: number, Value: 8000)
    *   `contents` (Type: array) -> Add map objects with `name`, `quantity`, and `price` fields.
5.  Repeat this process for a few products, and create new collections like `extras` and `promotionalBanners`.
