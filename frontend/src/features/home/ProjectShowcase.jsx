import { ProjectCard } from "../projects";

/**
 * Titled row of project cards. Projects with a detail page link to it; planned
 * ones render as plain cards.
 */
function ProjectShowcase({ title, projects, linkToDetails = false }) {
	return (
		<section className="home-showcase">
			<h2 className="home-showcase-title">{title}</h2>
			<div className="home-showcase-grid">
				{projects.map((project) => (
					<ProjectCard
						key={project.id}
						project={project}
						to={linkToDetails ? `/projects/${project.id}` : undefined}
						linkState={linkToDetails ? { from: "home" } : undefined}
					/>
				))}
			</div>
		</section>
	);
}

export default ProjectShowcase;
