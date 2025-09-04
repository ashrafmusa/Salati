import React, { useState, useEffect } from 'react';
import { WhatsAppIcon } from '../assets/icons';

interface WhatsAppButtonProps {
  showNavBar: boolean;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ showNavBar }) => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER;
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    const [nudge, setNudge] = useState(false);
    const text = "تواصل معنا";

    useEffect(() => {
        // Start the nudge animation loop
        const intervalId = setInterval(() => {
            setNudge(true);
            // Reset the state after the animation duration (4s)
            setTimeout(() => setNudge(false), 4000);
        }, 10000); // Nudge every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    // Do not render the button if the phone number is not configured in the environment variables.
    if (!phoneNumber) {
        return null;
    }

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed ${showNavBar ? 'bottom-40' : 'bottom-5'} right-5 z-30 flex items-center group`}
            aria-label="Contact us on WhatsApp"
        >
            {/* Text Label */}
            <div 
                className={`bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold py-2 px-5 rounded-l-full shadow-lg transition-transform duration-300 ease-in-out transform origin-right whitespace-nowrap ${
                    nudge ? 'animate-nudge-reveal' : 'scale-x-0 group-hover:scale-x-100'
                }`}
            >
                {/* CRITICAL FIX: Removed the .split('').map(...) logic that breaks Arabic character rendering. The text is now rendered as a single unit. */}
                {text}
            </div>

            {/* Icon Button */}
            <div className="relative w-14 h-14">
                {/* Pulse effect */}
                <div className="absolute inset-0 bg-green-500 rounded-full animate-whatsapp-pulse"></div>
                
                {/* Main button */}
                <div className="relative bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110 group-hover:bg-green-600">
                    <WhatsAppIcon className="w-8 h-8 transition-transform duration-300 group-hover:-rotate-12" />
                </div>
            </div>
        </a>
    );
};

export default WhatsAppButton;
