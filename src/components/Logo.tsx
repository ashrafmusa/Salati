import React from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../utils/helpers';

const LOGO_URL = "https://res.cloudinary.com/dolmzcken/image/upload/v1756915579/ml9gwjd3vkqz84ban7lm.png";

interface LogoProps {
  wrapperClassName?: string;
  imgClassName?: string;
  textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({ wrapperClassName = '', imgClassName = '', textClassName = '' }) => {
  return (
    <Link 
        to="/" 
        className={`group transition-transform duration-300 ease-in-out hover:scale-105 focus:scale-105 focus:outline-none ${wrapperClassName}`}
        aria-label="Salati Home"
    >
      <div className={`flex flex-col items-center`}>
          <img 
            src={getOptimizedImageUrl(LOGO_URL, 200)} 
            alt="Salati Logo" 
            className={`h-auto transition-all duration-300 group-hover:drop-shadow-[0_4px_8px_rgba(0,122,51,0.3)] ${imgClassName}`} 
          />
          <span 
            className={`font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary ${textClassName}`}
          >
            سـلـتـي
          </span>
      </div>
    </Link>
  );
};

export default Logo;