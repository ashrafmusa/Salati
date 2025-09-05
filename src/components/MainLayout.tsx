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
      {/* 
              This div is the main scrollable content area. 
              It's a flex column where <main> grows to push the <Footer> to the bottom.
              The padding-bottom (`pb-52`) creates a "safe area" so that when scrolled to the end,
              the footer content is not obscured by the fixed navigation bar or floating WhatsApp button.
            */}
      <div className={`flex-grow flex flex-col ${showNavBar ? "pb-52" : ""}`}>
        <main className="flex-grow">
          <Outlet /> {/* Renders the nested child route's component */}
        </main>
        <Footer />
      </div>

      {/* Fixed/Floating elements are rendered outside the main scrollable content flow */}
      {showNavBar && <NavigationBar />}
      {showWhatsAppButton && <WhatsAppButton showNavBar={showNavBar} />}
    </div>
  );
};

export default MainLayout;
