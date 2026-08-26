import { POSE_SRC as PROJECT_POSE_SRC } from "virtual:pose-assets";
import { POSE_SRC as MUSEUM_POSE_SRC } from "virtual:museum-pose-assets";
import { POSE_SRC as MAIN_POSE_SRC } from "virtual:main-pose-assets";
import { useLayoutEffect, useRef, useState } from "react";

const POSE_SRC_BY_SET = {
	project: PROJECT_POSE_SRC,
	museum: MUSEUM_POSE_SRC,
	main: MAIN_POSE_SRC,
};

/** Hide poses when the page root is narrower than this (px). */
const DEFAULT_MIN_WIDTH = 900;

/**
 * Renders saved pose placements from the DevPoseEditor JSON.
 * If data.layout.width is set, x/y/height scale with the page root width.
 * Hidden when the page is narrower than layout.minWidth (default 900).
 */
function PosePlacements({
	data,
	assetSet = "project",
	rootSelector,
	className = "",
}) {
	const layerRef = useRef(null);
	const [scale, setScale] = useState(1);
	const [visible, setVisible] = useState(true);
	const poseSrc = POSE_SRC_BY_SET[assetSet] || PROJECT_POSE_SRC;
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
