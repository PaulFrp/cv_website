import { POSE_SRC } from "virtual:museum-pose-assets";

/**
 * Decorative pixel art that frames the museum. Each side has a column close to
 * the stage and a sparser one further out, to fake depth.
 */
const COLUMNS = {
	left: {
		near: ["pcb1", "plant", "code2"],
		far: ["server2", "code3"],
	},
	right: {
		near: ["code", "pcb2", "elec"],
		far: ["drone", "server"],
	},
};

function Figure({ pose }) {
	const src = POSE_SRC[pose];
	if (!src) return null;

	return <img src={src} alt="" className="museum-figure" draggable={false} />;
}

function FigureColumn({ poses, depth }) {
	return (
		<div className={`museum-figures-col museum-figures-col--${depth}`}>
			{poses.map((pose) => (
				<Figure key={pose} pose={pose} />
			))}
		</div>
	);
}

function MuseumFigures({ side }) {
	const { near, far } = COLUMNS[side];

	return (
		<div className={`museum-figures museum-figures--${side}`} aria-hidden>
			<FigureColumn poses={near} depth="near" />
			<FigureColumn poses={far} depth="far" />
		</div>
	);
}

export default MuseumFigures;
