const featuredProjects = [
	{
		id: "xp-tracker",
		title: "XP tracker",
		description:
			"Manga-inspired stat tracker with badges, leaderboards, daily challenges, cooking recipes, and plant monitoring.",
	},
	{
		id: "plant-tracker",
		title: "Plant tracker",
		description:
			"Humidity plant tracker monitoring conditions over time, integrated into XP tracker.",
	},
	{
		id: "nas",
		title: "NAS / homelab",
		description:
			"Self-hosted stack — Docker, Tailscale, full *arr suite, Uptime Kuma, Vault, and Bitwarden.",
	},
];

function Home() {
	return (
		<section className="page home-page">
			<h2>Welcome to my personal CV website.</h2>
			<div className="home-intro">
				<img
					src="/pp.jfif"
					alt="Paul"
					className="home-profile-photo"
				/>
				<p className="home-bio">
					Data scientist and builder, currently studying at CentraleSupélec. I
					work on marketing analytics, generative AI tooling, and full-stack web
					projects and when away from the keyboard, on 3D printers and
					ESP32/arduino breadboards. I like building things that actually get
					used.
				</p>
			</div>

			<section className="home-featured">
				<h2 className="home-featured-title">Most important projects</h2>
				<div className="featured-projects-grid">
					{featuredProjects.map((project) => (
						<article key={project.id} className="project-card featured-project-card">
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
