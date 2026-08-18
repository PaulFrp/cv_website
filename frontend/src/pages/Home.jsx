import { Link } from "react-router-dom";
import {
	FEATURED_PROJECT_IDS,
	futureProjects,
	getProjectById,
} from "../features/projects";
import { getProjectDescription } from "../shared/utils/projectText";

const featuredProjects = FEATURED_PROJECT_IDS.map(getProjectById).filter(
	Boolean,
);

function Home() {
	return (
		<section className="page home-page">
			<h2>Welcome to my personal CV website.</h2>
			<div className="home-intro">
				<img src="/pp.jfif" alt="Paul" className="home-profile-photo" />
				<p className="home-bio">
					Data scientist and builder, currently studying at CentraleSupélec. I
					worked on marketing analytics, generative AI, full-stack web
					projects, 3D printers and ESP32/arduino breadboards.
				</p>
			</div>

			<section className="home-featured">
				<h2 className="home-featured-title">Most important projects</h2>
				<div className="featured-projects-grid">
					{featuredProjects.map((project) => (
						<Link
							key={project.id}
							to={`/projects/${project.id}`}
							className="project-card featured-project-card project-card-link"
						>
							<h3 className="project-card-title">{project.title}</h3>
							<p className="project-card-description">
								{getProjectDescription(project.description)}
							</p>
						</Link>
					))}
				</div>
			</section>

			<section className="home-featured">
				<h2 className="home-featured-title">Future projects</h2>
				<div className="featured-projects-grid">
					{futureProjects.map((project) => (
						<article
							key={project.id}
							className="project-card featured-project-card"
						>
							<h3 className="project-card-title">{project.title}</h3>
							<p className="project-card-description">{project.description}</p>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}

export default Home;
