import { useEffect, useRef, useState } from "react";
import { projects } from "../data/projects";
import { getShortProjectBlurb } from "../utils/projectText";

const TILE = 16;
const SCALE = 3;
const PLAYER_SPEED = 70; // world px per second
const PROXIMITY = 36;

const TILE_FLOOR = 0;
const TILE_WALL = 1;
const TILE_PILLAR = 2;

const MAP_W = 28;
const MAP_H = 18;

const EXHIBIT_COLORS = [
	"#c45c26",
	"#2a6f6f",
	"#5b4a8a",
	"#8a4a3a",
	"#3a6a8a",
	"#6a7a3a",
	"#8a3a5a",
	"#4a5a7a",
	"#7a5a2a",
	"#3a7a5a",
	"#6a3a7a",
];

function buildMap() {
	const tiles = Array.from({ length: MAP_H }, (_, y) =>
		Array.from({ length: MAP_W }, (_, x) => {
			if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) {
				return TILE_WALL;
			}
			return TILE_FLOOR;
		}),
	);

	// Interior pillars for museum structure
	const pillarSpots = [
		[7, 5],
		[20, 5],
		[7, 12],
		[20, 12],
	];
	for (const [px, py] of pillarSpots) {
		tiles[py][px] = TILE_PILLAR;
		tiles[py][px + 1] = TILE_PILLAR;
		tiles[py + 1][px] = TILE_PILLAR;
		tiles[py + 1][px + 1] = TILE_PILLAR;
	}

	return tiles;
}

function layoutExhibits(list) {
	// Place exhibits in a museum ring / aisles, avoid walls & pillars
	const slots = [
		[4, 3],
		[9, 3],
		[14, 3],
		[19, 3],
		[23, 3],
		[4, 8],
		[23, 8],
		[4, 13],
		[9, 13],
		[14, 13],
		[19, 13],
		[23, 13],
	];

	return list.slice(0, slots.length).map((project, i) => {
		const [tx, ty] = slots[i];
		return {
			id: project.id,
			title: project.title,
			blurb: getShortProjectBlurb(project.description),
			color: EXHIBIT_COLORS[i % EXHIBIT_COLORS.length],
			x: tx * TILE + TILE / 2,
			y: ty * TILE + TILE / 2,
			tileX: tx,
			tileY: ty,
		};
	});
}

function isBlocked(tiles, worldX, worldY, halfW, halfH) {
	const points = [
		[worldX - halfW, worldY - halfH],
		[worldX + halfW, worldY - halfH],
		[worldX - halfW, worldY + halfH],
		[worldX + halfW, worldY + halfH],
	];
	for (const [px, py] of points) {
		const tx = Math.floor(px / TILE);
		const ty = Math.floor(py / TILE);
		if (ty < 0 || tx < 0 || ty >= MAP_H || tx >= MAP_W) return true;
		const t = tiles[ty][tx];
		if (t === TILE_WALL || t === TILE_PILLAR) return true;
	}
	return false;
}

function drawFloor(ctx, tiles) {
	for (let y = 0; y < MAP_H; y++) {
		for (let x = 0; x < MAP_W; x++) {
			const t = tiles[y][x];
			const px = x * TILE;
			const py = y * TILE;
			if (t === TILE_WALL) {
				ctx.fillStyle = "#4a3f35";
				ctx.fillRect(px, py, TILE, TILE);
				ctx.fillStyle = "#5c4f43";
				ctx.fillRect(px + 1, py + 1, TILE - 2, 4);
			} else if (t === TILE_PILLAR) {
				ctx.fillStyle = "#6b5e50";
				ctx.fillRect(px, py, TILE, TILE);
				ctx.fillStyle = "#8a7a68";
				ctx.fillRect(px + 3, py + 2, TILE - 6, TILE - 4);
			} else {
				const checker = (x + y) % 2 === 0;
				ctx.fillStyle = checker ? "#d4c4a8" : "#cbb896";
				ctx.fillRect(px, py, TILE, TILE);
				// subtle plank line
				ctx.fillStyle = "rgba(90,70,40,0.12)";
				ctx.fillRect(px, py + TILE - 1, TILE, 1);
			}
		}
	}
}

function drawExhibit(ctx, exhibit) {
	const { x, y, color } = exhibit;
	// Pedestal
	ctx.fillStyle = "#7a6a58";
	ctx.fillRect(x - 6, y + 2, 12, 6);
	ctx.fillStyle = "#9a8870";
	ctx.fillRect(x - 7, y + 1, 14, 2);
	// Frame
	ctx.fillStyle = "#2e2a26";
	ctx.fillRect(x - 7, y - 12, 14, 13);
	ctx.fillStyle = color;
	ctx.fillRect(x - 5, y - 10, 10, 9);
	// Tiny "artwork" detail
	ctx.fillStyle = "rgba(255,255,255,0.25)";
	ctx.fillRect(x - 4, y - 9, 4, 3);
	ctx.fillStyle = "rgba(0,0,0,0.2)";
	ctx.fillRect(x - 1, y - 5, 5, 3);
}

function drawPlayer(ctx, x, y, facing, step) {
	const bob = step % 2 === 0 ? 0 : 1;
	// Shadow
	ctx.fillStyle = "rgba(0,0,0,0.2)";
	ctx.fillRect(x - 5, y + 6, 10, 3);
	// Legs
	ctx.fillStyle = "#2c3e50";
	if (facing === "left" || facing === "right") {
		ctx.fillRect(x - 3, y + 2 + bob, 2, 5);
		ctx.fillRect(x + 1, y + 2 + (1 - bob), 2, 5);
	} else {
		ctx.fillRect(x - 3, y + 2, 2, 5);
		ctx.fillRect(x + 1, y + 2, 2, 5);
	}
	// Body
	ctx.fillStyle = "#3d5a80";
	ctx.fillRect(x - 4, y - 4, 8, 7);
	// Head
	ctx.fillStyle = "#e0b090";
	ctx.fillRect(x - 3, y - 10, 6, 6);
	// Hair
	ctx.fillStyle = "#3b2f2f";
	ctx.fillRect(x - 3, y - 11, 6, 2);
	ctx.fillRect(x - 4, y - 9, 1, 3);
	ctx.fillRect(x + 3, y - 9, 1, 3);
	// Eyes
	ctx.fillStyle = "#1a1a1a";
	if (facing === "left") {
		ctx.fillRect(x - 2, y - 8, 1, 1);
	} else if (facing === "right") {
		ctx.fillRect(x + 1, y - 8, 1, 1);
	} else {
		ctx.fillRect(x - 2, y - 8, 1, 1);
		ctx.fillRect(x + 1, y - 8, 1, 1);
	}
}

function findNearestExhibit(exhibits, px, py) {
	let best = null;
	let bestDist = Infinity;
	for (const ex of exhibits) {
		const dx = ex.x - px;
		const dy = ex.y - py;
		const d = Math.hypot(dx, dy);
		if (d < bestDist) {
			bestDist = d;
			best = ex;
		}
	}
	if (best && bestDist <= PROXIMITY) {
		return { exhibit: best, dist: bestDist };
	}
	return null;
}

function PixelMuseum() {
	const canvasRef = useRef(null);
	const keysRef = useRef(new Set());
	const stateRef = useRef(null);
	const [nearby, setNearby] = useState(null);

	useEffect(() => {
		const tiles = buildMap();
		const exhibits = layoutExhibits(projects);
		stateRef.current = {
			tiles,
			exhibits,
			player: {
				x: (MAP_W / 2) * TILE,
				y: (MAP_H - 3) * TILE,
				facing: "up",
				step: 0,
				moveAcc: 0,
			},
			lastNearbyId: null,
		};

		const onKeyDown = (e) => {
			const k = e.key.toLowerCase();
			if (
				["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(
					k,
				)
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
		ctx.imageSmoothingEnabled = false;

		let raf = 0;
		let last = performance.now();

		const tick = (now) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			const state = stateRef.current;
			const { player, tiles, exhibits } = state;
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
				const halfW = 4;
				const halfH = 5;

				if (!isBlocked(tiles, nextX, player.y, halfW, halfH)) {
					player.x = nextX;
				}
				if (!isBlocked(tiles, player.x, nextY, halfW, halfH)) {
					player.y = nextY;
				}

				if (Math.abs(dx) > Math.abs(dy)) {
					player.facing = dx < 0 ? "left" : "right";
				} else {
					player.facing = dy < 0 ? "up" : "down";
				}
				player.moveAcc += speed;
				if (player.moveAcc > 6) {
					player.step += 1;
					player.moveAcc = 0;
				}
			}

			// Proximity (block exhibits gently by treating pedestal tiles as soft — skip hard block for now)
			const hit = findNearestExhibit(exhibits, player.x, player.y);
			const nextId = hit?.exhibit.id ?? null;
			if (nextId !== state.lastNearbyId) {
				state.lastNearbyId = nextId;
				setNearby(hit ? { title: hit.exhibit.title, blurb: hit.exhibit.blurb } : null);
			}

			// Draw (world space, then scale via CSS / canvas transform)
			const cssW = MAP_W * TILE * SCALE;
			const cssH = MAP_H * TILE * SCALE;
			if (canvas.width !== MAP_W * TILE || canvas.height !== MAP_H * TILE) {
				canvas.width = MAP_W * TILE;
				canvas.height = MAP_H * TILE;
				canvas.style.width = `${cssW}px`;
				canvas.style.height = `${cssH}px`;
				ctx.imageSmoothingEnabled = false;
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawFloor(ctx, tiles);

			// Sort exhibits + player by y for simple depth
			const drawList = [
				...exhibits.map((ex) => ({ type: "ex", ex, y: ex.y })),
				{ type: "player", y: player.y },
			].sort((a, b) => a.y - b.y);

			for (const item of drawList) {
				if (item.type === "ex") {
					drawExhibit(ctx, item.ex);
					// Soft glow when nearby
					if (hit && hit.exhibit.id === item.ex.id) {
						ctx.strokeStyle = "rgba(255,240,180,0.7)";
						ctx.lineWidth = 1;
						ctx.strokeRect(item.ex.x - 8, item.ex.y - 13, 16, 22);
					}
				} else {
					drawPlayer(ctx, player.x, player.y, player.facing, player.step);
				}
			}

			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, []);

	const nudge = (dir) => {
		const map = {
			up: "w",
			down: "s",
			left: "a",
			right: "d",
		};
		const k = map[dir];
		keysRef.current.add(k);
	};
	const release = (dir) => {
		const map = {
			up: "w",
			down: "s",
			left: "a",
			right: "d",
		};
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
				{nearby && (
					<div className="pixel-museum-label" role="status">
						<strong className="pixel-museum-label-title">{nearby.title}</strong>
						<p className="pixel-museum-label-blurb">{nearby.blurb}</p>
					</div>
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
