import { useEffect } from 'react';
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from 'react-router-dom';
const { useLocation } = ReactRouterDOM;

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;