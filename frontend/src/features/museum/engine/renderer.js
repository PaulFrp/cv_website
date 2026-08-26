import { CHARACTER_FRAME_COUNTS } from "./assets";
import { PLAYER_DRAW_HEIGHT } from "./config";
import { exhibitDrawLimits } from "./exhibits";
import { getFrameIndex, getSpriteFrame } from "./player";

/** Height and period of the idle hop applied to pedestal exhibits. */
const PEDESTAL_BOUNCE_PX = 5;
const PEDESTAL_BOUNCE_MS = 1800;

/** Cap the backing store so 4K displays do not allocate a huge canvas. */
const MAX_PIXEL_RATIO = 3;

/**
 * Resizes the canvas backing store to the element's on-screen size and scales
 * the context so drawing code can keep working in world pixels.
 */
export function syncCanvasResolution(canvas, context, worldElement, world) {
	if (!canvas || !worldElement) return;

	const cssWidth = worldElement.clientWidth || world.width;
	const cssHeight = worldElement.clientHeight || world.height;
	const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
	const bufferWidth = Math.max(1, Math.round(cssWidth * ratio));
	const bufferHeight = Math.max(1, Math.round(cssHeight * ratio));

	if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
		canvas.width = bufferWidth;
		canvas.height = bufferHeight;
	}

	context.setTransform(
		bufferWidth / world.width,
		0,
		0,
		bufferHeight / world.height,
		0,
		0,
	);
	context.imageSmoothingEnabled = false;
}

/** All pedestals share one clock so their hops stay in sync. */
function pedestalBounceOffset(now) {
	const phase = (now / PEDESTAL_BOUNCE_MS) * Math.PI * 2;
	return -Math.round(((Math.sin(phase) + 1) / 2) * PEDESTAL_BOUNCE_PX);
}

function drawExhibit(context, exhibit, now) {
	const { image, bounds } = exhibit;
	if (!image || !bounds) return;

	const limits = exhibitDrawLimits(exhibit.kind, exhibit.stand);
	const scale = Math.min(limits.maxWidth / bounds.sw, limits.maxHeight / bounds.sh);
	const width = Math.round(bounds.sw * scale);
	const height = Math.round(bounds.sh * scale);
	const x = Math.round(exhibit.x - width / 2);
	const y =
		Math.round(exhibit.y - height * limits.yAnchor) +
		(exhibit.kind === "pedestal" ? pedestalBounceOffset(now) : 0);

	// Exhibit art is photographic rather than pixel art, so it needs smoothing
	// to survive being drawn onto a hi-DPI canvas larger than the world.
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = "high";
	context.drawImage(
		image,
		bounds.sx,
		bounds.sy,
		bounds.sw,
		bounds.sh,
		x,
		y,
		width,
		height,
	);
	context.imageSmoothingEnabled = false;
}

function drawPlayer(context, characterSheets, player, moving) {
	const sheet = characterSheets[player.facing] ?? characterSheets.down;
	if (!sheet) return;

	const frameCount = CHARACTER_FRAME_COUNTS[player.facing] ?? CHARACTER_FRAME_COUNTS.down;
	const frame = getSpriteFrame(
		sheet,
		frameCount,
		getFrameIndex(frameCount, player.step, moving),
	);
	const height = PLAYER_DRAW_HEIGHT;
	const width = frame.sw * (height / frame.sh);

	context.imageSmoothingEnabled = false;
	context.drawImage(
		sheet,
		frame.sx,
		frame.sy,
		frame.sw,
		frame.sh,
		Math.round(player.x - width / 2),
		Math.round(player.y - height + 6),
		Math.round(width),
		Math.round(height),
	);
}

function drawProximityHighlight(context, exhibit) {
	context.strokeStyle = "rgba(255, 230, 150, 0.9)";
	context.lineWidth = 2;
	context.strokeRect(exhibit.x - 18, exhibit.y - 18, 36, 36);
}

/**
 * Draws one frame. Pedestals are split around the player so the ones in front
 * of him overlap his sprite and the ones behind him do not.
 */
export function renderFrame(context, scene, { now, moving, nearbyExhibit }) {
	const { world, background, pictures, pedestals, player, characterSheets } = scene;

	context.imageSmoothingEnabled = false;
	context.clearRect(0, 0, world.width, world.height);
	context.drawImage(background, 0, 0, world.width, world.height);

	if (scene.showHitboxes && scene.debugCanvas) {
		context.drawImage(scene.debugCanvas, 0, 0);
	}

	for (const exhibit of pictures) drawExhibit(context, exhibit, now);
	for (const exhibit of pedestals) {
		if (exhibit.y < player.y) drawExhibit(context, exhibit, now);
	}

	if (nearbyExhibit) drawProximityHighlight(context, nearbyExhibit);

	drawPlayer(context, characterSheets, player, moving);

	for (const exhibit of pedestals) {
		if (exhibit.y >= player.y) drawExhibit(context, exhibit, now);
	}
}

/**
 * Pans the museum inside its viewport so the player stays centred, stopping at
 * the edges of the map.
 */
export function followPlayer(stageElement, worldElement, player, world) {
	if (!stageElement || !worldElement) return;

	const viewWidth = stageElement.clientWidth;
	const viewHeight = stageElement.clientHeight;
	const mapWidth = worldElement.offsetWidth;
	const mapHeight = worldElement.offsetHeight;
	if (!viewWidth || !viewHeight || !mapWidth || !mapHeight) return;

	const clamp = (value, max) => Math.max(0, Math.min(value, Math.max(0, max)));
	const offsetX = clamp(
		(player.x * mapWidth) / world.width - viewWidth / 2,
		mapWidth - viewWidth,
	);
	const offsetY = clamp(
		(player.y * mapHeight) / world.height - viewHeight / 2,
		mapHeight - viewHeight,
	);

	worldElement.style.transform = `translate(${-Math.round(offsetX)}px, ${-Math.round(offsetY)}px)`;
}
