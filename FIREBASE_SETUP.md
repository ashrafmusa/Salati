# Firebase Integration Guide for Salati App

This document provides a step-by-step guide to connect the Salati application to a live Firebase backend, replacing the current mock data and `localStorage` implementation.

## Prerequisites

Before you begin, ensure you have the following:

1.  A Google Account.
2.  A [Firebase](https://firebase.google.com/) account (you can sign up with your Google account).

---

## Step 1: Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click on **"Add project"** and give your project a name (e.g., "Salati-App").
3.  Follow the on-screen instructions. You can disable Google Analytics for this project if you wish.
4.  Once your project is ready, click the Web icon (`</>`) to add a new web app.
5.  Register your app with a nickname (e.g., "Salati Web App").
6.  Firebase will provide you with a configuration object. **Copy this object.** It will look like this:

    ```javascript
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "1:..."
    };
    ```

---

## Step 2: Configure Firebase in the App

The project is now set up to use environment variables for security. You will need to create a `.env.local` file for development and configure these variables in your hosting provider (e.g., Netlify) for production.

1.  Create a file named `.env.local` in the root of your project.
2.  Copy the contents of `.env.example` into this new file.
3.  Replace the placeholder values in `.env.local` with your actual Firebase config values.

---

## Step 3: Set Up Firebase Authentication

The app uses both phone and email authentication.

1.  In the Firebase Console, go to **Authentication** from the left-hand menu.
2.  Click the **"Sign-in method"** tab.
3.  Select **"Phone"** from the list of providers and enable it.
4.  Select **"Email/Password"** from the list and enable it.
5.  **Important**: For the reCAPTCHA verification to work during development, you must add your local development domain to the authorized domains.
    *   Go to Authentication -> Settings -> Authorized domains.
    *   Click **"Add domain"** and add `localhost`.

---

## Step 4: Set Up Cloud Firestore Database

1.  In the Firebase Console, go to **Firestore Database**.
2.  Click **"Create database"**.
3.  Start in **Production mode**. This ensures your data is secure from the start.
4.  Choose a location for your database (e.g., `us-central`).

---

## Step 5: Configure Firestore Security Rules

Secure your database by defining who can read and write data. These rules are critical for protecting your application and implementing the new admin roles.

1.  In the Firestore console, go to the **"Rules"** tab.
2.  Replace the default rules with the following rules. These rules grant administrators granular access based on their specific role.

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
    
        // --- HELPER FUNCTIONS for Role-Based Access Control ---
        function getRole() {
          return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
        }
        function isSuperAdmin() { return getRole() == 'super-admin'; }
        function isAdmin() { return getRole() == 'admin'; }
        function isSubAdmin() { return getRole() == 'sub-admin'; }
        function isAnyAdmin() { return isSuperAdmin() || isAdmin() || isSubAdmin(); }
        function isFullAdmin() { return isSuperAdmin() || isAdmin(); }
    
        // --- PUBLIC & ADMIN COLLECTIONS ---
        
        // Items, Bundles, extras, offers, and categories are public to read for everyone.
        // Write permissions are restricted based on roles.
        match /items/{docId} { allow read: if true; allow write: if isSuperAdmin(); }
        match /bundles/{docId} { allow read: if true; allow write: if isFullAdmin(); }
        match /extras/{docId} { allow read: if true; allow write: if isSuperAdmin(); }
        match /offers/{docId} { allow read: if true; allow write: if isFullAdmin(); }
        match /drivers/{docId} { allow read, write: if isFullAdmin(); }
        match /notifications/{docId} { allow read, write: if isAnyAdmin(); }
        match /categories/{docId} { allow read: if true; allow write: if isSuperAdmin(); }
        
        // --- SCM & AUDITING COLLECTIONS ---
        match /suppliers/{docId} { allow read, write: if isFullAdmin(); }
        match /purchaseOrders/{docId} { allow read, write: if isFullAdmin(); }
        match /auditLogs/{logId} {
          allow read: if isSuperAdmin();
          allow create: if isAnyAdmin();
        }
        
        // Store settings are public to read, but only super admins can change them.
        match /settings/{docId} { allow read: if true; allow write: if isSuperAdmin(); }
    
        // Reviews can be read by anyone, created by any logged-in user, and deleted by full admins.
        match /reviews/{docId} {
          allow read: if true;
          allow create: if request.auth != null;
          allow delete: if isFullAdmin();
        }
    
        // Orders can be created by a user, but only read by that user or any admin level.
        // Any admin level can update orders (e.g., change status, assign driver).
        // Only full admins (admin, super-admin) can delete orders.
        match /orders/{orderId} {
          allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
          allow read: if request.auth.uid == resource.data.userId || isAnyAdmin();
          allow update: if isAnyAdmin();
          allow delete: if isFullAdmin();
          
          // --- ORDER SUBCOLLECTION: ACTIVITY LOG ---
          match /activityLog/{logId} {
            function isAssignedDriver() {
              return request.auth.uid == get(/databases/$(database)/documents/orders/$(orderId)).data.driverId;
            }
            
            allow read: if isAnyAdmin() || isAssignedDriver() || (request.auth.uid == get(/databases/$(database)/documents/orders/$(orderId)).data.userId && resource.data.visibility == 'public');
            
            allow create: if
              (request.auth.uid == get(/databases/$(database)/documents/orders/$(orderId)).data.userId &&
                request.resource.data.type == 'customer_message' &&
                request.resource.data.visibility == 'public' &&
                request.resource.data.authorId == request.auth.uid) ||
              (isAssignedDriver() &&
                (request.resource.data.type == 'driver_note' || request.resource.data.type == 'issue') &&
                request.resource.data.visibility == 'internal' &&
                request.resource.data.authorId == request.auth.uid) ||
              (isAnyAdmin() &&
                (request.resource.data.type == 'admin_message' || request.resource.data.type == 'internal_note' || request.resource.data.type == 'system_log') &&
                request.resource.data.authorId == request.auth.uid);
          }
        }
        
        // --- USER-SPECIFIC DATA ---

        match /users/{userId} {
          // A user is created when they sign up.
          allow create: if request.auth.uid == userId;
          
          // A user can be read by themselves or any admin.
          allow read: if request.auth.uid == userId || isAnyAdmin();
          
          // A user can update their own profile. A super-admin can update any user's profile.
          allow update: if request.auth.uid == userId || isSuperAdmin();
          
          // Only a super-admin can delete a user document.
          allow delete: if isSuperAdmin();
          
          // User subcollections (cart, wishlist) can only be accessed by the owner.
          match /{subcollection}/{docId} {
            allow read, write: if request.auth.uid == userId;
          }
        }
      }
    }
    ```
3.  Click **"Publish"**.

---

## Step 6: Add Initial Data Manually

To get started quickly, you can manually add some data to your Firestore database for the new collections: `items`, `bundles`, `categories`, `extras`.