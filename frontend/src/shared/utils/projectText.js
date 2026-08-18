/** Normalize project description (string or string[]) into one string. */
export function getProjectDescription(description) {
	if (Array.isArray(description)) {
		return description.join("").trim();
	}
	return (description || "").trim();
}

/** Turn string | string[] into paragraph strings for rendering. */
export function toParagraphs(text) {
	if (Array.isArray(text)) {
		return text.map((p) => String(p).trim()).filter(Boolean);
	}
	const value = (text || "").trim();
	return value ? [value] : [];
}

/** Short label for museum proximity UI. */
export function getShortProjectBlurb(description, maxLen = 140) {
	const full = getProjectDescription(description);
	if (full.length <= maxLen) return full;
	const cut = full.slice(0, maxLen);
	const lastSpace = cut.lastIndexOf(" ");
	return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
