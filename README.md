
# Salati (سـلـتـي) - Integrated E-Commerce Platform | Technical Deep Dive

**Salati** is a complete, full-stack, serverless digital retail platform built for a modern, direct-to-consumer experience. It features a high-performance, mobile-first storefront for customers and an exceptionally powerful, role-based control panel for business administrators. The entire system is architected around a modern serverless stack, leveraging Firebase for real-time data, authentication, and security, delivering a scalable and maintainable solution.

---

## 1. Core Philosophy & Architecture

The application is built on three core principles: performance, security, and separation of concerns.

-   **Dual-App Architecture**: The project is not a single application but two distinct ones served from the same codebase:
    1.  **Customer-Facing App (`index.html`)**: A highly optimized, lightweight, and fast-loading storefront focused on the shopping experience.
    2.  **Admin Panel (`admin.html`)**: A feature-rich, data-intensive application for business management.
    This separation, managed by Vite's multi-page build system, is a critical architectural decision. It ensures that customers never download admin-specific code (like charting libraries or complex data tables), resulting in a significantly faster and better user experience.

-   **Serverless First**: The entire backend is built on Google's Firebase platform. This eliminates the need for managing servers, allowing for rapid development, automatic scaling, and a robust security model managed by server-side rules.

-   **Mobile-First Design**: Both applications are fully responsive. The customer app prioritizes the mobile experience with an ergonomic bottom navigation bar, while the admin panel uses adaptive layouts that transition from user-friendly cards on mobile to dense data tables on desktops.

---

## 2. Technology Stack

The platform utilizes a modern, type-safe, and efficient technology stack.

-   **Frontend**:
    -   **Framework**: React 18
    -   **Language**: TypeScript
    -   **Styling**: Tailwind CSS (with a custom, dynamic theming system)
    -   **Routing**: React Router v6 (`HashRouter`)
    -   **Build Tool**: Vite

-   **Backend & Database**:
    -   **Platform**: Firebase (Serverless)
    -   **Authentication**: Firebase Authentication (Phone OTP, Email/Password)
    -   **Database**: Cloud Firestore (Real-time NoSQL Database)
    -   **Security**: Firestore Security Rules (Role-Based Access Control)

-   **Third-Party API Integrations**:
    -   **AI Features**: Google Gemini API (`@google/genai`) for idea generation.
    -   **Image Management**: Cloudinary for real-time image optimization, transformation, and hosting.

-   **State Management**:
    -   React Context API is used for managing global state across several domains: `AuthContext`, `CartContext`, `WishlistContext`, `ThemeContext`, `SettingsContext`, and `ToastContext`.

---

## 3. Feature Deep-Dive

### 🛍️ The Customer Experience (Customer-Facing App)

The customer app is designed for a seamless and intuitive shopping journey.

-   **Dual Authentication System**:
    -   **Phone (OTP)**: Secure, passwordless login using a one-time password sent via SMS. The UI includes E.164 format validation for international numbers.
    -   **Email & Password**: Traditional registration and login for users who prefer it.

-   **Dynamic & Real-Time Storefront**:
    -   **Home Page**: Features a dynamic promotional banner, featured products, category navigation, top-rated items, and a full product listing.
    -   **Real-time Data**: All product information, stock levels, and prices are synced in real-time from Firestore.
    -   **Powerful Search & Filtering**: A global search directs to a dedicated results page. A sophisticated filter sidebar allows users to narrow down products by price range and average rating.

-   **Rich Product Details**:
    -   **Unified Product Model**: The system supports both individual `Items` and multi-product `Bundles`.
    -   **Bundle Customization**: For bundles, users can select from a list of available `ExtraItems` to customize their order.
    -   **Live Customer Reviews**: Users can read and submit reviews (with star ratings and comments) for any product. The UI includes a detailed review summary with a rating distribution chart.

-   **Intelligent Cart & Wishlist**:
    -   **Persistent State**: The cart and wishlist are cloud-synced to a user's account via Firestore, allowing them to continue shopping across multiple devices.
    -   **Guest Mode**: Unregistered users have a fully functional cart and wishlist stored in `localStorage`.
    -   **Seamless Cart Merging**: When a guest logs in, their local cart is automatically and intelligently merged with their cloud-synced cart.

-   **Streamlined Checkout & Order Management**:
    -   **Multi-Step Checkout**: A focused, distraction-free checkout process where users confirm their delivery/pickup details, review their order, and place it.
    -   **Transactional Stock Validation**: Before an order is confirmed, a Firestore transaction runs to validate the stock of every item, preventing overselling.
    -   **Order Success & Confirmation**: After placing an order, users are directed to a success page with their order number and a WhatsApp link for easy confirmation.
    -   **Detailed Order History**: A dedicated "My Orders" screen where users can view the status and details of all past orders.

-   **Personalization & User Experience**:
    -   **User Profile**: A central hub for users to view and edit their personal details (name, address, phone).
    -   **Dynamic Theming**: The entire app's color scheme (primary/secondary colors) and typography (body/display fonts) are dynamically controlled by the admin panel settings, allowing for instant brand refreshes.
    -   **Dark Mode**: A full, beautifully implemented dark theme is available.
    -   **Polished Micro-interactions**: The app is filled with subtle animations, from the "jiggling" cart icon on the animated navigation bar to smooth page transitions, creating a premium feel.

### ⚙️ Business Operations (Admin Panel)

The admin panel is a comprehensive, data-driven application for complete business control.

-   **Secure Role-Based Access Control (RBAC)**:
    -   The panel is protected by Firebase Auth and server-side Firestore Security Rules.
    -   **Roles**:
        -   `super-admin`: Unrestricted access to all features, including settings, user management, and security logs.
        -   `admin`: Can manage core business operations (products, orders, drivers, offers).
        -   `sub-admin`: Limited access, primarily for viewing the dashboard and managing orders.
        -   `driver`: A special role with a dedicated dashboard for managing assigned deliveries.

-   **The Command Center Dashboard**:
    -   **At-a-Glance Stats**: Real-time cards for key metrics like Total Revenue, New Orders, and Low-Stock Items, with selectable date ranges (Today, 7 days, 30 days).
    -   **Interactive Charts**:
        -   A line chart visualizing revenue over the selected period.
        -   A donut chart showing the distribution of orders by status (Preparing, Delivered, etc.).
    -   **Data Validation System**: A special notice for Super Admins that automatically scans the database for integrity issues (e.g., a bundle containing a deleted item) and provides direct links to fix them.

-   **Unified & Advanced Product Management**:
    -   **Consolidated View**: A single "Manage Products" screen replaces separate item/bundle pages, providing a holistic view of the entire catalog with badges to differentiate product types.
    -   **Full CRUD Operations**: Admins can create, read, update, and delete all products via intelligent modals that feature robust, real-time **inline form validation**.
    -   **Bulk Actions**: Admins can select multiple products and perform bulk operations like "Feature on Home Page" or "Change Category".

-   **AI-Powered Tools**:
    -   **Bundle Idea Generator**: A Super Admin feature that uses the **Google Gemini API** to analyze the list of existing items and generate creative, marketable bundle ideas, which can then be created with a single click.

-   **Comprehensive Order Management**:
    -   **Live Order Feed**: A paginated view of all orders that updates in real-time.
    -   **Powerful Filtering & Sorting**: Orders can be filtered by status, delivery method, and payment status, and sorted by any column.
    -   **Inline Actions**: Admins can change an order's status or assign a driver directly from the order list using dropdowns.
    -   **Bulk Status Updates**: Multiple orders can be selected and updated to a new status simultaneously.

-   **Strategic Business & Storefront Control (Super Admin)**:
    -   **Dynamic Theming Engine**: A dedicated "Theme" tab in the settings with color pickers and font selectors that update the customer-facing app in real-time, complete with a live preview component.
    -   **Storefront Merchandising**: Admins can feature any item on the home page with a simple toggle on the product management screen.
    -   **Site-Wide Announcements**: A feature to create and activate a promotional banner that appears at the top of the customer app.
    -   **Business Intelligence Reports**: A dedicated "Reports" screen to analyze sales data across custom date ranges, identify best-selling and slowest-moving products, and **export all order data to a CSV file**.
    -   **Security & Accountability Audit Log**: A read-only, paginated log that records every significant action taken by an administrator (e.g., "User Role Changed," "Order Deleted"), providing a crucial trail for security and accountability.
    -   **Full User Management**: Super Admins can manage user roles, edit details, and even set custom delivery fees for specific users.

-   **Ergonomic & Usable Layout**:
    -   The admin panel features a **collapsible sidebar**, allowing users to maximize screen space for data-heavy tables.
    -   When collapsed, the sidebar displays icon-only links with helpful tooltips on hover.
    -   The entire panel is fully responsive and just as functional on a mobile device as it is on a desktop.

---

## 4. Security Architecture

Security is a foundational pillar of the application, enforced primarily on the server-side.

-   **Firestore Security Rules**: The `FIREBASE_SETUP.md` file contains a comprehensive set of Firestore rules. These are not just suggestions; they are the application's primary security enforcement mechanism. They ensure:
    -   A user can only ever access their own data (e.g., their own cart, orders, and profile).
    -   Administrative actions (like updating a product or changing an order status) are strictly limited based on the authenticated user's `role` field in their user document.
    -   This server-side enforcement means that even if the client-side code were compromised, the database itself would reject any unauthorized request.

-   **API Key Management**:
    -   All sensitive API keys and configuration values (Firebase, Cloudinary, Gemini) are managed through environment variables (`.env` file), following best practices.
    -   The current implementation uses a **client-side approach** for Cloudinary and Gemini API calls for ease of deployment. This means the Gemini API key and Cloudinary upload preset are exposed to the browser. While functional, for maximum security in a large-scale production environment, these calls would ideally be proxied through serverless functions to completely hide the keys.

---

## 5. Performance & Optimization

The application is built to be fast and responsive.

-   **Image Optimization**: The `getOptimizedImageUrl` helper function integrates with Cloudinary's API to deliver perfectly sized, compressed, and format-optimized (`f_auto`) images for any device, drastically reducing load times.
-   **Efficient Data Fetching**: The admin panel uses custom hooks (`usePaginatedFirestore` and `useCombinedPaginatedFirestore`) to efficiently fetch and paginate large datasets, ensuring the UI remains fast and responsive even with thousands of orders or users.
-   **Offline Capabilities**: Firestore's **IndexedDB persistence** is enabled. This caches data locally, allowing for near-instant data loads on subsequent visits and enabling the app to function even with an unstable internet connection.
-   **Code Splitting**:
    -   **By App**: The customer and admin apps are entirely separate bundles.
    -   **By Route**: Within each app, `React.lazy` is used to code-split routes, so users only download the code for the page they are visiting.

---

## 6. Project Structure

The codebase is organized logically to separate concerns.

```
/
├── admin.html                 # Entry point for the Admin Panel
├── index.html                 # Entry point for the Customer App
├── src/
│   ├── assets/                # Icons and static assets
│   ├── components/            # Reusable React components (shared or specific)
│   ├── contexts/              # Global state management via React Context
│   ├── firebase/              # Firebase configuration and initialization
│   ├── hooks/                 # Custom React hooks for shared logic
│   ├── screens/               # Top-level page components for each route
│   ├── types.ts               # Centralized TypeScript type definitions
│   ├── utils/                 # Helper functions and utilities
│   ├── App.tsx                # Root component and router for the Customer App
│   └── AdminApp.tsx           # Root component and router for the Admin Panel
├── .env                       # (Must be created) Environment variables
└── tailwind.config.js         # Tailwind CSS configuration
```

---

## 7. Setup and Installation Guide

Follow these steps to get the project running locally.

### Prerequisites

-   A [Firebase](https://firebase.google.com/) account.
-   A [Cloudinary](https://cloudinary.com/) account.
-   A [Google AI Studio](https://aistudio.google.com/) account to get a Gemini API key.
-   Node.js (v18+) and npm.

### Step 1: Firebase Project Setup

1.  Create a new project in the Firebase Console.
2.  Add a new **Web App** to your project and copy the `firebaseConfig` object.
3.  Go to **Authentication** -> **Sign-in method** and enable the **Email/Password** and **Phone** providers.
4.  In Authentication -> Settings -> **Authorized domains**, add `localhost`.
5.  Go to **Firestore Database** -> **Create database**. Start in **Production mode**.
6.  Navigate to the **Rules** tab in Firestore and paste the contents of `FIREBASE_SETUP.md` into the editor. **Publish** the rules.

### Step 2: Cloudinary Setup

1.  In your Cloudinary dashboard, go to **Settings** (cog icon) -> **Upload**.
2.  Scroll down to **Upload presets**. Find the preset named `ml_default` (or create a new one).
3.  Click **Edit** and change the **Signing Mode** to **"Unsigned"**. Save the preset.
4.  Copy the **Upload preset name**.
5.  From the main dashboard, copy your **Cloud name**.

### Step 3: Environment Variable Configuration

1.  In the root of the project, create a new file named `.env`.
2.  Copy the contents of `README.md`'s setup section into this file.
3.  Fill in all the values:
    -   `VITE_FIREBASE_*`: Paste the values from your `firebaseConfig` object.
    -   `VITE_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
    -   `VITE_CLOUDINARY_UPLOAD_PRESET`: The name of your unsigned upload preset.
    -   `VITE_GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.

### Step 4: Installation & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
3.  **Access the Apps**:
    -   Customer App: `http://localhost:5173` (or the address provided by Vite)
    -   Admin Panel: `http://localhost:5173/admin.html`

