import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon } from '../assets/icons';

const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle relative inline-flex items-center justify-center h-10 w-20 rounded-full transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent ${className} ${
        isDark ? 'bg-slate-800' : 'bg-sky-400'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Stars for dark mode */}
      <div className={`theme-toggle-stars ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
      
      {/* Sun and Moon Icons */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Sun Icon */}
        <div className={`theme-toggle-sun ${isDark ? 'rotate-out' : 'rotate-in'}`}>
          <SunIcon className="w-8 h-8 text-yellow-300" />
        </div>
        
        {/* Moon Icon */}
        <div className={`theme-toggle-moon ${isDark ? 'rotate-in' : 'rotate-out'}`}>
          <MoonIcon className="w-8 h-8 text-slate-300" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
