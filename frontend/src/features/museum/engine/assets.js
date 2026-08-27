import { MUSEUM_EXHIBITS } from "virtual:museum-exhibits";
import { ASSET_VERSION } from "./config";

const MUSEUM_IMAGE = "/museum/museum.png";
const OUTLINE_IMAGE = "/museum/museum_outline.png";

/**
 * Character sprite sheets are a single horizontal row of frames, so each
 * facing needs its own frame count to slice the strip correctly.
 */
const CHARACTER_SHEETS = {
	down: { file: "front.png", frames: 3 },
	left: { file: "left.png", frames: 3 },
	right: { file: "right.png", frames: 3 },
	up: { file: "back.png", frames: 4 },
};

const FACINGS = Object.keys(CHARACTER_SHEETS);

export const CHARACTER_FRAME_COUNTS = Object.fromEntries(
	FACINGS.map((facing) => [facing, CHARACTER_SHEETS[facing].frames]),
);

function versioned(path) {
	return `${path}?v=${ASSET_VERSION}`;
}

/** Resolves to the decoded image, or to null when the file cannot be loaded. */
function loadImage(url) {
	return new Promise((resolve) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => {
			console.error(`Museum asset failed to load: ${url}`);
			resolve(null);
		};
		image.src = url;
	});
}

/**
 * Loads every museum image up front. Exhibit art is optional a missing file
 * only costs that one stand its picture but the background and the outline
 * are required, so callers must check them before starting the render loop.
 */
export async function loadMuseumAssets() {
	const [background, outline, characterFrames, exhibits] = await Promise.all([
		loadImage(versioned(MUSEUM_IMAGE)),
		loadImage(versioned(OUTLINE_IMAGE)),
		Promise.all(
			FACINGS.map((facing) =>
				loadImage(versioned(`/museum/character_movement/${CHARACTER_SHEETS[facing].file}`)),
			),
		),
		Promise.all(
			MUSEUM_EXHIBITS.map(async (asset) => ({
				...asset,
				image: await loadImage(versioned(asset.src)),
			})),
		),
	]);

	return {
		background,
		outline,
		characterSheets: Object.fromEntries(
			FACINGS.map((facing, index) => [facing, characterFrames[index]]),
		),
		exhibits,
	};
}
