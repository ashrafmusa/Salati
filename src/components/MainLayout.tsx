import React from 'react';
// FIX: Corrected react-router-dom import to resolve module export errors.
import { useLocation, Outlet } from "react-router-dom";
import NavigationBar from './NavigationBar';
import WhatsAppButton from './WhatsAppButton';
import Footer from './Footer';
import AnnouncementBanner from './AnnouncementBanner';

const MainLayout: React.FC = () => {
    const location = useLocation();
    
    // Determine if the bottom navigation should be shown on the current page.
    const showNavBarOnPage = !location.pathname.startsWith('/checkout') && !location.pathname.startsWith('/order-success');
    
    // Determine if the WhatsApp button should be shown on the current page.
    const pathsToHideWhatsApp = ['/cart', '/checkout', '/product/'];
    const showWhatsAppButtonOnPage = !pathsToHideWhatsApp.some(path => location.pathname.startsWith(path));

    // Dynamically set the CSS variable for the WhatsApp button's resting position
    const mainLayoutStyle = {
        '--whatsapp-bottom': showNavBarOnPage ? 'calc(76px + 1.25rem)' : '1.25rem' 
    } as React.CSSProperties;

    return (
        <div 
            className="bg-slate-50 dark:bg-slate-950 text-charcoal dark:text-slate-200 min-h-screen font-sans flex flex-col max-w-full overflow-x-hidden"
            style={mainLayoutStyle}
        >
            <AnnouncementBanner />
            <div className={`flex-grow flex flex-col ${showNavBarOnPage ? 'pb-24 md:pb-0' : ''}`}>
                <main className="flex-grow">
                    <div key={location.pathname} className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
                <Footer />
            </div>
            
            {showNavBarOnPage && <NavigationBar />}
            {showWhatsAppButtonOnPage && <WhatsAppButton />}
            
        </div>
    );
};

export default MainLayout;