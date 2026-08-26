import homePlacements from "../features/home/homePlacements.json";
import HomeHero from "../features/home/HomeHero";
import ProjectShowcase from "../features/home/ProjectShowcase";
import {
	FEATURED_PROJECT_IDS,
	futureProjects,
	getProjectById,
} from "../features/projects";
import PosePlacements from "../shared/ui/PosePlacements";
import { DevPoseEditor } from "../dev";
import "../features/home/home.css";

const featuredProjects = FEATURED_PROJECT_IDS.map(getProjectById).filter(Boolean);

function Home() {
	return (
		<section className="page home-page">
			<PosePlacements
				data={homePlacements}
				assetSet="main"
				rootSelector=".home-page"
			/>

			<HomeHero />

			<ProjectShowcase
				title="Featured work"
				projects={featuredProjects}
				linkToDetails
			/>
			<ProjectShowcase title="On the bench" projects={futureProjects} />

			<DevPoseEditor pageId="home" rootSelector=".home-page" assetSet="main" />
		</section>
	);
}

export default Home;
