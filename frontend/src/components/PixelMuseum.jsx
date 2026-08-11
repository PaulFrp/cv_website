import { useEffect, useRef, useState } from "react";
import { projects } from "../data/projects";
import {
	MUSEUM_SIZE,
	MUSEUM_STANDS_FALLBACK,
	SPAWN,
} from "../data/museumLayout";
import { getShortProjectBlurb } from "../utils/projectText";

const PLAYER_SPEED = 140;
const PROXIMITY = 70;
// Cache-bust so an old museum.png can't stay misaligned with the outline.
const ASSET_VER = "20260811d";
const MUSEUM_URL = `/museum/museum.png?v=${ASSET_VER}`;
const OUTLINE_URL = `/museum/museum_outline.png?v=${ASSET_VER}`;
const CHAR_URL = `/museum/character.png?v=${ASSET_VER}`;

/** Cropped frames from Character.png 2×2 sheet. */
const CHAR_FRAMES = {
	down: { sx: 276, sy: 68, sw: 207, sh: 517 },
	right: { sx: 783, sy: 76, sw: 197, sh: 511 },
	up: { sx: 276, sy: 655, sw: 207, sh: 509 },
	left: { sx: 795, sy: 661, sw: 193, sh: 511 },
};

const CHAR_DRAW_H = 64;
const CHAR_BG_KEY = { r: 46, g: 47, b: 45 };

/** Tool red on museum_outline.png (≈ #ED1C24). */
const OUTLINE_RED = { r: 237, g: 28, b: 36 };
/** Tool blue markers (≈ #3F48CC). */
const OUTLINE_BLUE = { r: 63, g: 72, b: 204 };

function isCharacterBackground(r, g, b) {
	// Only strip flat gray sheet backdrop — keep black outlines + dark clothes.
	const avg = (r + g + b) / 3;
	if (avg < 28) return false;
	const nearGray =
		Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10 && Math.abs(r - b) <= 10;
	if (!nearGray) return false;
	const dist =
		Math.abs(r - CHAR_BG_KEY.r) +
		Math.abs(g - CHAR_BG_KEY.g) +
		Math.abs(b - CHAR_BG_KEY.b);
	return dist <= 28;
}

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

function shuffle(list) {
	const a = [...list];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/**
 * Red pixels = exact collision boundaries in image pixel space.
 * Walkable = region reachable from spawn without crossing red.
 * Blue blobs = project spot rectangles.
 * Uses the outline image's native pixels 1:1 (no window scaling).
 */
function parseOutline(image) {
	const worldW = image.naturalWidth || MUSEUM_SIZE.w;
	const worldH = image.naturalHeight || MUSEUM_SIZE.h;
	const c = document.createElement("canvas");
	c.width = worldW;
	c.height = worldH;
	const ctx = c.getContext("2d", { willReadFrequently: true });
	// 1:1 copy — never stretch to CSS/window size
	ctx.drawImage(image, 0, 0);
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

	const top = sorted.filter((b) => b.y < 380).sort((a, b) => a.x - b.x);
	const upperMid = sorted
		.filter((b) => b.y >= 380 && b.y < 520)
		.sort((a, b) => a.x - b.x);
	const mid = sorted
		.filter((b) => b.y >= 520 && b.y < 650)
		.sort((a, b) => a.x - b.x);
	const lowerMid = sorted
		.filter((b) => b.y >= 650 && b.y < 780)
		.sort((a, b) => a.x - b.x);
	const bottom = sorted.filter((b) => b.y >= 780).sort((a, b) => a.x - b.x);

	const byStand = new Map();

	if (top.length >= 4) {
		const leftTop = top.filter((b) => b.x < worldW / 2);
		const rightTop = top.filter((b) => b.x >= worldW / 2);
		if (leftTop[0]) byStand.set(1, leftTop[0]);
		if (leftTop[1]) byStand.set(2, leftTop[1]);
		if (rightTop[0]) byStand.set(3, rightTop[0]);
		if (rightTop[1]) byStand.set(4, rightTop[1]);
	}

	for (const b of upperMid) {
		if (b.x < 400 && !byStand.has(5)) byStand.set(5, b);
		else if (b.x > 1000 && !byStand.has(9)) byStand.set(9, b);
		else if (b.x < worldW / 2 && !byStand.has(7)) byStand.set(7, b);
		else if (!byStand.has(8)) byStand.set(8, b);
	}

	for (const b of mid) {
		if (b.x < 400 && !byStand.has(6)) byStand.set(6, b);
		else if (b.x > 1000 && !byStand.has(10)) byStand.set(10, b);
	}

	const pedestalRow = lowerMid.length
		? lowerMid
		: sorted.filter((b) => b.y >= 600 && b.y < 760 && b.x > 400 && b.x < 1000);
	const row = [...pedestalRow].sort((a, b) => a.x - b.x);
	if (row[0]) byStand.set(11, row[0]);
	if (row[1]) byStand.set(12, row[1]);
	if (row[2]) byStand.set(13, row[2]);

	for (const b of bottom) {
		if (b.x < worldW / 2 && !byStand.has(14)) byStand.set(14, b);
		else if (!byStand.has(15)) byStand.set(15, b);
	}

	const used = new Set([...byStand.values()]);
	const unused = boxes.filter((b) => !used.has(b));
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
		if (nearest) byStand.set(n, nearest);
		else byStand.set(n, { x: fb.x, y: fb.y });
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

function layoutExhibits(stands, list) {
	const shuffledProjects = shuffle(list);
	const shuffledStands = shuffle(stands);
	const count = Math.min(shuffledStands.length, shuffledProjects.length);
	const exhibits = [];
	for (let i = 0; i < count; i++) {
		const project = shuffledProjects[i];
		const stand = shuffledStands[i];
		exhibits.push({
			id: project.id,
			stand: stand.stand,
			title: project.title,
			blurb: getShortProjectBlurb(project.description, 72),
			x: stand.x,
			y: stand.y,
		});
	}
	return exhibits;
}

function chromaKeySheet(image) {
	const c = document.createElement("canvas");
	c.width = image.naturalWidth || image.width;
	c.height = image.naturalHeight || image.height;
	const ctx = c.getContext("2d", { willReadFrequently: true });
	ctx.drawImage(image, 0, 0);
	const img = ctx.getImageData(0, 0, c.width, c.height);
	const { data } = img;
	for (let i = 0; i < data.length; i += 4) {
		if (isCharacterBackground(data[i], data[i + 1], data[i + 2])) {
			data[i + 3] = 0;
		}
	}
	ctx.putImageData(img, 0, 0);
	return c;
}

/**
 * museum.png currently has the same red/blue markup baked in.
 * Rebuild a clean display image by inpainting those overlay pixels from neighbors.
 * Collision still uses museum_outline.png unchanged.
 */
function scrubOverlayColors(image) {
	const w = image.naturalWidth || image.width;
	const h = image.naturalHeight || image.height;
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	ctx.drawImage(image, 0, 0);
	const img = ctx.getImageData(0, 0, w, h);
	const d = img.data;
	const overlay = new Uint8Array(w * h);

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			if (
				isRedBoundary(d[i], d[i + 1], d[i + 2]) ||
				isBlueMarker(d[i], d[i + 1], d[i + 2])
			) {
				overlay[y * w + x] = 1;
			}
		}
	}

	let remaining = true;
	for (let pass = 0; pass < 100 && remaining; pass++) {
		remaining = false;
		const cleared = [];
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const idx = y * w + x;
				if (!overlay[idx]) continue;
				let sr = 0;
				let sg = 0;
				let sb = 0;
				let n = 0;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						if (dx === 0 && dy === 0) continue;
						const nx = x + dx;
						const ny = y + dy;
						if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
						const nidx = ny * w + nx;
						if (overlay[nidx]) continue;
						const ni = nidx * 4;
						sr += d[ni];
						sg += d[ni + 1];
						sb += d[ni + 2];
						n += 1;
					}
				}
				if (n > 0) {
					const i = idx * 4;
					d[i] = Math.round(sr / n);
					d[i + 1] = Math.round(sg / n);
					d[i + 2] = Math.round(sb / n);
					cleared.push(idx);
					remaining = true;
				}
			}
		}
		for (const idx of cleared) overlay[idx] = 0;
	}

	ctx.putImageData(img, 0, 0);
	return canvas;
}

function drawPlayer(ctx, sheet, x, y, facing) {
	const frame = CHAR_FRAMES[facing] || CHAR_FRAMES.down;
	const scale = CHAR_DRAW_H / frame.sh;
	const dw = frame.sw * scale;
	const dh = CHAR_DRAW_H;
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(
		sheet,
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

function PixelMuseum() {
	const canvasRef = useRef(null);
	const keysRef = useRef(new Set());
	const stateRef = useRef(null);
	const [nearby, setNearby] = useState(null);
	const [ready, setReady] = useState(false);
	const [showHitboxes, setShowHitboxes] = useState(false);

	useEffect(() => {
		const bg = new Image();
		const outline = new Image();
		const charImg = new Image();
		bg.src = MUSEUM_URL;
		outline.src = OUTLINE_URL;
		charImg.src = CHAR_URL;

		let cancelled = false;
		let raf = 0;
		let loaded = 0;
		let started = false;

		const tryStart = () => {
			loaded += 1;
			if (started || loaded < 3 || cancelled) return;
			started = true;

			if (
				bg.naturalWidth !== outline.naturalWidth ||
				bg.naturalHeight !== outline.naturalHeight
			) {
				console.error(
					"museum.png and museum_outline.png size mismatch",
					bg.naturalWidth,
					bg.naturalHeight,
					outline.naturalWidth,
					outline.naturalHeight,
				);
			}

			const { walk, stands, worldW, worldH, debugCanvas } =
				parseOutline(outline);
			// Prefer the clean museum art as-is; scrub only if markup slipped in.
			const displayBg = scrubOverlayColors(bg);
			const charSheet = chromaKeySheet(charImg);
			const exhibits = layoutExhibits(stands, projects);

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
				bg: displayBg,
				charSheet,
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
			canvas.width = worldW;
			canvas.height = worldH;
			ctx.imageSmoothingEnabled = false;

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
					if (player.moveAcc > 10) {
						player.step += 1;
						player.moveAcc = 0;
					}
				}

				const hit = findNearestExhibit(exhibits, player.x, player.y);
				const nextId = hit?.id ?? null;
				if (nextId !== state.lastNearbyId) {
					state.lastNearbyId = nextId;
					setNearby(
						hit
							? {
									stand: hit.stand,
									title: hit.title,
									blurb: hit.blurb,
								}
							: null,
					);
				}

				ctx.imageSmoothingEnabled = false;
				ctx.clearRect(0, 0, w, h);
				ctx.drawImage(state.bg, 0, 0);

				// Overlay outline hitboxes in the same pixel space as the art
				if (state.showHitboxes && state.debugCanvas) {
					ctx.drawImage(state.debugCanvas, 0, 0);
				}

				if (hit) {
					ctx.strokeStyle = "rgba(255, 230, 150, 0.9)";
					ctx.lineWidth = 2;
					ctx.strokeRect(hit.x - 18, hit.y - 18, 36, 36);
				}

				drawPlayer(
					ctx,
					state.charSheet,
					player.x,
					player.y,
					player.facing,
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
		charImg.onload = tryStart;
		bg.onerror = () => console.error("Failed to load museum.png");
		outline.onerror = () => console.error("Failed to load museum_outline.png");
		charImg.onerror = () => console.error("Failed to load character.png");
		if (bg.complete && bg.naturalWidth) tryStart();
		if (outline.complete && outline.naturalWidth) tryStart();
		if (charImg.complete && charImg.naturalWidth) tryStart();

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
			<div className="pixel-museum-stage">
				<canvas
					ref={canvasRef}
					className="pixel-museum-canvas"
					aria-label="Pixel art museum. Use WASD or arrow keys to walk."
				/>
				{!ready && <p className="pixel-museum-loading">Loading museum…</p>}
			</div>
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
					</>
				) : (
					<span className="pixel-museum-caption-idle">
						Walk near a numbered stand to read about a project.
						{showHitboxes ? " (hitbox overlay on — press H)" : " (press H for overlay)"}
					</span>
				)}
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
