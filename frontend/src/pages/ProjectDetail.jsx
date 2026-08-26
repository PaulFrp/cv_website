import { Link, Navigate, useParams } from "react-router-dom";
import { DevPoseEditor } from "../dev";
import {
	getProjectById,
	getProjectDetail,
	PlantTrackerDetailContent,
	ProjectDetailContent,
} from "../features/projects";
import { getProjectDescription } from "../shared/utils/projectText";

const DETAIL_LAYOUTS = {
	standard: ProjectDetailContent,
	"plant-tracker": PlantTrackerDetailContent,
};

function ProjectDetail() {
	const { projectId } = useParams();
	const project = getProjectById(projectId);
	const detail = getProjectDetail(projectId);

	if (!project) {
		return <Navigate to="/projects" replace />;
	}

	const DetailLayout = detail ? DETAIL_LAYOUTS[detail.layout] : null;

	return (
		<section className="page project-detail">
			<Link to="/projects" className="back-link">
				← Back to projects
			</Link>
			<h1>{detail?.displayTitle ?? project.title}</h1>

			{!detail && project.description && (
				<p className="project-detail-summary">
					{getProjectDescription(project.description)}
				</p>
			)}

			<div className="project-detail-content">
				{DetailLayout ? (
					<DetailLayout detail={detail} />
				) : (
					<p className="project-detail-placeholder">
						More details coming soon.
					</p>
				)}
			</div>

			<DevPoseEditor pageId={projectId} />
		</section>
	);
}

export default ProjectDetail;
