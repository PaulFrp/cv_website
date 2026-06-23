import { minigameDetail } from "./minigame";
import { plantTrackerDetail } from "./plant-tracker";

const projectDetails = {
	minigame: { ...minigameDetail, type: "standard" },
	"plant-tracker": { ...plantTrackerDetail, type: "plant-tracker" },
};

export function getProjectDetail(id) {
	return projectDetails[id] ?? null;
}
