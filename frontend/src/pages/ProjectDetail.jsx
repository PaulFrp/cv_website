import { Link, Navigate, useParams } from "react-router-dom";
import PlantTrackerDetailContent from "../components/PlantTrackerDetailContent";
import ProjectDetailContent from "../components/ProjectDetailContent";
import { getProjectById } from "../data/projects";
import { getProjectDetail } from "../data/projectDetails";

function ProjectDetail() {
	const { projectId } = useParams();
	const project = getProjectById(projectId);
	const detail = getProjectDetail(projectId);

	if (!project) {
		return <Navigate to="/projects" replace />;
	}

	const pageTitle = detail?.displayTitle ?? project.title;

	return (
		<section className="page project-detail">
			<Link to="/projects" className="back-link">
				← Back to projects
			</Link>
			<h1>{pageTitle}</h1>
			{!detail && project.description && (
				<p className="project-detail-summary">{project.description}</p>
			)}
			<div className="project-detail-content">
				{detail?.type === "plant-tracker" ? (
					<PlantTrackerDetailContent detail={detail} />
				) : detail ? (
					<ProjectDetailContent detail={detail} />
				) : (
					<p className="project-detail-placeholder">
						More details coming soon.
					</p>
				)}
			</div>
		</section>
	);
}

export default ProjectDetail;
