import {
	POSE_KEYS as PROJECT_KEYS,
	POSE_SRC as PROJECT_SRC,
} from "virtual:pose-assets";
import {
	POSE_KEYS as MUSEUM_KEYS,
	POSE_SRC as MUSEUM_SRC,
} from "virtual:museum-pose-assets";
import {
	POSE_KEYS as MAIN_KEYS,
	POSE_SRC as MAIN_SRC,
} from "virtual:main-pose-assets";

/**
 * Pixel-art pose sets, generated from the PNG folders under `public/` by the
 * pose-assets Vite plugin. Pose names come from the file names, so dropping a
 * new `pos_*.png` into a folder is all it takes to make it available.
 */
const POSE_SETS = {
	project: { keys: PROJECT_KEYS, src: PROJECT_SRC },
	museum: { keys: MUSEUM_KEYS, src: MUSEUM_SRC },
	main: { keys: MAIN_KEYS, src: MAIN_SRC },
};

export const DEFAULT_POSE_SET = "project";

export function getPoseSet(name) {
	return POSE_SETS[name] ?? POSE_SETS[DEFAULT_POSE_SET];
}
