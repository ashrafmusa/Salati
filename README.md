# Salati (سـلـتـي) - Integrated Shopping Platform

**Salati** is a complete, direct-to-consumer digital retail platform for a wide range of products, from daily groceries to real estate. It's built with a modern, mobile-first approach and features a streamlined shopping experience for customers and a powerful dashboard for administrators. The entire system is a **full-stack serverless application**, using **Firebase** for authentication, real-time database, and hosting.

---

## 🛍️ Customer-Facing App (For Buyers)

-   **Dual Authentication**: Secure user registration and login using either a **phone number (OTP)** or **email and password**.
-   **Real-time Product Catalog**: Browse a home screen with promotional banners, filterable categories, and a search bar, with all data served in real-time from a **Cloud Firestore** database.
-   **Integrated Real Estate Platform**: A dedicated section for browsing, searching, and inquiring about property and building rentals.
-   **Persistent & Synced User Data**: A user's shopping cart and wishlist are saved to their Firestore account, persisting and syncing across all their devices and sessions.
-   **Guest Browsing with Seamless Migration**: Unregistered users can browse and add items to a temporary cart stored locally. Upon logging in, their local cart is automatically merged with their cloud-synced cart.
-   **Live Customer Reviews**: Read and submit reviews for products. New reviews are saved to Firestore and appear for all users in real-time.
-   **Centralized Profile Management**: A dedicated "My Account" screen to view/edit personal details and access a full order history, all managed in Firestore.
-   **Full Dark Mode Support**: A beautiful, consistent dark theme is available and can be controlled via a toggle.

## ⚙️ Admin Panel (For Business Management)

-   **Multi-Tiered Role-Based Access**: The admin panel is protected by **Firebase Auth and Firestore Security Rules**, featuring multiple admin levels:
    -   **Super Admin**: Full control over the entire platform, including the ability to manage other admins.
    -   **Admin**: Can manage all operational aspects like products, orders, and offers, but cannot manage other admin users.
    -   **Sub-Admin**: Limited access to core operational tasks, primarily viewing the dashboard and managing orders.
-   **AI-Powered Idea Generation**: Super Admins can use a Google Gemini-powered feature to automatically generate creative and marketable bundle ideas from the existing list of individual products.
-   **Real-time Analytics Dashboard**: An insightful dashboard with an at-a-glance overview of key metrics like total revenue, new orders, and customer counts, all calculated in real-time from Firestore data.
-   **Live Order Management**: View a list of all customer orders as they come in. Filter, search, and update order statuses, with changes reflected instantly for customers.
-   **Full Product & Real Estate Management (CRUD)**: A full Create, Read, Update, and Delete interface for managing the product catalog and real estate listings directly in the Firestore database (Admin/Super Admin only).
-   **User Role Management**: The Super Admin can view all users and manage their roles, promoting customers to `sub-admin` or `admin` directly from the panel.
-   **Responsive & Mobile-First**: Fully functional on any device with a dynamic, role-based collapsible sidebar and adaptive data tables.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Backend & Database**: Firebase (Authentication, Cloud Firestore)
-   **AI Features**: Google Gemini API (`@google/genai`)
-   **Image Management**: Cloudinary
-   **Data Storage**: Cloud Firestore (for all app data), Browser `localStorage` (for guest cart only)
-   **Routing**: React Router
-   **State Management**: React Context API (for Auth, Cart, Wishlist, and Theme state)
-   **Deployment**: Static hosting, ready for Firebase Hosting.

---

## 📂 Application Structure

```
.
├── admin.html                 # Entry point for the Admin Panel
├── index.html                 # Entry point for the Customer App
├── src/firebase
│   └── config.ts              # Firebase configuration and service initialization
├── src/contexts
│   ├── AuthContext.tsx        # Manages user sessions with Firebase Auth and Firestore user documents
│   ├── CartContext.tsx        # Manages shopping cart state (Firestore for users, localStorage for guests)
│   └── ...
└── ...
```

---

## 🚀 Getting Started

To run this project, you need to connect it to your own Firebase project and configure the necessary API keys.

### Prerequisites

-   A Firebase account.
-   A Cloudinary account (for image hosting).
-   A Google AI Studio account (for a Gemini API key).
-   Node.js and npm installed.

### Installation & Setup

1.  **Create a Firebase Project**: Follow the instructions in the Firebase documentation to create a new project.
2.  **Get Firebase Config**: From your Firebase project settings, copy your web app's `firebaseConfig` object.
3.  **Configure Environment Variables**:
    -   Create a file named `.env` in the root of your project.
    -   Add your Firebase config values to this file, prefixed with `VITE_`.
    -   Add keys for Cloudinary and Gemini as well. Your file should look like this:
        ```
        # Firebase Config
        VITE_FIREBASE_API_KEY="AIza..."
        VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
        VITE_FIREBASE_PROJECT_ID="your-project"
        VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
        VITE_FIREBASE_MESSAGING_SENDER_ID="..."
        VITE_FIREBASE_APP_ID="1:..."

        # Cloudinary Config (for image uploads)
        VITE_CLOUDINARY_CLOUD_NAME="your-cloud-name"
        VITE_CLOUDINARY_UPLOAD_PRESET="your-unsigned-upload-preset"

        # Google Gemini Config (for AI features)
        VITE_GEMINI_API_KEY="your-gemini-api-key"
        ```
4.  **Install Dependencies**: `npm install`
5.  **Run Locally**: `npm run dev`
6.  **Open the app**: Navigate to the local address provided by Vite (e.g., `http://localhost:5173`).