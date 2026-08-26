import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_POSE_SET, getPoseSet } from "../shared/poseAssets";
import PoseEditorPanel from "./PoseEditorPanel";
import {
	buildExportPayload,
	createPlacementId,
	DEFAULT_POSE_HEIGHT,
	loadPlacements,
	savePlacements,
} from "./posePlacementStore";
import "./DevPoseEditor.css";

const URL_FLAG = "poseEdit";

/** Where a freshly added pose lands, relative to the page root. */
const NEW_POSE_ORIGIN = { x: 120, y: 180 };
const NEW_POSE_CASCADE = { x: 20, y: 12 };

function setUrlFlag(enabled) {
	const url = new URL(window.location.href);
	if (enabled) url.searchParams.set(URL_FLAG, "1");
	else url.searchParams.delete(URL_FLAG);
	window.history.replaceState({}, "", url);
}

function isTypingTarget(target) {
	return target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
}

/**
 * Local-only tool for positioning pixel-art poses on a page. It is lazy-loaded
 * behind `import.meta.env.DEV` at every call site, so it never ships.
 *
 * Open it with `?poseEdit=1` or Ctrl+Shift+P, drag poses into place, then copy
 * the JSON into a placements file for `PosePlacements` to render.
 */
function DevPoseEditor({
	pageId,
	rootSelector = ".project-detail",
	assetSet = DEFAULT_POSE_SET,
}) {
	const [enabled, setEnabled] = useState(
		() => new URLSearchParams(window.location.search).get(URL_FLAG) === "1",
	);
	const [placements, setPlacements] = useState(() => loadPlacements(pageId));
	const [selectedId, setSelectedId] = useState(null);
	const [panelHidden, setPanelHidden] = useState(false);
	const [loadedPageId, setLoadedPageId] = useState(pageId);
	const dragRef = useRef(null);

	// Navigating between project pages reuses this component, so swap in the
	// placements for the new page during render rather than after a paint.
	if (loadedPageId !== pageId) {
		setLoadedPageId(pageId);
		setPlacements(loadPlacements(pageId));
		setSelectedId(null);
	}

	const poseSet = useMemo(() => getPoseSet(assetSet), [assetSet]);
	const selected = placements.find((p) => p.id === selectedId) ?? null;

	const getRoot = useCallback(
		() => document.querySelector(rootSelector),
		[rootSelector],
	);

	/** Converts viewport coordinates into coordinates relative to the page root. */
	const toPagePoint = useCallback(
		(clientX, clientY) => {
			const rect = getRoot()?.getBoundingClientRect();
			if (!rect) {
				return {
					x: Math.round(clientX + window.scrollX),
					y: Math.round(clientY + window.scrollY),
				};
			}
			return {
				x: Math.round(clientX - rect.left),
				y: Math.round(clientY - rect.top),
			};
		},
		[getRoot],
	);

	const removeSelected = useCallback(() => {
		setPlacements((prev) => prev.filter((p) => p.id !== selectedId));
		setSelectedId(null);
	}, [selectedId]);

	const close = useCallback(() => {
		setUrlFlag(false);
		setEnabled(false);
		setPanelHidden(false);
	}, []);

	useEffect(() => {
		if (enabled) savePlacements(pageId, placements);
	}, [enabled, pageId, placements]);

	useEffect(() => {
		const root = getRoot();
		if (!root) return undefined;
		root.classList.toggle("is-pose-editing", enabled);
		return () => root.classList.remove("is-pose-editing");
	}, [enabled, getRoot]);

	useEffect(() => {
		const onKeyDown = (event) => {
			const key = event.key.toLowerCase();
			const typing = isTypingTarget(event.target);

			if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "p") {
				event.preventDefault();
				setUrlFlag(!enabled);
				setEnabled(!enabled);
				return;
			}
			if (!enabled) return;

			if (event.key === "Escape") {
				if (panelHidden) setPanelHidden(false);
				else close();
				return;
			}
			if (typing) return;

			if (key === "h") {
				event.preventDefault();
				setPanelHidden((prev) => !prev);
			} else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
				event.preventDefault();
				removeSelected();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [close, enabled, panelHidden, removeSelected, selectedId]);

	const addPose = (pose) => {
		const origin = toPagePoint(NEW_POSE_ORIGIN.x, NEW_POSE_ORIGIN.y);
		const placement = {
			id: createPlacementId(),
			pose,
			x: origin.x + placements.length * NEW_POSE_CASCADE.x,
			y: origin.y + placements.length * NEW_POSE_CASCADE.y,
			height: DEFAULT_POSE_HEIGHT,
		};
		setPlacements((prev) => [...prev, placement]);
		setSelectedId(placement.id);
	};

	const updateSelected = (patch) => {
		setPlacements((prev) =>
			prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)),
		);
	};

	const onPointerDown = (event, placement) => {
		event.preventDefault();
		event.stopPropagation();
		setSelectedId(placement.id);

		const point = toPagePoint(event.clientX, event.clientY);
		dragRef.current = {
			id: placement.id,
			offsetX: point.x - placement.x,
			offsetY: point.y - placement.y,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event) => {
		const drag = dragRef.current;
		if (!drag) return;

		const point = toPagePoint(event.clientX, event.clientY);
		setPlacements((prev) =>
			prev.map((p) =>
				p.id === drag.id
					? { ...p, x: point.x - drag.offsetX, y: point.y - drag.offsetY }
					: p,
			),
		);
	};

	const endDrag = () => {
		dragRef.current = null;
	};

	if (!enabled) {
		return (
			<button
				type="button"
				className="dev-pose-fab"
				title="Pose editor (Ctrl+Shift+P)"
				onClick={() => {
					setUrlFlag(true);
					setEnabled(true);
				}}
			>
				Pose
			</button>
		);
	}

	return (
		<>
			<div className="dev-pose-layer" aria-hidden>
				{placements.map((placement) => (
					<img
						key={placement.id}
						src={poseSet.src[placement.pose]}
						alt=""
						className={`dev-pose-item${selectedId === placement.id ? " is-selected" : ""}`}
						style={{
							left: placement.x,
							top: placement.y,
							height: placement.height,
						}}
						draggable={false}
						onPointerDown={(event) => onPointerDown(event, placement)}
						onPointerMove={onPointerMove}
						onPointerUp={endDrag}
						onPointerCancel={endDrag}
					/>
				))}
			</div>

			<PoseEditorPanel
				pageId={pageId}
				poseSet={poseSet}
				selected={selected}
				exportPayload={buildExportPayload(pageId, placements, getRoot())}
				hidden={panelHidden}
				onAdd={addPose}
				onUpdateSelected={updateSelected}
				onDeleteSelected={removeSelected}
				onClearPage={() => {
					setPlacements([]);
					setSelectedId(null);
				}}
				onHide={() => setPanelHidden(true)}
				onClose={close}
			/>

			{panelHidden && (
				<button
					type="button"
					className="dev-pose-fab dev-pose-fab--show-panel"
					title="Show pose panel (H)"
					onClick={() => setPanelHidden(false)}
				>
					Show panel
				</button>
			)}
		</>
	);
}

export default DevPoseEditor;
