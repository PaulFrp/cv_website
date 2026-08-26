import { useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_POSE_SET, getPoseSet } from "../poseAssets";
import "./PosePlacements.css";

/** Below this page width the poses crowd the content, so they are hidden. */
const DEFAULT_MIN_WIDTH = 900;

/**
 * Draws the pixel-art poses saved by the dev pose editor (see src/dev).
 *
 * Placements are recorded against the page width they were authored at
 * (`layout.width`), so everything is scaled by how much the page has grown or
 * shrunk since. Below `layout.minWidth` the layer is dropped entirely.
 */
function PosePlacements({
	data,
	assetSet = DEFAULT_POSE_SET,
	rootSelector,
	className = "",
}) {
	const layerRef = useRef(null);
	const [scale, setScale] = useState(1);
	const [visible, setVisible] = useState(true);

	const { src: poseSrc } = getPoseSet(assetSet);
	const placements = data?.placements ?? [];
	const designWidth = data?.layout?.width;
	const minWidth = data?.layout?.minWidth ?? DEFAULT_MIN_WIDTH;

	useLayoutEffect(() => {
		const measure = () => {
			const root = rootSelector
				? document.querySelector(rootSelector)
				: layerRef.current?.closest(".page");
			const width = root?.clientWidth || designWidth || window.innerWidth;

			setVisible(width >= minWidth);
			setScale(designWidth ? width / designWidth : 1);
		};

		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [designWidth, minWidth, rootSelector]);

	if (!placements.length || !visible) return null;

	return (
		<div
			ref={layerRef}
			className={`pose-placements${className ? ` ${className}` : ""}`}
			aria-hidden
		>
			{placements.map((placement) => {
				const src = poseSrc[placement.pose];
				if (!src) return null;

				return (
					<img
						key={placement.id}
						src={src}
						alt=""
						className="pose-placements__item"
						style={{
							left: Math.round(placement.x * scale),
							top: Math.round(placement.y * scale),
							height: Math.round(placement.height * scale),
						}}
						draggable={false}
					/>
				);
			})}
		</div>
	);
}

export default PosePlacements;
