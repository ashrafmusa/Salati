import { useEffect } from "react";
// FIX: The `react-router-dom` library has module resolution issues in this environment. Changed to a namespace import to resolve "has no exported member" errors.
import * as ReactRouterDOM from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = ReactRouterDOM.useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
