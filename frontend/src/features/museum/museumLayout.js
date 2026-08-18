/** Numbered project stands — filled at runtime from museum_outline.png blue markers. */
export const MUSEUM_SIZE = { w: 1402, h: 1122 };
export const SPAWN = { x: 701, y: 860 };

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
