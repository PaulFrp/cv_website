import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MUSEUM_EXHIBITS } from "virtual:museum-exhibits";
import {
	futureProjects,
	getProjectById,
	projects,
} from "../projects/data/projects";
import {
	exhibitDrawLimits,
	MUSEUM_SIZE,
	MUSEUM_STANDS_FALLBACK,
	resolveProjectFromSlug,
	SPAWN,
} from "./museumLayout";
import { getShortProjectBlurb } from "../../shared/utils/projectText";
import MuseumFigures from "./MuseumFigures";

const MUSEUM_CATALOG = [...projects, ...futureProjects];

const PLAYER_SPEED = 140;
const PROXIMITY = 70;
const WALK_CYCLE_DISTANCE = 12;
const PLAYER_DRAW_H = 96;
const ASSET_VER = "20260826a";
const MUSEUM_URL = `/museum/museum.png?v=${ASSET_VER}`;
const OUTLINE_URL = `/museum/museum_outline.png?v=${ASSET_VER}`;
const CHAR_STRIP_URLS = {
	down: `/museum/character_movement/front.png?v=${ASSET_VER}`,
	left: `/museum/character_movement/left.png?v=${ASSET_VER}`,
	right: `/museum/character_movement/right.png?v=${ASSET_VER}`,
	up: `/museum/character_movement/back.png?v=${ASSET_VER}`,
};
const CHAR_FRAME_COUNTS = {
	down: 3,
	left: 3,
	right: 3,
	up: 4,
};

/** Tool red on museum_outline.png (≈ #ED1C24). */
const OUTLINE_RED = { r: 237, g: 28, b: 36 };
/** Tool blue markers (≈ #3F48CC). */
const OUTLINE_BLUE = { r: 63, g: 72, b: 204 };

function colorDist(r, g, b, target) {
	return (
		Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b)
	);
}

function isRedBoundary(r, g, b) {
	// Match drawn hitbox strokes only — not carpets / warm wood.
	return colorDist(r, g, b, OUTLINE_RED) <= 55 && g < 70 && b < 70;
}

function isBlueMarker(r, g, b) {
	return colorDist(r, g, b, OUTLINE_BLUE) <= 55 && b > r && b > g;
}

function opaqueBounds(img) {
	const w = img.naturalWidth;
	const h = img.naturalHeight;
	if (!w || !h) return { sx: 0, sy: 0, sw: w, sh: h };
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d", { willReadFrequently: true });
	ctx.drawImage(img, 0, 0);
	const { data } = ctx.getImageData(0, 0, w, h);
	let minX = w;
	let minY = h;
	let maxX = 0;
	let maxY = 0;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (data[(y * w + x) * 4 + 3] > 16) {
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
		}
	}
	if (maxX < minX) return { sx: 0, sy: 0, sw: w, sh: h };
	return { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
}

function makeExhibit(project, stand, asset) {
	const image = asset?.img && asset.img.naturalWidth ? asset.img : null;
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
 * Red pixels = exact collision boundaries in image pixel space.
 * Walkable = region reachable from spawn without crossing red.
 * Blue blobs = project spot rectangles.
 * Uses the outline image's native pixels 1:1 (no window scaling).
 */
function parseOutline(image, worldWidth, worldHeight) {
	const worldW = worldWidth || image.naturalWidth || MUSEUM_SIZE.w;
	const worldH = worldHeight || image.naturalHeight || MUSEUM_SIZE.h;
	const c = document.createElement("canvas");
	c.width = worldW;
	c.height = worldH;
	const ctx = c.getContext("2d", { willReadFrequently: true });
	// Align outline processing to the museum background world size.
	ctx.drawImage(image, 0, 0, worldW, worldH);
	const { data } = ctx.getImageData(0, 0, worldW, worldH);

	const blocked = new Uint8Array(worldW * worldH);
	const debugOverlay = ctx.createImageData(worldW, worldH);
	const bluePixels = [];

	for (let y = 0; y < worldH; y++) {
		for (let x = 0; x < worldW; x++) {
			const i = (y * worldW + x) * 4;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (isRedBoundary(r, g, b)) {
				blocked[y * worldW + x] = 1;
				debugOverlay.data[i] = 255;
				debugOverlay.data[i + 1] = 40;
				debugOverlay.data[i + 2] = 40;
				debugOverlay.data[i + 3] = 200;
			}
			if (isBlueMarker(r, g, b)) {
				bluePixels.push(x, y);
				debugOverlay.data[i] = 60;
				debugOverlay.data[i + 1] = 90;
				debugOverlay.data[i + 2] = 255;
				debugOverlay.data[i + 3] = 180;
			}
		}
	}

	const walk = new Uint8Array(worldW * worldH);
	const queue = [];
	const seeds = [
		[SPAWN.x, SPAWN.y],
		[Math.floor(worldW / 2), Math.floor(worldH * 0.82)],
		[Math.floor(worldW / 2), Math.floor(worldH * 0.7)],
		[Math.floor(worldW / 2), Math.floor(worldH * 0.55)],
		[Math.floor(worldW * 0.3), Math.floor(worldH * 0.55)],
		[Math.floor(worldW * 0.7), Math.floor(worldH * 0.55)],
		[Math.floor(worldW * 0.22), Math.floor(worldH * 0.4)],
		[Math.floor(worldW * 0.78), Math.floor(worldH * 0.4)],
	];

	const trySeed = (sx, sy) => {
		if (sx < 1 || sy < 1 || sx >= worldW - 1 || sy >= worldH - 1) return;
		const idx = sy * worldW + sx;
		if (blocked[idx] || walk[idx]) return;
		walk[idx] = 1;
		queue.push(sx, sy);
	};
	for (const [sx, sy] of seeds) trySeed(sx, sy);

	while (queue.length) {
		const y = queue.pop();
		const x = queue.pop();
		const neighbors = [
			[x + 1, y],
			[x - 1, y],
			[x, y + 1],
			[x, y - 1],
		];
		for (const [nx, ny] of neighbors) {
			if (nx < 0 || ny < 0 || nx >= worldW || ny >= worldH) continue;
			const nidx = ny * worldW + nx;
			if (walk[nidx] || blocked[nidx]) continue;
			walk[nidx] = 1;
			queue.push(nx, ny);
		}
	}

	// Tint unwalkable interior faintly in debug (optional contrast)
	const debugCanvas = document.createElement("canvas");
	debugCanvas.width = worldW;
	debugCanvas.height = worldH;
	const dctx = debugCanvas.getContext("2d");
	dctx.putImageData(debugOverlay, 0, 0);

	const clusters = [];
	for (let p = 0; p < bluePixels.length; p += 2) {
		const x = bluePixels[p];
		const y = bluePixels[p + 1];
		let hit = null;
		for (const cl of clusters) {
			if (
				x >= cl.minX - 10 &&
				x <= cl.maxX + 10 &&
				y >= cl.minY - 10 &&
				y <= cl.maxY + 10
			) {
				hit = cl;
				break;
			}
		}
		if (!hit) {
			clusters.push({ minX: x, maxX: x, minY: y, maxY: y, n: 1 });
		} else {
			hit.minX = Math.min(hit.minX, x);
			hit.maxX = Math.max(hit.maxX, x);
			hit.minY = Math.min(hit.minY, y);
			hit.maxY = Math.max(hit.maxY, y);
			hit.n += 1;
		}
	}

	const boxes = clusters
		.filter((cl) => cl.n >= 25)
		.map((cl) => ({
			x: Math.round((cl.minX + cl.maxX) / 2),
			y: Math.round((cl.minY + cl.maxY) / 2),
			minX: cl.minX,
			minY: cl.minY,
			maxX: cl.maxX,
			maxY: cl.maxY,
		}))
		.sort((a, b) => a.y - b.y || a.x - b.x);

	const stands = assignStandNumbers(boxes, worldW);
	return { walk, stands, worldW, worldH, debugCanvas };
}

/**
 * Map detected blue boxes to stands 1–15 using the labeled outline layout.
 * Boxes are sorted top-to-bottom; within bands, left-to-right.
 */
function assignStandNumbers(boxes, worldW) {
	if (boxes.length < 10) {
		return MUSEUM_STANDS_FALLBACK.map((s) => ({ ...s }));
	}

	const sorted = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);
	const byStand = new Map();
	const taken = new Set();

	const claim = (stand, box) => {
		if (!box || byStand.has(stand) || taken.has(box)) return;
		byStand.set(stand, box);
		taken.add(box);
	};

	const top = sorted.filter((b) => b.y < 350).sort((a, b) => a.x - b.x);
	const leftTop = top.filter((b) => b.x < worldW / 2);
	const rightTop = top.filter((b) => b.x >= worldW / 2);
	claim(1, leftTop[0]);
	claim(2, leftTop[1]);
	claim(3, rightTop[0]);
	claim(4, rightTop[1]);

	// Upper wall / booth frames (5, 7, 8, 9)
	const upper = sorted
		.filter((b) => b.y >= 350 && b.y < 540)
		.sort((a, b) => a.x - b.x);
	for (const b of upper) {
		if (b.x < 400) claim(5, b);
		else if (b.x > 1000) claim(9, b);
		else if (b.x < worldW / 2) claim(7, b);
		else claim(8, b);
	}

	// Center pedestal row 11–13 (must run before side alcoves 6/10)
	const pedestalRow = sorted
		.filter((b) => b.y >= 560 && b.y < 720 && b.x > 450 && b.x < 950)
		.sort((a, b) => a.x - b.x);
	claim(11, pedestalRow[0]);
	claim(12, pedestalRow[1]);
	claim(13, pedestalRow[2]);

	// Lower side alcoves
	for (const b of sorted) {
		if (b.y < 520 || b.y >= 760) continue;
		if (b.x < 400) claim(6, b);
		else if (b.x > 1000) claim(10, b);
	}

	const bottom = sorted.filter((b) => b.y >= 760).sort((a, b) => a.x - b.x);
	for (const b of bottom) {
		if (b.x < worldW / 2) claim(14, b);
		else claim(15, b);
	}

	const unused = boxes.filter((b) => !taken.has(b));
	for (let n = 1; n <= 15; n++) {
		if (byStand.has(n)) continue;
		const fb = MUSEUM_STANDS_FALLBACK.find((s) => s.stand === n);
		const nearest =
			unused.shift() ||
			boxes.reduce((best, b) => {
				const d = Math.hypot(b.x - fb.x, b.y - fb.y);
				if (!best || d < best.d) return { b, d };
				return best;
			}, null)?.b;
		if (nearest) {
			byStand.set(n, nearest);
			taken.add(nearest);
		} else {
			byStand.set(n, { x: fb.x, y: fb.y });
		}
	}

	return [...byStand.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([stand, box]) => ({
			stand,
			x: box.x,
			y: box.y,
		}));
}

function canStand(walk, worldW, worldH, x, y) {
	const fx = Math.round(x);
	const fy = Math.round(y);
	if (fx < 0 || fy < 0 || fx >= worldW || fy >= worldH) return false;
	return walk[fy * worldW + fx] === 1;
}

function layoutExhibits(stands, catalog, exhibitAssets) {
	const byStand = new Map(stands.map((stand) => [stand.stand, stand]));
	const usedStands = new Set();
	const usedIds = new Set();
	const exhibits = [];

	for (const asset of exhibitAssets) {
		const stand = byStand.get(asset.stand);
		const project = resolveProjectFromSlug(catalog, asset.slug);
		if (!stand || !project || usedStands.has(stand.stand)) continue;
		exhibits.push(makeExhibit(project, stand, asset));
		usedStands.add(stand.stand);
		usedIds.add(project.id);
	}

	const leftoverProjects = catalog.filter((project) => !usedIds.has(project.id));
	const leftoverStands = [...stands]
		.filter((stand) => !usedStands.has(stand.stand))
		.sort((a, b) => a.stand - b.stand);
	const n = Math.min(leftoverProjects.length, leftoverStands.length);
	for (let i = 0; i < n; i++) {
		exhibits.push(makeExhibit(leftoverProjects[i], leftoverStands[i], null));
	}
	return exhibits;
}

const PEDESTAL_BOUNCE_PX = 5;
const PEDESTAL_BOUNCE_MS = 1800;

function pedestalBounceOffset(now) {
	const t = (now / PEDESTAL_BOUNCE_MS) * Math.PI * 2;
	const hop = (Math.sin(t) + 1) / 2;
	return -Math.round(hop * PEDESTAL_BOUNCE_PX);
}

function exhibitBounces(exhibit) {
	return exhibit.kind === "pedestal";
}

function drawExhibit(ctx, exhibit, now = 0) {
	const img = exhibit.image;
	const bounds = exhibit.bounds;
	if (!img || !bounds) return;
	const limits = exhibitDrawLimits(exhibit.kind, exhibit.stand);
	const scale = Math.min(limits.maxW / bounds.sw, limits.maxH / bounds.sh);
	const dw = Math.round(bounds.sw * scale);
	const dh = Math.round(bounds.sh * scale);
	const dx = Math.round(exhibit.x - dw / 2);
	let dy = Math.round(exhibit.y - dh * limits.yAnchor);
	if (exhibitBounces(exhibit)) {
		dy += pedestalBounceOffset(now);
	}
	// Smooth scaling keeps exhibit detail when the hi-DPI canvas is larger
	// than the museum world size.
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(
		img,
		bounds.sx,
		bounds.sy,
		bounds.sw,
		bounds.sh,
		dx,
		dy,
		dw,
		dh,
	);
	ctx.imageSmoothingEnabled = false;
}

function syncCanvasResolution(canvas, ctx, worldEl, worldW, worldH) {
	if (!canvas || !worldEl || !worldW || !worldH) return;
	const cssW = worldEl.clientWidth || worldW;
	const cssH = worldEl.clientHeight || worldH;
	const dpr = Math.min(window.devicePixelRatio || 1, 3);
	const bw = Math.max(1, Math.round(cssW * dpr));
	const bh = Math.max(1, Math.round(cssH * dpr));
	if (canvas.width !== bw || canvas.height !== bh) {
		canvas.width = bw;
		canvas.height = bh;
	}
	ctx.setTransform(bw / worldW, 0, 0, bh / worldH, 0, 0);
	ctx.imageSmoothingEnabled = false;
}

function getStripFrame(strip, frameCount, frameIndex) {
	const fullWidth = strip.naturalWidth || strip.width;
	const fullHeight = strip.naturalHeight || strip.height;
	const startX = Math.round((fullWidth * frameIndex) / frameCount);
	const endX = Math.round((fullWidth * (frameIndex + 1)) / frameCount);
	return {
		sx: startX,
		sy: 0,
		sw: endX - startX,
		sh: fullHeight,
	};
}

function getIdleFrameIndex(frameCount) {
	return frameCount >= 3 ? 1 : 0;
}

function getWalkFrameIndex(frameCount, step) {
	if (frameCount === 3) {
		const cycle = [0, 1, 2, 1];
		return cycle[step % cycle.length];
	}
	return step % frameCount;
}

function drawPlayer(ctx, strips, x, y, facing, step, moving) {
	const strip = strips[facing] || strips.down;
	const frameCount = CHAR_FRAME_COUNTS[facing] || CHAR_FRAME_COUNTS.down;
	const frameIndex = moving
		? getWalkFrameIndex(frameCount, step)
		: getIdleFrameIndex(frameCount);
	const frame = getStripFrame(strip, frameCount, frameIndex);
	const scale = PLAYER_DRAW_H / frame.sh;
	const dw = frame.sw * scale;
	const dh = PLAYER_DRAW_H;
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(
		strip,
		frame.sx,
		frame.sy,
		frame.sw,
		frame.sh,
		Math.round(x - dw / 2),
		Math.round(y - dh + 6),
		Math.round(dw),
		Math.round(dh),
	);
}

function findNearestExhibit(exhibits, px, py) {
	let best = null;
	let bestDist = Infinity;
	for (const ex of exhibits) {
		const d = Math.hypot(ex.x - px, ex.y - py);
		if (d < bestDist) {
			bestDist = d;
			best = ex;
		}
	}
	if (best && bestDist <= PROXIMITY) return best;
	return null;
}

function followPlayerCamera(stageEl, worldEl, player, worldW, worldH) {
	if (!stageEl || !worldEl) return;
	const viewW = stageEl.clientWidth;
	const viewH = stageEl.clientHeight;
	const mapW = worldEl.offsetWidth;
	const mapH = worldEl.offsetHeight;
	if (!viewW || !viewH || !mapW || !mapH) return;

	const scaleX = mapW / worldW;
	const scaleY = mapH / worldH;
	let offsetX = player.x * scaleX - viewW / 2;
	let offsetY = player.y * scaleY - viewH / 2;
	offsetX = Math.max(0, Math.min(offsetX, Math.max(0, mapW - viewW)));
	offsetY = Math.max(0, Math.min(offsetY, Math.max(0, mapH - viewH)));
	worldEl.style.transform = `translate(${-Math.round(offsetX)}px, ${-Math.round(offsetY)}px)`;
}

function PixelMuseum() {
	const canvasRef = useRef(null);
	const stageRef = useRef(null);
	const worldRef = useRef(null);
	const keysRef = useRef(new Set());
	const stateRef = useRef(null);
	const [nearby, setNearby] = useState(null);
	const [ready, setReady] = useState(false);
	const [showHitboxes, setShowHitboxes] = useState(false);

	useEffect(() => {
		const bg = new Image();
		const outline = new Image();
		const charStrips = {
			down: new Image(),
			left: new Image(),
			right: new Image(),
			up: new Image(),
		};
		bg.src = MUSEUM_URL;
		outline.src = OUTLINE_URL;
		Object.entries(CHAR_STRIP_URLS).forEach(([dir, url]) => {
			charStrips[dir].src = url;
		});

		const exhibitImgs = MUSEUM_EXHIBITS.map((asset) => {
			const img = new Image();
			img.src = `${asset.src}?v=${ASSET_VER}`;
			return { ...asset, img };
		});

		let cancelled = false;
		let raf = 0;
		let loaded = 0;
		let started = false;
		const assetCount =
			2 + Object.keys(charStrips).length + exhibitImgs.length;

		const tryStart = () => {
			loaded += 1;
			if (started || loaded < assetCount || cancelled) return;
			started = true;

			const bgWorldW = bg.naturalWidth || MUSEUM_SIZE.w;
			const bgWorldH = bg.naturalHeight || MUSEUM_SIZE.h;
			if (
				bg.naturalWidth !== outline.naturalWidth ||
				bg.naturalHeight !== outline.naturalHeight
			) {
				console.error(
					"museum.png and museum_outline.png size mismatch (outline is remapped to museum size)",
					bg.naturalWidth,
					bg.naturalHeight,
					outline.naturalWidth,
					outline.naturalHeight,
				);
			}

			const { walk, stands, worldW, worldH, debugCanvas } =
				parseOutline(outline, bgWorldW, bgWorldH);
			const exhibits = layoutExhibits(stands, MUSEUM_CATALOG, exhibitImgs);

			let spawnX = SPAWN.x;
			let spawnY = SPAWN.y;
			if (!canStand(walk, worldW, worldH, spawnX, spawnY)) {
				outer: for (let r = 0; r < 160; r += 4) {
					for (let a = 0; a < 16; a++) {
						const tx = Math.round(
							SPAWN.x + Math.cos((a / 16) * Math.PI * 2) * r,
						);
						const ty = Math.round(
							SPAWN.y + Math.sin((a / 16) * Math.PI * 2) * r,
						);
						if (canStand(walk, worldW, worldH, tx, ty)) {
							spawnX = tx;
							spawnY = ty;
							break outer;
						}
					}
				}
			}

			stateRef.current = {
				bg,
				charStrips,
				walk,
				worldW,
				worldH,
				debugCanvas,
				exhibits,
				player: {
					x: spawnX,
					y: spawnY,
					facing: "up",
					step: 0,
					moveAcc: 0,
				},
				lastNearbyId: null,
				showHitboxes: false,
			};
			setReady(true);

			const onKeyDown = (e) => {
				const k = e.key.toLowerCase();
				if (k === "h") {
					stateRef.current.showHitboxes = !stateRef.current.showHitboxes;
					setShowHitboxes(stateRef.current.showHitboxes);
					return;
				}
				if (
					[
						"arrowup",
						"arrowdown",
						"arrowleft",
						"arrowright",
						"w",
						"a",
						"s",
						"d",
					].includes(k)
				) {
					e.preventDefault();
					keysRef.current.add(k);
				}
			};
			const onKeyUp = (e) => {
				keysRef.current.delete(e.key.toLowerCase());
			};
			window.addEventListener("keydown", onKeyDown);
			window.addEventListener("keyup", onKeyUp);

			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");
			syncCanvasResolution(canvas, ctx, worldRef.current, worldW, worldH);

			let last = performance.now();

			const tick = (now) => {
				const dt = Math.min(0.05, (now - last) / 1000);
				last = now;
				const state = stateRef.current;
				if (!state) {
					raf = requestAnimationFrame(tick);
					return;
				}
				const {
					player,
					exhibits,
					walk: walkMask,
					worldW: w,
					worldH: h,
				} = state;
				const keys = keysRef.current;

				let dx = 0;
				let dy = 0;
				if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
				if (keys.has("arrowright") || keys.has("d")) dx += 1;
				if (keys.has("arrowup") || keys.has("w")) dy -= 1;
				if (keys.has("arrowdown") || keys.has("s")) dy += 1;

				if (dx !== 0 || dy !== 0) {
					const len = Math.hypot(dx, dy) || 1;
					dx /= len;
					dy /= len;
					const speed = PLAYER_SPEED * dt;
					const nextX = player.x + dx * speed;
					const nextY = player.y + dy * speed;

					if (canStand(walkMask, w, h, nextX, player.y)) player.x = nextX;
					if (canStand(walkMask, w, h, player.x, nextY)) player.y = nextY;

					if (Math.abs(dx) > Math.abs(dy)) {
						player.facing = dx < 0 ? "left" : "right";
					} else {
						player.facing = dy < 0 ? "up" : "down";
					}
					player.moveAcc += speed;
					if (player.moveAcc > WALK_CYCLE_DISTANCE) {
						player.step += 1;
						player.moveAcc = 0;
					}
				} else {
					player.moveAcc = 0;
				}

				const hit = findNearestExhibit(exhibits, player.x, player.y);
				const nextId = hit?.id ?? null;
				if (nextId !== state.lastNearbyId) {
					state.lastNearbyId = nextId;
					setNearby(
						hit
							? {
									id: hit.id,
									stand: hit.stand,
									title: hit.title,
									blurb: hit.blurb,
									hasPage: hit.hasPage,
								}
							: null,
					);
				}

				syncCanvasResolution(canvas, ctx, worldRef.current, w, h);
				ctx.imageSmoothingEnabled = false;
				ctx.clearRect(0, 0, w, h);
				ctx.drawImage(state.bg, 0, 0, w, h);

				// Overlay outline hitboxes in the same pixel space as the art
				if (state.showHitboxes && state.debugCanvas) {
					ctx.drawImage(state.debugCanvas, 0, 0);
				}

				const pictures = exhibits.filter(
					(ex) => ex.kind === "picture" && ex.image,
				);
				const pedestals = exhibits
					.filter((ex) => ex.kind === "pedestal" && ex.image)
					.sort((a, b) => a.y - b.y);

				for (const ex of pictures) drawExhibit(ctx, ex, now);
				for (const ex of pedestals) {
					if (ex.y < player.y) drawExhibit(ctx, ex, now);
				}

				if (hit) {
					ctx.strokeStyle = "rgba(255, 230, 150, 0.9)";
					ctx.lineWidth = 2;
					ctx.strokeRect(hit.x - 18, hit.y - 18, 36, 36);
				}

				drawPlayer(
					ctx,
					state.charStrips,
					player.x,
					player.y,
					player.facing,
					player.step,
					dx !== 0 || dy !== 0,
				);

				for (const ex of pedestals) {
					if (ex.y >= player.y) drawExhibit(ctx, ex, now);
				}

				followPlayerCamera(
					stageRef.current,
					worldRef.current,
					player,
					w,
					h,
				);
				raf = requestAnimationFrame(tick);
			};

			raf = requestAnimationFrame(tick);

			stateRef.current.cleanup = () => {
				cancelAnimationFrame(raf);
				window.removeEventListener("keydown", onKeyDown);
				window.removeEventListener("keyup", onKeyUp);
			};
		};

		bg.onload = tryStart;
		outline.onload = tryStart;
		bg.onerror = () => console.error("Failed to load museum.png");
		outline.onerror = () => console.error("Failed to load museum_outline.png");
		Object.entries(charStrips).forEach(([dir, img]) => {
			img.onload = tryStart;
			img.onerror = () =>
				console.error(`Failed to load character_movement/${dir}.png`);
		});
		exhibitImgs.forEach(({ src, img }) => {
			img.onload = tryStart;
			img.onerror = () => {
				console.error(`Failed to load exhibit ${src}`);
				tryStart();
			};
			if (img.complete && img.naturalWidth) tryStart();
		});
		if (bg.complete && bg.naturalWidth) tryStart();
		if (outline.complete && outline.naturalWidth) tryStart();
		Object.values(charStrips).forEach((img) => {
			if (img.complete && img.naturalWidth) tryStart();
		});

		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			stateRef.current?.cleanup?.();
		};
	}, []);

	const nudge = (dir) => {
		const map = { up: "w", down: "s", left: "a", right: "d" };
		keysRef.current.add(map[dir]);
	};
	const release = (dir) => {
		const map = { up: "w", down: "s", left: "a", right: "d" };
		keysRef.current.delete(map[dir]);
	};

	return (
		<div className="pixel-museum">
			<div className="pixel-museum-board">
				<MuseumFigures side="left" />
				<div className="pixel-museum-stage" ref={stageRef}>
					<div className="pixel-museum-world" ref={worldRef}>
						<canvas
							ref={canvasRef}
							className="pixel-museum-canvas"
							aria-label="Pixel art museum. Use WASD or arrow keys to walk."
						/>
					</div>
					{!ready && <p className="pixel-museum-loading">Loading museum…</p>}
				</div>
				<MuseumFigures side="right" />
				<div
					className={`pixel-museum-caption${nearby ? " is-visible" : ""}`}
					role="status"
					aria-live="polite"
				>
				{nearby ? (
					<>
						<strong className="pixel-museum-label-title">
							#{nearby.stand} · {nearby.title}
						</strong>
						<span className="pixel-museum-label-blurb">{nearby.blurb}</span>
						{nearby.hasPage ? (
							<Link
								to={`/projects/${nearby.id}`}
								className="pixel-museum-label-link"
							>
								View details →
							</Link>
						) : (
							<span className="pixel-museum-label-blurb">Planned project</span>
						)}
					</>
				) : (
					<span className="pixel-museum-caption-idle">
						Walk near a numbered stand to read about a project.
						{showHitboxes ? " (hitbox overlay on — press H)" : " (press H for overlay)"}
					</span>
				)}
			</div>
			</div>
			<div className="pixel-museum-controls" aria-label="Touch controls">
				<button
					type="button"
					className="pixel-museum-pad"
					onPointerDown={(e) => {
						e.preventDefault();
						nudge("up");
					}}
					onPointerUp={() => release("up")}
					onPointerLeave={() => release("up")}
					onPointerCancel={() => release("up")}
				>
					▲
				</button>
				<div className="pixel-museum-pad-row">
					<button
						type="button"
						className="pixel-museum-pad"
						onPointerDown={(e) => {
							e.preventDefault();
							nudge("left");
						}}
						onPointerUp={() => release("left")}
						onPointerLeave={() => release("left")}
						onPointerCancel={() => release("left")}
					>
						◀
					</button>
					<button
						type="button"
						className="pixel-museum-pad"
						onPointerDown={(e) => {
							e.preventDefault();
							nudge("down");
						}}
						onPointerUp={() => release("down")}
						onPointerLeave={() => release("down")}
						onPointerCancel={() => release("down")}
					>
						▼
					</button>
					<button
						type="button"
						className="pixel-museum-pad"
						onPointerDown={(e) => {
							e.preventDefault();
							nudge("right");
						}}
						onPointerUp={() => release("right")}
						onPointerLeave={() => release("right")}
						onPointerCancel={() => release("right")}
					>
						▶
					</button>
				</div>
			</div>
		</div>
	);
}

export default PixelMuseum;
