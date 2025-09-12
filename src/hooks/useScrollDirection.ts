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
            // If scrolling down past a threshold, hide the navbar. If scrolling up, show it.
            if (window.scrollY > lastScrollY.current && window.scrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            // Remember current scroll position for the next move
            lastScrollY.current = window.scrollY;
        };

        window.addEventListener('scroll', controlNavbar, { passive: true });
        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }, []);

    return isVisible;
};
