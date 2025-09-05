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

  const pathsToHideWhatsApp = ["/cart", "/checkout", "/product/"];
  const showWhatsAppButton = !pathsToHideWhatsApp.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="bg-warmBeige dark:bg-slate-950 text-charcoal dark:text-slate-200 min-h-screen font-sans flex flex-col max-w-full overflow-x-hidden">
      <div className={`flex-grow flex flex-col ${showNavBar ? "pb-28" : ""}`}>
        <main className="flex-grow">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>

      {showNavBar && <NavigationBar />}
      {showWhatsAppButton && <WhatsAppButton showNavBar={showNavBar} />}
    </div>
  );
};

export default MainLayout;
