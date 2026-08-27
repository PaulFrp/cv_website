import { Link } from "react-router-dom";
import { getProjectDescription } from "../../shared/utils/projectText";

/**
 * Project summary tile. Renders as a link when `to` is given, and as a plain
 * card otherwise (used for planned projects that have no page yet).
 */
function ProjectCard({
	project,
	to,
	id,
	linkState,
	headingLevel: Heading = "h3",
	className = "",
}) {
	const classes = ["project-card", className].filter(Boolean).join(" ");

	const body = (
		<>
			<Heading className="project-card-title">{project.title}</Heading>
			{project.description && (
				<p className="project-card-description">
					{getProjectDescription(project.description)}
				</p>
			)}
		</>
	);

	if (!to) {
		return <article className={classes}>{body}</article>;
	}

	return (
		<Link
			to={to}
			id={id}
			state={linkState}
			className={`${classes} project-card-link`}
		>
			{body}
		</Link>
	);
}

export default ProjectCard;
