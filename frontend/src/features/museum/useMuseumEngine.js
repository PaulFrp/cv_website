import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { futureProjects, projects } from "../projects/data/projects";
import { loadMuseumAssets } from "./engine/assets";
import { MUSEUM_WORLD } from "./engine/config";
import { buildExhibits, findNearbyExhibit } from "./engine/exhibits";
import {
	findSpawn,
	findSpawnNear,
	isWalkable,
	parseOutline,
} from "./engine/outline";
import {
	createPlayer,
	MOVEMENT_KEYS,
	movePlayer,
	readMovementVector,
} from "./engine/player";
import {
	recallMuseumPlayer,
	rememberMuseumPlayer,
	trackMuseumPlayer,
} from "./engine/playerMemory";
import { followPlayer, renderFrame, syncCanvasResolution } from "./engine/renderer";
import { assignStandNumbers } from "./engine/stands";

/** Planned projects get a stand too, they just have no detail page to link to. */
const MUSEUM_CATALOG = [...projects, ...futureProjects];

/** Clamp long frames (tab was backgrounded) so the player cannot skip walls. */
const MAX_FRAME_SECONDS = 0.05;

/** Only the fields the caption needs, so React re-renders stay cheap. */
function toCaption(exhibit) {
	if (!exhibit) return null;
	const { id, stand, title, blurb, hasPage } = exhibit;
	return { id, stand, title, blurb, hasPage };
}

/**
 * Puts the player back where they left, or in front of the exhibit they opened.
 * Falls back to the museum entrance when nothing usable was saved.
 */
function resolveReturnSpawn(exhibits, walkable, world, focusExhibitId) {
	const recalled = recallMuseumPlayer();
	const projectId = focusExhibitId || recalled?.projectId;

	if (
		recalled &&
		isWalkable(walkable, world.width, world.height, recalled.x, recalled.y)
	) {
		return {
			x: recalled.x,
			y: recalled.y,
			facing: recalled.facing || "up",
		};
	}

	if (projectId) {
		const exhibit = exhibits.find((entry) => entry.id === projectId);
		const near = exhibit
			? findSpawnNear(exhibit, walkable, world.width, world.height)
			: null;
		if (near) {
			return { ...near, facing: recalled?.facing || "up" };
		}
	}

	return { ...findSpawn(walkable, world.width, world.height), facing: "up" };
}

/**
 * Owns the museum's asset loading, input handling, and animation loop, and
 * hands the component back only what it needs to render.
 */
export function useMuseumEngine() {
	const navigate = useNavigate();
	const location = useLocation();
	const focusExhibitId = location.state?.focusExhibit ?? null;

	const canvasRef = useRef(null);
	const stageRef = useRef(null);
	const worldRef = useRef(null);
	const heldDirections = useRef(new Set());
	const hitboxesRef = useRef(false);
	const nearbyRef = useRef(null);

	const [status, setStatus] = useState("loading");
	const [caption, setCaption] = useState(null);
	const [showHitboxes, setShowHitboxes] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let frameHandle = 0;
		let stop = () => {};

		function start(assets) {
			const { background, outline, characterSheets, exhibits: exhibitAssets } =
				assets;

			if (
				background.naturalWidth !== outline.naturalWidth ||
				background.naturalHeight !== outline.naturalHeight
			) {
				console.error(
					"museum.png and museum_outline.png differ in size; the outline will be stretched to match.",
				);
			}

			const world = {
				width: background.naturalWidth || MUSEUM_WORLD.width,
				height: background.naturalHeight || MUSEUM_WORLD.height,
			};
			const { walkable, markers, debugCanvas } = parseOutline(
				outline,
				world.width,
				world.height,
			);
			const collision = { ...world, walkable };
			const stands = assignStandNumbers(markers, world.width);
			const exhibits = buildExhibits(stands, MUSEUM_CATALOG, exhibitAssets);
			const player = createPlayer(
				resolveReturnSpawn(exhibits, walkable, world, focusExhibitId),
			);

			const scene = {
				world,
				background,
				characterSheets,
				debugCanvas,
				player,
				pictures: exhibits.filter((e) => e.kind === "picture" && e.image),
				pedestals: exhibits
					.filter((e) => e.kind === "pedestal" && e.image)
					.sort((a, b) => a.y - b.y),
				showHitboxes: false,
			};

			const canvas = canvasRef.current;
			const context = canvas.getContext("2d");
			syncCanvasResolution(canvas, context, worldRef.current, world);

			let nearbyId = null;
			let lastTimestamp = performance.now();

			const openNearbyProject = () => {
				const nearby = nearbyRef.current;
				if (!nearby?.hasPage) return false;
				rememberMuseumPlayer(nearby.id);
				navigate(`/projects/${nearby.id}`, { state: { from: "museum" } });
				return true;
			};

			const tick = (now) => {
				const deltaSeconds = Math.min(
					MAX_FRAME_SECONDS,
					(now - lastTimestamp) / 1000,
				);
				lastTimestamp = now;

				const vector = readMovementVector(heldDirections.current);
				movePlayer(player, vector, deltaSeconds, collision);

				const nearby = findNearbyExhibit(exhibits, player.x, player.y);
				nearbyRef.current = nearby;
				trackMuseumPlayer(player, nearby);
				if ((nearby?.id ?? null) !== nearbyId) {
					nearbyId = nearby?.id ?? null;
					setCaption(toCaption(nearby));
				}

				scene.showHitboxes = hitboxesRef.current;
				syncCanvasResolution(canvas, context, worldRef.current, world);
				renderFrame(context, scene, {
					now,
					moving: Boolean(vector),
					nearbyExhibit: nearby,
				});
				followPlayer(stageRef.current, worldRef.current, player, world);

				frameHandle = requestAnimationFrame(tick);
			};

			const onKeyDown = (event) => {
				const key = event.key.toLowerCase();
				if (key === "h") {
					hitboxesRef.current = !hitboxesRef.current;
					setShowHitboxes(hitboxesRef.current);
					return;
				}
				if (key === "enter") {
					if (openNearbyProject()) event.preventDefault();
					return;
				}
				const direction = MOVEMENT_KEYS[key];
				if (!direction) return;
				event.preventDefault();
				heldDirections.current.add(direction);
			};

			const onKeyUp = (event) => {
				const direction = MOVEMENT_KEYS[event.key.toLowerCase()];
				if (direction) heldDirections.current.delete(direction);
			};

			window.addEventListener("keydown", onKeyDown);
			window.addEventListener("keyup", onKeyUp);
			frameHandle = requestAnimationFrame(tick);

			return () => {
				cancelAnimationFrame(frameHandle);
				window.removeEventListener("keydown", onKeyDown);
				window.removeEventListener("keyup", onKeyUp);
			};
		}

		loadMuseumAssets().then((assets) => {
			if (cancelled) return;
			if (!assets.background || !assets.outline || !canvasRef.current) {
				setStatus("error");
				return;
			}
			stop = start(assets);
			setStatus("ready");
		});

		return () => {
			cancelled = true;
			cancelAnimationFrame(frameHandle);
			stop();
		};
	}, [focusExhibitId, navigate]);

	const pressDirection = useCallback((direction) => {
		heldDirections.current.add(direction);
	}, []);

	const releaseDirection = useCallback((direction) => {
		heldDirections.current.delete(direction);
	}, []);

	return {
		canvasRef,
		stageRef,
		worldRef,
		status,
		caption,
		showHitboxes,
		pressDirection,
		releaseDirection,
	};
}
