import React, { useState, useEffect } from 'react';
import { ChevronUpIcon } from '../assets/icons';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-24 right-5 bg-primary/80 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30 backdrop-blur-sm hover:bg-primary transition-all duration-300 transform hover:scale-110 active:scale-95 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label="Go to top"
    >
      <ChevronUpIcon className="w-6 h-6" />
    </button>
  );
};

export default ScrollToTopButton;