import { useState } from "react";

const MIN_HEIGHT = 48;
const MAX_HEIGHT = 220;
const COPIED_FEEDBACK_MS = 1500;

function PosePalette({ poseSet, onAdd }) {
	return (
		<div className="dev-pose-palette">
			{poseSet.keys.map((pose) => (
				<button
					key={pose}
					type="button"
					className="dev-pose-palette__btn"
					onClick={() => onAdd(pose)}
					title={`Add ${pose}`}
				>
					<img src={poseSet.src[pose]} alt="" />
					<span>{pose}</span>
				</button>
			))}
		</div>
	);
}

function SelectedPoseControls({ placement, onChange, onDelete }) {
	return (
		<div className="dev-pose-selected">
			<label>
				Height
				<input
					type="range"
					min={MIN_HEIGHT}
					max={MAX_HEIGHT}
					value={placement.height}
					onChange={(event) => onChange({ height: Number(event.target.value) })}
				/>
				<span>{placement.height}px</span>
			</label>
			<label>
				X
				<input
					type="number"
					value={placement.x}
					onChange={(event) => onChange({ x: Number(event.target.value) })}
				/>
			</label>
			<label>
				Y
				<input
					type="number"
					value={placement.y}
					onChange={(event) => onChange({ y: Number(event.target.value) })}
				/>
			</label>
			<button type="button" onClick={onDelete}>
				Delete selected
			</button>
		</div>
	);
}

/** Side panel of the pose editor: palette, selection controls, and JSON export. */
function PoseEditorPanel({
	pageId,
	poseSet,
	selected,
	exportPayload,
	hidden,
	onAdd,
	onUpdateSelected,
	onDeleteSelected,
	onClearPage,
	onHide,
	onClose,
}) {
	const [copied, setCopied] = useState(false);

	const copyExport = async () => {
		await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
		setCopied(true);
		window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
	};

	return (
		<aside className={`dev-pose-panel-ui${hidden ? " is-hidden" : ""}`}>
			<header className="dev-pose-panel-ui__header">
				<strong>Pose editor</strong>
				<span className="dev-pose-panel-ui__hint">{pageId}</span>
				<button type="button" title="Hide panel (H)" onClick={onHide}>
					Hide
				</button>
				<button type="button" onClick={onClose}>
					Close
				</button>
			</header>

			<p className="dev-pose-panel-ui__help">
				Click a pose to add it, then drag. The height slider scales it and Del
				removes it. Press <kbd>H</kbd> to hide this panel while placing.
				Positions are saved in localStorage for this page.
			</p>

			<PosePalette poseSet={poseSet} onAdd={onAdd} />

			{selected && (
				<SelectedPoseControls
					placement={selected}
					onChange={onUpdateSelected}
					onDelete={onDeleteSelected}
				/>
			)}

			<div className="dev-pose-actions">
				<button type="button" onClick={copyExport}>
					{copied ? "Copied!" : "Copy JSON"}
				</button>
				<button type="button" onClick={onClearPage}>
					Clear page
				</button>
			</div>

			<pre className="dev-pose-export">
				{JSON.stringify(exportPayload, null, 2)}
			</pre>
		</aside>
	);
}

export default PoseEditorPanel;
