// Styles for every project surface (cards, detail pages) load with the feature.
import "./projects.css";

export { default as ProjectCard } from "./ProjectCard";
export { default as ProjectDetailContent } from "./ProjectDetailContent";
export { default as PlantTrackerDetailContent } from "./PlantTrackerDetailContent";
export {
	FEATURED_PROJECT_IDS,
	futureProjects,
	getProjectById,
	projects,
} from "./data/projects";
export { getProjectDetail } from "./data/details";
export { getProjectPlacements } from "./data/placements";
