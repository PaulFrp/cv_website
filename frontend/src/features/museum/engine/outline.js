import { MUSEUM_WORLD, SPAWN_POINT } from "./config";

/**
 * `museum_outline.png` is hand-drawn on top of the museum art with two colours:
 * red strokes mark walls the player cannot cross, blue blobs mark the spot
 * where each numbered exhibit stands.
 */
const BOUNDARY_RED = { r: 237, g: 28, b: 36 };
const MARKER_BLUE = { r: 63, g: 72, b: 204 };
const COLOR_TOLERANCE = 55;

/** Blue blobs smaller than this are anti-aliasing noise rather than markers. */
const MIN_MARKER_PIXELS = 25;

/** Blue pixels within this distance of a blob are treated as the same marker. */
const MARKER_MERGE_PADDING = 10;

function colorDistance(r, g, b, target) {
	return Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b);
}

function isBoundaryRed(r, g, b) {
	// The extra channel checks keep warm wood and carpet from reading as red.
	return colorDistance(r, g, b, BOUNDARY_RED) <= COLOR_TOLERANCE && g < 70 && b < 70;
}

function isMarkerBlue(r, g, b) {
	return colorDistance(r, g, b, MARKER_BLUE) <= COLOR_TOLERANCE && b > r && b > g;
}

/** Rasterises the outline at the museum's world size so both share one grid. */
function rasterize(image, width, height) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	context.drawImage(image, 0, 0, width, height);
	return { context, pixels: context.getImageData(0, 0, width, height).data };
}

function classifyPixels(pixels, width, height, context) {
	const blocked = new Uint8Array(width * height);
	const markerPixels = [];
	const overlay = context.createImageData(width, height);

	for (let index = 0; index < width * height; index++) {
		const offset = index * 4;
		const r = pixels[offset];
		const g = pixels[offset + 1];
		const b = pixels[offset + 2];

		if (isBoundaryRed(r, g, b)) {
			blocked[index] = 1;
			overlay.data.set([255, 40, 40, 200], offset);
		} else if (isMarkerBlue(r, g, b)) {
			markerPixels.push(index % width, Math.floor(index / width));
			overlay.data.set([60, 90, 255, 180], offset);
		}
	}

	const debugCanvas = document.createElement("canvas");
	debugCanvas.width = width;
	debugCanvas.height = height;
	debugCanvas.getContext("2d").putImageData(overlay, 0, 0);

	return { blocked, markerPixels, debugCanvas };
}

/**
 * Flood fills the floor the player can actually reach. Seeding from several
 * points keeps rooms connected even when one seed lands inside a wall stroke.
 */
function floodFillWalkable(blocked, width, height) {
	const walkable = new Uint8Array(width * height);
	const queue = [];

	const seeds = [
		[SPAWN_POINT.x, SPAWN_POINT.y],
		[width / 2, height * 0.82],
		[width / 2, height * 0.7],
		[width / 2, height * 0.55],
		[width * 0.3, height * 0.55],
		[width * 0.7, height * 0.55],
		[width * 0.22, height * 0.4],
		[width * 0.78, height * 0.4],
	];

	for (const [seedX, seedY] of seeds) {
		const x = Math.floor(seedX);
		const y = Math.floor(seedY);
		if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
		const index = y * width + x;
		if (blocked[index] || walkable[index]) continue;
		walkable[index] = 1;
		queue.push(x, y);
	}

	while (queue.length) {
		const y = queue.pop();
		const x = queue.pop();
		const neighbours = [
			[x + 1, y],
			[x - 1, y],
			[x, y + 1],
			[x, y - 1],
		];
		for (const [nx, ny] of neighbours) {
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
			const index = ny * width + nx;
			if (walkable[index] || blocked[index]) continue;
			walkable[index] = 1;
			queue.push(nx, ny);
		}
	}

	return walkable;
}

/** Groups loose blue pixels into one bounding box per exhibit marker. */
function clusterMarkers(markerPixels) {
	const clusters = [];

	for (let i = 0; i < markerPixels.length; i += 2) {
		const x = markerPixels[i];
		const y = markerPixels[i + 1];
		const pad = MARKER_MERGE_PADDING;
		const match = clusters.find(
			(cluster) =>
				x >= cluster.minX - pad &&
				x <= cluster.maxX + pad &&
				y >= cluster.minY - pad &&
				y <= cluster.maxY + pad,
		);

		if (!match) {
			clusters.push({ minX: x, maxX: x, minY: y, maxY: y, pixelCount: 1 });
			continue;
		}
		match.minX = Math.min(match.minX, x);
		match.maxX = Math.max(match.maxX, x);
		match.minY = Math.min(match.minY, y);
		match.maxY = Math.max(match.maxY, y);
		match.pixelCount += 1;
	}

	return clusters
		.filter((cluster) => cluster.pixelCount >= MIN_MARKER_PIXELS)
		.map((cluster) => ({
			x: Math.round((cluster.minX + cluster.maxX) / 2),
			y: Math.round((cluster.minY + cluster.maxY) / 2),
		}))
		.sort((a, b) => a.y - b.y || a.x - b.x);
}

/**
 * Turns the outline image into everything the museum needs to simulate:
 * a walkability mask, the detected exhibit marker positions, and a debug
 * overlay the player can toggle with H.
 */
export function parseOutline(image, worldWidth, worldHeight) {
	const width = worldWidth || image.naturalWidth || MUSEUM_WORLD.width;
	const height = worldHeight || image.naturalHeight || MUSEUM_WORLD.height;

	const { context, pixels } = rasterize(image, width, height);
	const { blocked, markerPixels, debugCanvas } = classifyPixels(
		pixels,
		width,
		height,
		context,
	);

	return {
		width,
		height,
		debugCanvas,
		walkable: floodFillWalkable(blocked, width, height),
		markers: clusterMarkers(markerPixels),
	};
}

export function isWalkable(walkable, width, height, x, y) {
	const px = Math.round(x);
	const py = Math.round(y);
	if (px < 0 || py < 0 || px >= width || py >= height) return false;
	return walkable[py * width + px] === 1;
}

/** Finds the closest walkable tile to the spawn point, spiralling outwards. */
export function findSpawn(walkable, width, height) {
	if (isWalkable(walkable, width, height, SPAWN_POINT.x, SPAWN_POINT.y)) {
		return { ...SPAWN_POINT };
	}

	const steps = 16;
	for (let radius = 4; radius < 160; radius += 4) {
		for (let step = 0; step < steps; step++) {
			const angle = (step / steps) * Math.PI * 2;
			const x = Math.round(SPAWN_POINT.x + Math.cos(angle) * radius);
			const y = Math.round(SPAWN_POINT.y + Math.sin(angle) * radius);
			if (isWalkable(walkable, width, height, x, y)) return { x, y };
		}
	}

	return { ...SPAWN_POINT };
}

/**
 * Finds a walkable tile near a stand. Prefers positions south of the marker
 * (toward the museum entrance) so the player faces the exhibit on return.
 */
export function findSpawnNear(target, walkable, width, height) {
	const offsets = [
		[0, 48],
		[0, 72],
		[0, 32],
		[0, 96],
		[-32, 48],
		[32, 48],
		[-48, 64],
		[48, 64],
		[0, 16],
		[-24, 24],
		[24, 24],
		[0, -24],
		[-40, 0],
		[40, 0],
	];

	for (const [dx, dy] of offsets) {
		const x = Math.round(target.x + dx);
		const y = Math.round(target.y + dy);
		if (isWalkable(walkable, width, height, x, y)) return { x, y };
	}

	const steps = 16;
	for (let radius = 8; radius < 120; radius += 8) {
		for (let step = 0; step < steps; step++) {
			const angle = (step / steps) * Math.PI * 2;
			const x = Math.round(target.x + Math.cos(angle) * radius);
			const y = Math.round(target.y + Math.sin(angle) * radius);
			if (isWalkable(walkable, width, height, x, y)) return { x, y };
		}
	}

	return null;
}
