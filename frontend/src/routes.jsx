import CV from "./pages/CV";
import Home from "./pages/Home";
import Museum from "./pages/Museum";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";

/**
 * Single source of truth for the app's routes. Routes with a `label` also
 * appear in the navbar, in this order.
 */
export const routes = [
	{ path: "/", label: "Home", element: <Home /> },
	{ path: "/projects", label: "Projects", element: <Projects /> },
	{ path: "/projects/:projectId", element: <ProjectDetail /> },
	{ path: "/museum", label: "Museum", element: <Museum /> },
	{ path: "/cv", label: "CV", element: <CV /> },
];

export const navRoutes = routes.filter((route) => route.label);
