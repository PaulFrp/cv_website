import MuseumCaption from "./MuseumCaption";
import MuseumFigures from "./MuseumFigures";
import MuseumTouchPad from "./MuseumTouchPad";
import { useMuseumEngine } from "./useMuseumEngine";
import "./museum.css";

const STATUS_MESSAGES = {
	loading: "Loading museum…",
	error: "The museum artwork could not be loaded.",
};

function PixelMuseum() {
	const {
		canvasRef,
		stageRef,
		worldRef,
		status,
		caption,
		showHitboxes,
		pressDirection,
		releaseDirection,
	} = useMuseumEngine();

	return (
		<div className="pixel-museum">
			<div className="pixel-museum-board">
				<MuseumFigures side="left" />

				<div className="pixel-museum-stage" ref={stageRef}>
					<div className="pixel-museum-world" ref={worldRef}>
						<canvas
							ref={canvasRef}
							className="pixel-museum-canvas"
							aria-label="Pixel art museum. Use WASD or the arrow keys to walk."
						/>
					</div>
					{status !== "ready" && (
						<p className="pixel-museum-loading">{STATUS_MESSAGES[status]}</p>
					)}
				</div>

				<MuseumFigures side="right" />
				<MuseumCaption caption={caption} showHitboxes={showHitboxes} />
			</div>

			<MuseumTouchPad onPress={pressDirection} onRelease={releaseDirection} />
		</div>
	);
}

export default PixelMuseum;
