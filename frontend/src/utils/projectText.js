/** Normalize project description (string or string[]) into one string. */
export function getProjectDescription(description) {
	if (Array.isArray(description)) {
		return description.join("").trim();
	}
	return (description || "").trim();
}

/** Short label for museum proximity UI. */
export function getShortProjectBlurb(description, maxLen = 140) {
	const full = getProjectDescription(description);
	if (full.length <= maxLen) return full;
	const cut = full.slice(0, maxLen);
	const lastSpace = cut.lastIndexOf(" ");
	return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
