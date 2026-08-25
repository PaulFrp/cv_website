/** Numbered project stands — filled at runtime from museum_outline.png blue markers. */
export const MUSEUM_SIZE = { w: 1402, h: 1122 };
export const SPAWN = { x: 701, y: 860 };

/** Filename slugs that do not match a project id after underscore → hyphen. */
const SLUG_ALIASES = {
	obsidian: "obsidian-clone",
};

/**
 * Resolve a `{name}_{stand}.png` slug to a project in the museum catalog.
 */
export function resolveProjectFromSlug(catalog, slug) {
	const id = String(slug || "")
		.replace(/_/g, "-")
		.toLowerCase();
	if (!id) return null;
	const aliased = SLUG_ALIASES[id] || id;
	return (
		catalog.find((project) => project.id === aliased) ||
		catalog.find((project) => project.id === id) ||
		catalog.find(
			(project) =>
				project.id.startsWith(aliased) || aliased.startsWith(project.id),
		) ||
		null
	);
}

/**
 * Fit exhibit art onto a stand. Pictures hang in wall frames (mostly above the
 * numbered plaque). Pedestal objects sit on the cube, anchored at the base.
 */
export function exhibitDrawLimits(kind, stand) {
	if (kind === "pedestal") {
		return stand === 15
			? { maxW: 96, maxH: 96, yAnchor: 0.9 }
			: { maxW: 80, maxH: 80, yAnchor: 0.9 };
	}
	if (stand === 7 || stand === 8) {
		return { maxW: 118, maxH: 78, yAnchor: 0.55 };
	}
	return { maxW: 92, maxH: 78, yAnchor: 0.82 };
}

/** Fallback stand centers if blue detection fails (museum.png space). */
export const MUSEUM_STANDS_FALLBACK = [
	{ stand: 1, x: 300, y: 340 },
	{ stand: 2, x: 470, y: 340 },
	{ stand: 3, x: 930, y: 340 },
	{ stand: 4, x: 1100, y: 340 },
	{ stand: 5, x: 250, y: 420 },
	{ stand: 6, x: 250, y: 560 },
	{ stand: 7, x: 560, y: 490 },
	{ stand: 8, x: 840, y: 490 },
	{ stand: 9, x: 1150, y: 420 },
	{ stand: 10, x: 1150, y: 560 },
	{ stand: 11, x: 520, y: 670 },
	{ stand: 12, x: 701, y: 670 },
	{ stand: 13, x: 880, y: 670 },
	{ stand: 14, x: 300, y: 820 },
	{ stand: 15, x: 701, y: 820 },
];
