/** Known sources that link into a project detail page. */
export const PROJECT_ORIGINS = {
	museum: { to: "/museum", label: "Back to museum" },
	projects: { to: "/projects", label: "Back to projects" },
	home: { to: "/", label: "Back to home" },
};

/**
 * Resolves the detail-page back link from React Router location state.
 * Falls back to projects when the visitor arrived without a known origin
 * (direct URL, refresh, external link).
 */
export function getProjectBackLink(location) {
	const from = location?.state?.from;
	return PROJECT_ORIGINS[from] ?? PROJECT_ORIGINS.projects;
}
