<div align="center">

# 🛒 Salati (سـلـتـي)
### Integrated Shopping Platform

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-9.23.0-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.2.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**A complete, direct-to-consumer digital retail platform built with modern web technologies**

[Features](#-features) • [Tech Stack](#-technology-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
  - [Customer-Facing App](#-customer-facing-app-for-buyers)
  - [Admin Panel](#-admin-panel-for-business-management)
- [Technology Stack](#-technology-stack)
- [Application Structure](#-application-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 About

**Salati** is a full-stack serverless e-commerce platform designed for a wide range of products, from daily groceries to real estate. Built with a modern, mobile-first approach, it features a streamlined shopping experience for customers and a powerful, role-based dashboard for administrators. The entire system leverages **Firebase** for authentication, real-time database, and hosting, providing a scalable and secure solution.

---

## ✨ Features

### 🛍️ Customer-Facing App (For Buyers)

-   **Dual Authentication**: Secure user registration and login using either a **phone number (OTP)** or **email and password**.
-   **Real-time Product Catalog**: Browse a home screen with promotional banners, filterable categories, and a search bar, with all data served in real-time from a **Cloud Firestore** database.
-   **Integrated Real Estate Platform**: A dedicated section for browsing, searching, and inquiring about property and building rentals.
-   **Persistent & Synced User Data**: A user's shopping cart and wishlist are saved to their Firestore account, persisting and syncing across all their devices and sessions.
-   **Guest Browsing with Seamless Migration**: Unregistered users can browse and add items to a temporary cart stored locally. Upon logging in, their local cart is automatically merged with their cloud-synced cart.
-   **Live Customer Reviews**: Read and submit reviews for products. New reviews are saved to Firestore and appear for all users in real-time.
-   **Centralized Profile Management**: A dedicated "My Account" screen to view/edit personal details and access a full order history, all managed in Firestore.
-   **Full Dark Mode Support**: A beautiful, consistent dark theme is available and can be controlled via a toggle.

### ⚙️ Admin Panel (For Business Management)

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

## 🔧 Technology Stack

-   **Frontend**: 
    - ⚛️ React 18.2.0
    - 🔷 TypeScript 5.2.2
    - 🎨 Tailwind CSS 3.4.3
-   **Backend & Database**: 
    - 🔥 Firebase (Authentication, Cloud Firestore)
-   **AI Features**: 
    - 🤖 Google Gemini API (`@google/genai`)
-   **Image Management**: 
    - ☁️ Cloudinary
-   **Data Storage**: 
    - Cloud Firestore (for all app data)
    - Browser `localStorage` (for guest cart only)
-   **Routing**: 
    - 🔀 React Router v6
-   **State Management**: 
    - React Context API (for Auth, Cart, Wishlist, and Theme state)
-   **Build Tool**: 
    - ⚡ Vite 5.2.0
-   **Deployment**: 
    - Static hosting, ready for Firebase Hosting or Netlify

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

Before you begin, ensure you have the following accounts and tools:

-   📧 A [Firebase](https://firebase.google.com/) account
-   ☁️ A [Cloudinary](https://cloudinary.com/) account  
-   🤖 A [Google AI Studio](https://aistudio.google.com/) account (for Gemini API key)
-   📦 Node.js (v18+) and npm installed

### Installation & Setup

#### 1️⃣ Create a Firebase Project
Follow the instructions in the [Firebase documentation](https://firebase.google.com/docs/web/setup) to create a new project.

#### 2️⃣ Get Firebase Configuration
From your Firebase project settings, copy your web app's `firebaseConfig` object.

#### 3️⃣ Configure Environment Variables
Create a file named `.env` in the root of your project and add your configuration:

```env
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

#### 4️⃣ Install Dependencies
```bash
npm install
```

#### 5️⃣ Run the Development Server
```bash
npm run dev
```

#### 6️⃣ Open the Application
Navigate to the local address provided by Vite (e.g., `http://localhost:5173`)
- **Customer App**: `http://localhost:5173`
- **Admin Panel**: `http://localhost:5173/admin.html`

---

## 📚 Documentation

For more detailed information, please refer to the following documentation:

- **[ABOUT.md](ABOUT.md)** - Technical deep dive and architecture details
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Complete Firebase configuration guide
- **[FIREBASE_CONFIGURATION.md](FIREBASE_CONFIGURATION.md)** - Firebase security rules and setup
- **[ISSUES_AND_SOLUTIONS.md](ISSUES_AND_SOLUTIONS.md)** - Common issues and troubleshooting

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Powered by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- AI features by [Google Gemini](https://ai.google.dev/)

---

<div align="center">

**Made with ❤️ by the Salati Team**

⭐ Star this repo if you find it helpful!

</div>