import { useEffect } from 'react';
// FIX: The `react-router-dom` component `useLocation` was not found on the namespace import. Changed to a direct import to resolve the error.
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;