import { lazy, Suspense, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import homePlacementData from "../features/home/homePlacements.json";
import {
	FEATURED_PROJECT_IDS,
	futureProjects,
	getProjectById,
} from "../features/projects";
import PosePlacements from "../shared/ui/PosePlacements";
import { getProjectDescription } from "../shared/utils/projectText";

const featuredProjects = FEATURED_PROJECT_IDS.map(getProjectById).filter(
	Boolean,
);

const DevPoseEditor = import.meta.env.DEV
	? lazy(() => import("../dev/DevPoseEditor"))
	: null;

function Home() {
	const videoRef = useRef(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		video.muted = true;
		video.defaultMuted = true;
		const attempt = video.play();
		if (attempt && typeof attempt.catch === "function") {
			attempt.catch(() => {});
		}
	}, []);

	return (
		<section className="page home-page">
			<PosePlacements
				data={homePlacementData}
				assetSet="main"
				rootSelector=".home-page"
			/>

			<div className="home-hero">
				<div className="home-hero-copy">
					<p className="home-brand">Paul Frappier</p>
					<p className="home-lede">
						Data scientist and builder at CentraleSupélec — analytics, generative
						AI, full-stack apps, and tinkering with printers and ESP32 boards.
					</p>
					<div className="home-ctas">
						<Link to="/museum" className="home-cta home-cta--primary">
							Enter the museum
						</Link>
						<Link to="/projects" className="home-cta">
							Projects
						</Link>
						<Link to="/cv" className="home-cta">
							CV
						</Link>
					</div>
				</div>

				<div className="home-stage">
					<video
						ref={videoRef}
						className="home-video"
						src={`${import.meta.env.BASE_URL}main.mp4`}
						autoPlay
						muted
						loop
						playsInline
						preload="auto"
						controls={false}
						aria-label="Pixel art character programming at a desk"
					/>
				</div>
			</div>

			<section className="home-featured">
				<h2 className="home-featured-title">Featured work</h2>
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
				<h2 className="home-featured-title">On the bench</h2>
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

			{DevPoseEditor && (
				<Suspense fallback={null}>
					<DevPoseEditor
						pageId="home"
						rootSelector=".home-page"
						assetSet="main"
					/>
				</Suspense>
			)}
		</section>
	);
}

export default Home;
