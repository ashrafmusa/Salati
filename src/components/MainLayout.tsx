import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import WhatsAppButton from "./WhatsAppButton";
import Footer from "./Footer";

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const showNavBarOnPage =
    !location.pathname.startsWith("/checkout") &&
    !location.pathname.startsWith("/order-success");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // A threshold to prevent hiding on small scrolls
      if (Math.abs(currentScrollY - lastScrollY.current) < 50) {
        return;
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathsToHideWhatsApp = ["/cart", "/checkout", "/product/"];
  const showWhatsAppButtonOnPage = !pathsToHideWhatsApp.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="bg-warmBeige dark:bg-slate-950 text-charcoal dark:text-slate-200 min-h-screen font-sans flex flex-col max-w-full overflow-x-hidden">
      <div
        className={`flex-grow flex flex-col ${
          showNavBarOnPage ? "pb-24 md:pb-0" : ""
        }`}
      >
        <main className="flex-grow">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>

      {showNavBarOnPage && <NavigationBar isVisible={isNavVisible} />}
      {showWhatsAppButtonOnPage && (
        <WhatsAppButton isNavVisible={showNavBarOnPage && isNavVisible} />
      )}
    </div>
  );
};

export default MainLayout;
