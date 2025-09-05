import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import WhatsAppButton from "./WhatsAppButton";
import Footer from "./Footer";

const MainLayout: React.FC = () => {
  const location = useLocation();

  const showNavBar =
    !location.pathname.startsWith("/checkout") &&
    !location.pathname.startsWith("/order-success");

  // Define paths where the WhatsApp button should be hidden to prevent UI conflicts.
  const pathsToHideWhatsApp = ["/cart", "/checkout", "/product/"];
  const showWhatsAppButton = !pathsToHideWhatsApp.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="bg-warmBeige dark:bg-slate-950 text-charcoal dark:text-slate-200 min-h-screen font-sans flex flex-col">
      <div className="flex-grow">
        <main className={showNavBar ? "pb-52" : ""}>
          <Outlet /> {/* Renders the nested child route's component */}
        </main>
      </div>
      {showNavBar && <NavigationBar />}
      {showWhatsAppButton && <WhatsAppButton showNavBar={showNavBar} />}
      <Footer />
    </div>
  );
};

export default MainLayout;
