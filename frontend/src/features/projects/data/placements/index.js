import esp32 from "./esp32.json";
import nas from "./nas.json";
import plantTracker from "./plant-tracker.json";

const placementsByProject = {
	esp32,
	nas,
	"plant-tracker": plantTracker,
};

/** Pose placements for a project detail page, or null when none are authored. */
export function getProjectPlacements(projectId) {
	return placementsByProject[projectId] ?? null;
}
