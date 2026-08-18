import { useEffect, useMemo, useRef, useState } from "react";
import { POSE_KEYS, POSE_SRC } from "../shared/ui/CharacterPose";
import "./DevPoseEditor.css";

const STORAGE_PREFIX = "cv-pose-editor:";

function loadPlacements(pageId) {
	try {
		const raw = localStorage.getItem(`${STORAGE_PREFIX}${pageId}`);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function savePlacements(pageId, placements) {
	localStorage.setItem(`${STORAGE_PREFIX}${pageId}`, JSON.stringify(placements));
}

function createId() {
	return `pose-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getPageRoot() {
	return document.querySelector(".project-detail");
}

function clientToPage(clientX, clientY) {
	const root = getPageRoot();
	if (!root) {
		return {
			x: Math.round(clientX + window.scrollX),
			y: Math.round(clientY + window.scrollY),
		};
	}
	const rect = root.getBoundingClientRect();
	return {
		x: Math.round(clientX - rect.left),
		y: Math.round(clientY - rect.top),
	};
}

/**
 * Local-only pose placer. Gated by import.meta.env.DEV at the call site.
 * Open with ?poseEdit=1 or Ctrl+Shift+P on a project detail page.
 */
function DevPoseEditor({ pageId }) {
	const [enabled, setEnabled] = useState(() => {
		const params = new URLSearchParams(window.location.search);
		return params.get("poseEdit") === "1";
	});
	const [placements, setPlacements] = useState(() => loadPlacements(pageId));
	const [selectedId, setSelectedId] = useState(null);
	const [copied, setCopied] = useState(false);
	const [panelHidden, setPanelHidden] = useState(false);
	const dragRef = useRef(null);

	useEffect(() => {
		setPlacements(loadPlacements(pageId));
		setSelectedId(null);
	}, [pageId]);

	useEffect(() => {
		if (!enabled) return;
		savePlacements(pageId, placements);
	}, [enabled, pageId, placements]);

	useEffect(() => {
		const root = getPageRoot();
		if (!root) return undefined;
		root.classList.toggle("is-pose-editing", enabled);
		return () => root.classList.remove("is-pose-editing");
	}, [enabled]);

	useEffect(() => {
		const setFlag = (next) => {
			const url = new URL(window.location.href);
			if (next) url.searchParams.set("poseEdit", "1");
			else url.searchParams.delete("poseEdit");
			window.history.replaceState({}, "", url);
			setEnabled(next);
		};

		const onKey = (event) => {
			const tag = event.target?.tagName;
			const typing = tag === "INPUT" || tag === "TEXTAREA";

			if (event.key === "Escape" && enabled) {
				if (panelHidden) {
					setPanelHidden(false);
					return;
				}
				setFlag(false);
				return;
			}
			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				event.key.toLowerCase() === "p"
			) {
				event.preventDefault();
				setFlag(!enabled);
				return;
			}
			if (!enabled) return;
			if (!typing && event.key.toLowerCase() === "h") {
				event.preventDefault();
				setPanelHidden((prev) => !prev);
				return;
			}
			if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
				if (typing) return;
				event.preventDefault();
				setPlacements((prev) => prev.filter((p) => p.id !== selectedId));
				setSelectedId(null);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [enabled, panelHidden, selectedId]);

	const selected = useMemo(
		() => placements.find((p) => p.id === selectedId) ?? null,
		[placements, selectedId],
	);

	const addPose = (pose) => {
		const anchor = clientToPage(120, 180);
		const next = {
			id: createId(),
			pose,
			x: anchor.x + placements.length * 20,
			y: anchor.y + placements.length * 12,
			height: 96,
		};
		setPlacements((prev) => [...prev, next]);
		setSelectedId(next.id);
	};

	const updateSelected = (patch) => {
		if (!selectedId) return;
		setPlacements((prev) =>
			prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)),
		);
	};

	const onPointerDown = (event, placement) => {
		event.preventDefault();
		event.stopPropagation();
		setSelectedId(placement.id);
		const point = clientToPage(event.clientX, event.clientY);
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
		const point = clientToPage(event.clientX, event.clientY);
		const x = Math.round(point.x - drag.offsetX);
		const y = Math.round(point.y - drag.offsetY);
		setPlacements((prev) =>
			prev.map((p) => (p.id === drag.id ? { ...p, x, y } : p)),
		);
	};

	const onPointerUp = () => {
		dragRef.current = null;
	};

	const exportPayload = {
		pageId,
		placements: placements.map(({ id, pose, x, y, height }) => ({
			id,
			pose,
			x,
			y,
			height,
		})),
	};

	const copyExport = async () => {
		await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	if (!enabled) {
		return (
			<button
				type="button"
				className="dev-pose-fab"
				title="Pose editor (Ctrl+Shift+P)"
				onClick={() => {
					const url = new URL(window.location.href);
					url.searchParams.set("poseEdit", "1");
					window.history.replaceState({}, "", url);
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
						src={POSE_SRC[placement.pose]}
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
						onPointerUp={onPointerUp}
						onPointerCancel={onPointerUp}
					/>
				))}
			</div>

			<aside className={`dev-pose-panel-ui${panelHidden ? " is-hidden" : ""}`}>
				<header className="dev-pose-panel-ui__header">
					<strong>Pose editor</strong>
					<span className="dev-pose-panel-ui__hint">{pageId}</span>
					<button
						type="button"
						title="Hide panel (H)"
						onClick={() => setPanelHidden(true)}
					>
						Hide
					</button>
					<button
						type="button"
						onClick={() => {
							const url = new URL(window.location.href);
							url.searchParams.delete("poseEdit");
							window.history.replaceState({}, "", url);
							setEnabled(false);
							setPanelHidden(false);
						}}
					>
						Close
					</button>
				</header>

				<p className="dev-pose-panel-ui__help">
					Click a pose to add it, then drag. Height slider scales it. Del
					removes. Press <kbd>H</kbd> to hide this panel while placing.
					Positions save in localStorage for this project.
				</p>

				<div className="dev-pose-palette">
					{POSE_KEYS.map((pose) => (
						<button
							key={pose}
							type="button"
							className="dev-pose-palette__btn"
							onClick={() => addPose(pose)}
							title={`Add ${pose}`}
						>
							<img src={POSE_SRC[pose]} alt="" />
							<span>{pose}</span>
						</button>
					))}
				</div>

				{selected && (
					<div className="dev-pose-selected">
						<label>
							Height
							<input
								type="range"
								min="48"
								max="220"
								value={selected.height}
								onChange={(event) =>
									updateSelected({ height: Number(event.target.value) })
								}
							/>
							<span>{selected.height}px</span>
						</label>
						<label>
							X
							<input
								type="number"
								value={selected.x}
								onChange={(event) =>
									updateSelected({ x: Number(event.target.value) })
								}
							/>
						</label>
						<label>
							Y
							<input
								type="number"
								value={selected.y}
								onChange={(event) =>
									updateSelected({ y: Number(event.target.value) })
								}
							/>
						</label>
						<button
							type="button"
							onClick={() => {
								setPlacements((prev) =>
									prev.filter((p) => p.id !== selected.id),
								);
								setSelectedId(null);
							}}
						>
							Delete selected
						</button>
					</div>
				)}

				<div className="dev-pose-actions">
					<button type="button" onClick={copyExport}>
						{copied ? "Copied!" : "Copy JSON"}
					</button>
					<button
						type="button"
						onClick={() => {
							setPlacements([]);
							setSelectedId(null);
						}}
					>
						Clear page
					</button>
				</div>

				<pre className="dev-pose-export">
					{JSON.stringify(exportPayload.placements, null, 2)}
				</pre>
			</aside>

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
