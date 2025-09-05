

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import WhatsAppButton from './WhatsAppButton';
import Footer from './Footer';
import { useOnboarding } from '../contexts/OnboardingContext';
import OnboardingGuide from './OnboardingGuide';

const MainLayout: React.FC = () => {
    const location = useLocation();
    const { isGuideActive, startGuide, hasSeenGuide } = useOnboarding();
    
    const showNavBar = !location.pathname.startsWith('/checkout') && !location.pathname.startsWith('/order-success');
    
    const pathsToHideWhatsApp = ['/cart', '/checkout', '/product/'];
    const showWhatsAppButton = !pathsToHideWhatsApp.some(path => location.pathname.startsWith(path));

    useEffect(() => {
        // Automatically start the guide for first-time visitors on the home page.
        if (!hasSeenGuide && location.pathname === '/') {
            // Use a small timeout to ensure the UI has rendered before starting the guide.
            const timer = setTimeout(() => {
                startGuide();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [hasSeenGuide, location.pathname, startGuide]);

    return (
        <div className="bg-warmBeige dark:bg-slate-950 text-charcoal dark:text-slate-200 min-h-screen font-sans flex flex-col">
            
            <div className={`flex-grow flex flex-col ${showNavBar ? 'pb-52' : ''}`}>
                <main className="flex-grow">
                    <Outlet />
                </main>
                <Footer />
            </div>
            
            {showNavBar && <NavigationBar />}
            {showWhatsAppButton && <WhatsAppButton showNavBar={showNavBar} />}
            
            {isGuideActive && <OnboardingGuide />}
        </div>
    );
};

export default MainLayout;