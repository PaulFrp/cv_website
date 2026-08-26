const STORAGE_PREFIX = "cv-pose-editor:";

/** Height a newly added pose starts at, in page pixels. */
export const DEFAULT_POSE_HEIGHT = 96;

export function loadPlacements(pageId) {
	try {
		const saved = localStorage.getItem(`${STORAGE_PREFIX}${pageId}`);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

export function savePlacements(pageId, placements) {
	localStorage.setItem(`${STORAGE_PREFIX}${pageId}`, JSON.stringify(placements));
}

export function createPlacementId() {
	return `pose-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Snapshot in the shape `PosePlacements` expects. `layout` records the page
 * size the poses were positioned against so they can be scaled later.
 */
export function buildExportPayload(pageId, placements, root) {
	return {
		pageId,
		layout: {
			width: Math.round(root?.clientWidth ?? 0),
			height: Math.round(root?.scrollHeight ?? 0),
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			devicePixelRatio: window.devicePixelRatio || 1,
		},
		placements: placements.map(({ id, pose, x, y, height }) => ({
			id,
			pose,
			x,
			y,
			height,
		})),
	};
}
