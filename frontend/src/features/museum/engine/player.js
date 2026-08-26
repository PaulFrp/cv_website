import { PLAYER_SPEED, WALK_CYCLE_DISTANCE } from "./config";
import { isWalkable } from "./outline";

/** Keyboard keys that map onto a walking direction. */
export const MOVEMENT_KEYS = {
	arrowup: "up",
	arrowdown: "down",
	arrowleft: "left",
	arrowright: "right",
	w: "up",
	s: "down",
	a: "left",
	d: "right",
};

export function createPlayer({ x, y }) {
	return { x, y, facing: "up", step: 0, distanceWalked: 0 };
}

/** Turns the set of held directions into a normalised movement vector. */
export function readMovementVector(heldDirections) {
	let x = 0;
	let y = 0;
	if (heldDirections.has("left")) x -= 1;
	if (heldDirections.has("right")) x += 1;
	if (heldDirections.has("up")) y -= 1;
	if (heldDirections.has("down")) y += 1;

	if (x === 0 && y === 0) return null;

	const length = Math.hypot(x, y);
	return { x: x / length, y: y / length };
}

/**
 * Moves the player along `vector`, testing each axis separately so walking
 * into a wall diagonally slides along it instead of stopping dead.
 */
export function movePlayer(player, vector, deltaSeconds, world) {
	if (!vector) {
		player.distanceWalked = 0;
		return;
	}

	const distance = PLAYER_SPEED * deltaSeconds;
	const { walkable, width, height } = world;
	const nextX = player.x + vector.x * distance;
	const nextY = player.y + vector.y * distance;

	if (isWalkable(walkable, width, height, nextX, player.y)) player.x = nextX;
	if (isWalkable(walkable, width, height, player.x, nextY)) player.y = nextY;

	player.facing =
		Math.abs(vector.x) > Math.abs(vector.y)
			? vector.x < 0
				? "left"
				: "right"
			: vector.y < 0
				? "up"
				: "down";

	player.distanceWalked += distance;
	if (player.distanceWalked > WALK_CYCLE_DISTANCE) {
		player.step += 1;
		player.distanceWalked = 0;
	}
}

/** Three-frame sheets walk 0-1-2-1 so the idle pose sits in the middle. */
export function getFrameIndex(frameCount, step, moving) {
	if (!moving) return frameCount >= 3 ? 1 : 0;
	if (frameCount === 3) {
		const cycle = [0, 1, 2, 1];
		return cycle[step % cycle.length];
	}
	return step % frameCount;
}

/** Slices one frame out of a horizontal sprite strip. */
export function getSpriteFrame(sheet, frameCount, frameIndex) {
	const width = sheet.naturalWidth || sheet.width;
	const height = sheet.naturalHeight || sheet.height;
	const startX = Math.round((width * frameIndex) / frameCount);
	const endX = Math.round((width * (frameIndex + 1)) / frameCount);

	return { sx: startX, sy: 0, sw: endX - startX, sh: height };
}
