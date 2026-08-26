import { minigameDetail } from "./minigame";
import { nasDetail } from "./nas";
import { plantTrackerDetail } from "./plant-tracker";
import { xpTrackerDetail } from "./xp-tracker";

/**
 * Long-form content for the projects that have a written write-up.
 * `layout` picks which component renders the detail page.
 */
const projectDetails = {
	minigame: { ...minigameDetail, layout: "standard" },
	nas: { ...nasDetail, layout: "standard" },
	"xp-tracker": { ...xpTrackerDetail, layout: "standard" },
	"plant-tracker": { ...plantTrackerDetail, layout: "plant-tracker" },
};

export function getProjectDetail(id) {
	return projectDetails[id] ?? null;
}
