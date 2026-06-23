import { Link } from "react-router-dom";
import ProjectGraph from "../components/ProjectGraph";
import { projects } from "../data/projects";

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
					<Link
						key={project.id}
						id={`project-${project.id}`}
						to={`/projects/${project.id}`}
						className="project-card project-card-link"
					>
						<h2 className="project-card-title">{project.title}</h2>
						{project.description && (
							<p className="project-card-description">{project.description}</p>
						)}
					</Link>
				))}
			</div>
		</section>
	);
}

export default Projects;
