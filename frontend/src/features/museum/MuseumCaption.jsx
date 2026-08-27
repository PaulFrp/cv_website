import { Link } from "react-router-dom";
import { rememberMuseumPlayer } from "./engine/playerMemory";

/** The plaque under the museum that describes whichever stand the player is at. */
function MuseumCaption({ caption, showHitboxes }) {
	return (
		<div
			className={`pixel-museum-caption${caption ? " is-visible" : ""}`}
			role="status"
			aria-live="polite"
		>
			{caption ? (
				<>
					<strong className="pixel-museum-label-title">
						#{caption.stand} · {caption.title}
					</strong>
					<span className="pixel-museum-label-blurb">{caption.blurb}</span>
					{caption.hasPage ? (
						<Link
							to={`/projects/${caption.id}`}
							state={{ from: "museum" }}
							className="pixel-museum-label-link"
							onClick={() => rememberMuseumPlayer(caption.id)}
						>
							View details → <kbd>Enter</kbd>
						</Link>
					) : (
						<span className="pixel-museum-label-blurb">Planned project</span>
					)}
				</>
			) : (
				<span className="pixel-museum-caption-idle">
					Walk near a numbered stand to read about a project.
					{showHitboxes
						? " (hitbox overlay on — press H)"
						: " (press H for overlay)"}
				</span>
			)}
		</div>
	);
}

export default MuseumCaption;
