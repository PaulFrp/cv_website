import { minigameDetail } from "./minigame";
import { nasDetail } from "./nas";
import { plantTrackerDetail } from "./plant-tracker";
import { xpTrackerDetail } from "./xp-tracker";

const projectDetails = {
	minigame: { ...minigameDetail, type: "standard" },
	nas: { ...nasDetail, type: "standard" },
	"xp-tracker": { ...xpTrackerDetail, type: "standard" },
	"plant-tracker": { ...plantTrackerDetail, type: "plant-tracker" },
};

export function getProjectDetail(id) {
	return projectDetails[id] ?? null;
}
