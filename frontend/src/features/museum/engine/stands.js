/**
 * The museum has fifteen numbered spots. Their positions are detected from the
 * blue markers in `museum_outline.png`, then matched to stand numbers using the
 * bands below so the numbering stays stable when the art is redrawn.
 */

const STAND_COUNT = 15;

/** Used when marker detection fails, so the museum still renders something. */
const FALLBACK_STANDS = [
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

/** Below this many detected markers the layout is too incomplete to trust. */
const MIN_DETECTED_MARKERS = 10;

/** Horizontal bands of the museum floor, in world pixels. */
const BACK_WALL_MAX_Y = 350;
const UPPER_WALL_MAX_Y = 540;
const ALCOVE_MIN_Y = 520;
const ALCOVE_MAX_Y = 760;
const PEDESTAL_ROW = { minY: 560, maxY: 720, minX: 450, maxX: 950 };
const FRONT_ROW_MIN_Y = 760;

/** Vertical bands hugging the side walls, in world pixels. */
const LEFT_WALL_MAX_X = 400;
const RIGHT_WALL_MIN_X = 1000;

function byPosition(a, b) {
	return a.y - b.y || a.x - b.x;
}

/**
 * Matches detected markers to stand numbers 1–15 and fills any stand the
 * detection missed with a leftover marker or its fallback position.
 */
export function assignStandNumbers(markers, worldWidth) {
	if (markers.length < MIN_DETECTED_MARKERS) {
		return FALLBACK_STANDS.map((stand) => ({ ...stand }));
	}

	const sorted = [...markers].sort(byPosition);
	const byStand = new Map();
	const claimed = new Set();
	const middleX = worldWidth / 2;

	const claim = (stand, marker) => {
		if (!marker || byStand.has(stand) || claimed.has(marker)) return;
		byStand.set(stand, marker);
		claimed.add(marker);
	};

	// Back wall: two framed pictures on each side of the entrance arch.
	const backWall = sorted.filter((m) => m.y < BACK_WALL_MAX_Y);
	const backLeft = backWall.filter((m) => m.x < middleX).sort((a, b) => a.x - b.x);
	const backRight = backWall.filter((m) => m.x >= middleX).sort((a, b) => a.x - b.x);
	claim(1, backLeft[0]);
	claim(2, backLeft[1]);
	claim(3, backRight[0]);
	claim(4, backRight[1]);

	// Upper wall panels (5, 9) and the two central booths (7, 8).
	const upperWall = sorted
		.filter((m) => m.y >= BACK_WALL_MAX_Y && m.y < UPPER_WALL_MAX_Y)
		.sort((a, b) => a.x - b.x);
	for (const marker of upperWall) {
		if (marker.x < LEFT_WALL_MAX_X) claim(5, marker);
		else if (marker.x > RIGHT_WALL_MIN_X) claim(9, marker);
		else if (marker.x < middleX) claim(7, marker);
		else claim(8, marker);
	}

	// Central pedestal row, claimed before the alcoves so it wins the overlap.
	const pedestals = sorted
		.filter(
			(m) =>
				m.y >= PEDESTAL_ROW.minY &&
				m.y < PEDESTAL_ROW.maxY &&
				m.x > PEDESTAL_ROW.minX &&
				m.x < PEDESTAL_ROW.maxX,
		)
		.sort((a, b) => a.x - b.x);
	claim(11, pedestals[0]);
	claim(12, pedestals[1]);
	claim(13, pedestals[2]);

	// Side alcoves level with the pedestal row.
	for (const marker of sorted) {
		if (marker.y < ALCOVE_MIN_Y || marker.y >= ALCOVE_MAX_Y) continue;
		if (marker.x < LEFT_WALL_MAX_X) claim(6, marker);
		else if (marker.x > RIGHT_WALL_MIN_X) claim(10, marker);
	}

	// Front row, nearest the visitor.
	const frontRow = sorted
		.filter((m) => m.y >= FRONT_ROW_MIN_Y)
		.sort((a, b) => a.x - b.x);
	for (const marker of frontRow) {
		claim(marker.x < middleX ? 14 : 15, marker);
	}

	return fillGaps(byStand, claimed, markers);
}

function fillGaps(byStand, claimed, markers) {
	const unclaimed = markers.filter((marker) => !claimed.has(marker));

	for (let stand = 1; stand <= STAND_COUNT; stand++) {
		if (byStand.has(stand)) continue;

		const fallback = FALLBACK_STANDS.find((entry) => entry.stand === stand);
		const substitute = unclaimed.shift() ?? nearestMarker(markers, fallback);

		if (substitute) {
			byStand.set(stand, substitute);
			claimed.add(substitute);
		} else {
			byStand.set(stand, { x: fallback.x, y: fallback.y });
		}
	}

	return [...byStand.entries()]
		.sort(([a], [b]) => a - b)
		.map(([stand, marker]) => ({ stand, x: marker.x, y: marker.y }));
}

function nearestMarker(markers, target) {
	let nearest = null;
	let nearestDistance = Infinity;

	for (const marker of markers) {
		const distance = Math.hypot(marker.x - target.x, marker.y - target.y);
		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearest = marker;
		}
	}

	return nearest;
}
