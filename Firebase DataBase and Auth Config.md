# Firebase Backend Architecture for Salati

The backend for this application is built entirely on the **Firebase** platform, a powerful serverless framework from Google. This serverless model means you don't need to manage your own servers; instead, you can focus entirely on building the user experience.

The core backend consists of three main Firebase services:

## 1. Firebase Authentication

This service is the backbone of user management in the application. Its primary functions are:

-   **User Login**: Provides a secure and straightforward way for users to log in, specifically using their **phone numbers** and a One-Time Password (OTP).
-   **Secure Identity Management**: Firebase handles the entire authentication process, from generating and verifying the temporary password (OTP) to managing the user's session state.
-   **User ID (UID) Generation**: Once a user logs in successfully, Firebase issues a unique User ID (UID). This UID is critical as it's used to identify the user and secure their personal data within the database.

## 2. Cloud Firestore Database

Cloud Firestore is a flexible, scalable, NoSQL, document-based database. Its key feature is **real-time synchronization**.

-   **Data Structure**: Data in Firestore is organized into **collections** and **documents**. You can think of a collection as a folder and a document as a file within that folder.
-   **Real-time Synchronization**: The frontend code utilizes real-time event listeners, specifically the `onSnapshot()` function. This means that if any data in the database changes (for example, a product is updated by an admin), your application receives an immediate notification, and the UI is updated automatically without needing a manual refresh.

## 3. Firestore Security Rules

Data security in the backend is managed through Firestore Security Rules. These rules are a set of instructions you write to define who is allowed to access which data.

-   **Public Data**: Data intended to be shared with all users (such as the list of products) is stored in top-level collections like `products`.
-   **Private Data**: Data that must only be accessible to a single user (such as their personal shopping cart) is stored in subcollections under their user document, e.g., `/users/{userId}/cart`.

These rules ensure that a user can only read or write to their own private data, preventing any unauthorized access. This is why the `userId` (UID) obtained from Firebase Authentication is so important; it acts as the key to securing each user's private space within the database.