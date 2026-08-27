import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { DevPoseEditor } from "../dev";
import {
	getProjectById,
	getProjectDetail,
	getProjectPlacements,
	PlantTrackerDetailContent,
	ProjectDetailContent,
} from "../features/projects";
import { getProjectBackLink } from "../features/projects/projectOrigin";
import PosePlacements from "../shared/ui/PosePlacements";
import { getProjectDescription } from "../shared/utils/projectText";

const DETAIL_LAYOUTS = {
	standard: ProjectDetailContent,
	"plant-tracker": PlantTrackerDetailContent,
};

function ProjectDetail() {
	const { projectId } = useParams();
	const location = useLocation();
	const project = getProjectById(projectId);
	const detail = getProjectDetail(projectId);
	const placements = getProjectPlacements(projectId);
	const back = getProjectBackLink(location);

	if (!project) {
		return <Navigate to="/projects" replace />;
	}

	const DetailLayout = detail ? DETAIL_LAYOUTS[detail.layout] : null;

	return (
		<section className="page project-detail">
			{placements && (
				<PosePlacements
					data={placements}
					assetSet="project"
					rootSelector=".project-detail"
				/>
			)}

			<Link
				to={back.to}
				state={
					location.state?.from === "museum"
						? { focusExhibit: projectId }
						: undefined
				}
				className="back-link"
			>
				← {back.label}
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
