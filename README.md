# Salati (سـلـتـي) - Integrated Shopping Platform

**Salati** is a complete, direct-to-consumer digital retail platform for a wide range of products, from daily groceries to real estate. It's built with a modern, mobile-first approach and features a streamlined shopping experience for customers and a powerful dashboard for administrators. The entire system is a **full-stack serverless application**, using **Firebase** for authentication, real-time database, and hosting.

---

## 🛍️ Customer-Facing App (For Buyers)

-   **Dual Authentication**: Secure user registration and login using either a **phone number (OTP)** or **email and password**.
-   **Real-time Product Catalog**: Browse a home screen with promotional banners, filterable categories, and a search bar, with all data served in real-time from a **Cloud Firestore** database.
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
-   **Real-time Analytics Dashboard**: An insightful dashboard with an at-a-glance overview of key metrics like total revenue, new orders, and customer counts, all calculated in real-time from Firestore data.
-   **Live Order Management**: View a list of all customer orders as they come in. Filter, search, and update order statuses, with changes reflected instantly for customers.
-   **Full Product Management (CRUD)**: A full Create, Read, Update, and Delete interface for managing the product catalog directly in the Firestore database (Admin/Super Admin only).
-   **User Role Management**: The Super Admin can view all users and manage their roles, promoting customers to `sub-admin` or `admin` directly from the panel.
-   **Responsive & Mobile-First**: Fully functional on any device with a dynamic, role-based collapsible sidebar and adaptive data tables.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Backend & Database**: Firebase (Authentication, Cloud Firestore)
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
├── firebase
│   └── config.ts              # Firebase configuration and service initialization
├── contexts
│   ├── AuthContext.tsx        # Manages user sessions with Firebase Auth and Firestore user documents
│   ├── CartContext.tsx        # Manages shopping cart state (Firestore for users, localStorage for guests)
│   ├── WishlistContext.tsx    # Manages wishlist state (Firestore for users, localStorage for guests)
│   └── ThemeContext.tsx       # Manages light/dark theme state
└── ...
```

---

## 🧠 Core Logic & Function Structure

### Real-time Data with Firestore
-   **`onSnapshot` Listeners**: Instead of one-time data fetches, the application uses Firestore's `onSnapshot` listeners. This creates a live connection to the database. Any change in a collection (e.g., a new order, an updated product) is immediately pushed to all connected clients, and the UI updates automatically.
-   **Data Model**: Data is structured in Firestore collections (`products`, `users`, `orders`). User-specific data like carts and wishlists are stored in subcollections under each user's document, secured by Firestore Rules.

### Firebase Authentication Flow (`contexts/AuthContext.tsx`)
-   Manages the global user state via `onAuthStateChanged`.
-   Handles the complete phone number and email/password sign-in flows.
-   **Role Assignment**: On a user's first login, it checks their email against a hardcoded super-admin list. If it matches, they are assigned the `super-admin` role. All other new users are created with a `customer` role. Promotions to `admin` or `sub-admin` are handled manually by a Super Admin in the admin panel.

### Hybrid Cart Management (`contexts/CartContext.tsx`)
-   **Guest Users**: The cart is managed in `localStorage`.
-   **Authenticated Users**: The cart is managed in a `cart` document within their user document in Firestore, updated in real-time.
-   **Login Migration**: A key `useEffect` hook observes the user's authentication state. When a user logs in, it automatically reads the guest cart from `localStorage`, merges it with the user's Firestore cart, and clears the local storage.

---

## 🚀 Getting Started

To run this project, you need to connect it to your own Firebase project.

### Prerequisites

-   A Firebase account.
-   A local web server (like the "Live Server" VS Code extension). This is required for ES module imports to work correctly.

### Installation & Setup

1.  **Create a Firebase Project**: Follow the instructions in `FIREBASE_SETUP.md` to create a project, enable Authentication, and set up Cloud Firestore.
2.  **Get Firebase Config**: From your Firebase project settings, copy the `firebaseConfig` object.
3.  **Configure the App**:
    -   Open `firebase/config.ts`.
    -   Paste your `firebaseConfig` object into the file.
4.  **Run Locally**: Serve the project directory using a local web server.
5.  **Open the app**: Navigate to the local address provided by your server (e.g., `http://localhost:5500`).

---

## 🔑 Usage

-   **Create a Customer Account**: Use the login screen to sign up with your phone or email.
-   **Access Admin Panel**:
    -   The Super Admin accounts are hardcoded. To become a super-admin, sign up with one of the following emails: .
    -   Navigate to `/admin.html`. The app will now recognize you as a super-admin.
    -   As the super-admin, you can now promote other user accounts to `admin` or `sub-admin` roles from the "Manage Users" page.