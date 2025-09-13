import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to determine the user's scroll direction.
 * @returns {boolean} `true` if the user is scrolling up or is at the top of the page, `false` if scrolling down.
 */
export const useScrollDirection = (): boolean => {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const controlNavbar = () => {
            const currentScrollY = window.scrollY;

            // If near the top, always show the bar
            if (currentScrollY <= 100) {
                setIsVisible(true);
            } else {
                // Otherwise, hide on scroll down, show on scroll up
                if (currentScrollY > lastScrollY.current) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
            }

            // Update last scroll position for the next event
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', controlNavbar, { passive: true });
        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }, []);

    return isVisible;
};
