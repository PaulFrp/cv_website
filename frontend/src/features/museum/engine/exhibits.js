import { getProjectById } from "../../projects/data/projects";
import { getShortProjectBlurb } from "../../../shared/utils/projectText";
import { PROXIMITY_RADIUS } from "./config";

/** Exhibit file names that do not become a project id via `_` → `-`. */
const SLUG_ALIASES = {
	obsidian: "obsidian-clone",
};

/** Every exhibit is nudged up by this fraction of its height to clear the plaque. */
const Y_LIFT = 0.3;

/** Stands 7 and 8 are shallow booths, so their art has to stay square. */
const BOOTH_STANDS = new Set([7, 8]);

const DRAW_LIMITS = {
	pedestal: { maxWidth: 130, maxHeight: 85, yAnchor: 0.9 + Y_LIFT },
	booth: { maxWidth: 100, maxHeight: 100, yAnchor: 0.55 + Y_LIFT },
	wall: { maxWidth: 170, maxHeight: 200, yAnchor: 0.82 + Y_LIFT },
};

/** How the art for a stand is scaled and anchored inside its frame. */
export function exhibitDrawLimits(kind, stand) {
	if (kind === "pedestal") return DRAW_LIMITS.pedestal;
	if (BOOTH_STANDS.has(stand)) return DRAW_LIMITS.booth;
	return DRAW_LIMITS.wall;
}

/** Maps an exhibit file name like `plant_tracker_13.png` to a catalog project. */
function resolveProjectFromSlug(catalog, slug) {
	const id = String(slug || "")
		.replace(/_/g, "-")
		.toLowerCase();
	if (!id) return null;

	const aliased = SLUG_ALIASES[id] ?? id;
	return (
		catalog.find((project) => project.id === aliased) ??
		catalog.find(
			(project) =>
				project.id.startsWith(aliased) || aliased.startsWith(project.id),
		) ??
		null
	);
}

/**
 * Exhibit art is exported on a large transparent canvas, so measure the ink
 * itself. Without this the art would be scaled to fit its padding, not itself.
 */
function opaqueBounds(image) {
	const width = image.naturalWidth;
	const height = image.naturalHeight;
	const whole = { sx: 0, sy: 0, sw: width, sh: height };
	if (!width || !height) return whole;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	context.drawImage(image, 0, 0);
	const { data } = context.getImageData(0, 0, width, height);

	let minX = width;
	let minY = height;
	let maxX = 0;
	let maxY = 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (data[(y * width + x) * 4 + 3] <= 16) continue;
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
		}
	}

	if (maxX < minX) return whole;
	return { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
}

function createExhibit(project, stand, asset) {
	const image = asset?.image?.naturalWidth ? asset.image : null;

	return {
		id: project.id,
		stand: stand.stand,
		title: project.title,
		blurb: getShortProjectBlurb(project.description, 72),
		x: stand.x,
		y: stand.y,
		kind: asset?.kind ?? null,
		image,
		bounds: image ? opaqueBounds(image) : null,
		hasPage: Boolean(getProjectById(project.id)),
	};
}

/**
 * Places exhibit art on the stand encoded in its file name, then fills the
 * remaining stands with catalog projects that have no art yet.
 */
export function buildExhibits(stands, catalog, assets) {
	const standByNumber = new Map(stands.map((stand) => [stand.stand, stand]));
	const usedStands = new Set();
	const usedProjects = new Set();
	const exhibits = [];

	for (const asset of assets) {
		const stand = standByNumber.get(asset.stand);
		const project = resolveProjectFromSlug(catalog, asset.slug);
		if (!stand || !project || usedStands.has(stand.stand)) continue;

		exhibits.push(createExhibit(project, stand, asset));
		usedStands.add(stand.stand);
		usedProjects.add(project.id);
	}

	const remainingProjects = catalog.filter(
		(project) => !usedProjects.has(project.id),
	);
	const remainingStands = stands
		.filter((stand) => !usedStands.has(stand.stand))
		.sort((a, b) => a.stand - b.stand);

	const pairs = Math.min(remainingProjects.length, remainingStands.length);
	for (let i = 0; i < pairs; i++) {
		exhibits.push(createExhibit(remainingProjects[i], remainingStands[i], null));
	}

	return exhibits;
}

/** The exhibit the player is standing next to, or null when none is in range. */
export function findNearbyExhibit(exhibits, x, y) {
	let nearest = null;
	let nearestDistance = Infinity;

	for (const exhibit of exhibits) {
		const distance = Math.hypot(exhibit.x - x, exhibit.y - y);
		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearest = exhibit;
		}
	}

	return nearestDistance <= PROXIMITY_RADIUS ? nearest : null;
}
