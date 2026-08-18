import { POSE_SRC } from "virtual:museum-pose-assets";

const LAYOUT = {
	left: {
		near: ["pcb1", "plant", "code2"],
		far: ["server2", "code3"],
	},
	right: {
		near: ["code", "pcb2", "elec"],
		far: ["drone", "server"],
	},
};

function MuseumFigure({ pose }) {
	const src = POSE_SRC[pose];
	if (!src) return null;

	return (
		<img src={src} alt="" className="museum-figure" draggable={false} />
	);
}

function MuseumFigures({ side }) {
	const { near, far } = LAYOUT[side];

	return (
		<div className={`museum-figures museum-figures--${side}`} aria-hidden>
			<div className="museum-figures-col museum-figures-col--3">
				{near.map((pose) => (
					<MuseumFigure key={pose} pose={pose} />
				))}
			</div>
			<div className="museum-figures-col museum-figures-col--2">
				{far.map((pose) => (
					<MuseumFigure key={pose} pose={pose} />
				))}
			</div>
		</div>
	);
}

export default MuseumFigures;
