import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window scroll when the route changes (React Router keeps the old offset). */
function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);

	return null;
}

export default ScrollToTop;
