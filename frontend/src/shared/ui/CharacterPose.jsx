import { POSE_SRC } from "virtual:pose-assets";

export { POSE_ASSETS, POSE_KEYS, POSE_SRC } from "virtual:pose-assets";

/**
 * Decorative pixel-art character pose for project pages.
 * Pose keys come from public/positions file names:
 * pos_out_top.png → "out-top"
 */
function CharacterPose({ pose, className = "", alt = "", style, ...rest }) {
	const src = POSE_SRC[pose];
	if (!src) return null;

	return (
		<img
			src={src}
			alt={alt}
			className={`character-pose character-pose--${pose}${className ? ` ${className}` : ""}`}
			style={style}
			draggable={false}
			aria-hidden={alt ? undefined : true}
			{...rest}
		/>
	);
}

export default CharacterPose;
