import { ProjectGraph } from "../features/graph";
import { ProjectCard, projects } from "../features/projects";

function Projects() {
	return (
		<section className="page">
			<h1>Projects</h1>
			<p>
				This is an interactive graph of my projects and their relationships.
				Double-click a node or click a card below to view more details.
			</p>

			<ProjectGraph />

			<div className="projects-grid">
				{projects.map((project) => (
					<ProjectCard
						key={project.id}
						id={`project-${project.id}`}
						project={project}
						to={`/projects/${project.id}`}
						headingLevel="h2"
					/>
				))}
			</div>
		</section>
	);
}

export default Projects;
