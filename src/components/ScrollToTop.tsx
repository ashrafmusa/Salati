import { useEffect } from 'react';
// FIX: Split react-router-dom imports to resolve module export errors.
// FIX: Changed react-router import to react-router-dom to resolve module export errors.
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;