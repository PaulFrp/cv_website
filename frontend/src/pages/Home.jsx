//Change the picture to a Pixel art of me programming or building electronics
const featuredProjects = [
	{
		id: "xp-tracker",
		title: "XP tracker",
		description:[
			"Another small website in the beginning meant to track and reward habits building. ",
			"It was later incremented with a collaborative cooking Drive and an ESP32 plant-sensor dashboard.",
		]
	},
	{
		id: "plant-tracker",
		title: "Plant tracker",
		description:[ 
			"A comprehensive project that I started as a way to reconciliate all of the different skills I had been learning over the years ",
			"(Programming, electronics, soldering, 3D-printing). ",
		]
	},
	{
		id: "nas",
		title: "NAS / homelab",
		description:
			"Self-hosted TNAS homelab with Docker Compose: Jellyfin, *arr stack, qBittorrent behind Gluetun (Mullvad), Caddy, Vaultwarden, Uptime Kuma, and Tailscale remote access.",
	},
];

const futureProjects =[
	{
		id:"PCB",
		title:"PCB design learning",
		description:"In the aim of making circuits more replicable and smaller size I would like to be able to design my own PCBs."
	},
	{
		id:"backtesting",
		title:"Markets backtesting",
		descirption:"In order to learn more about Quant finance I would like to have comprehensive proejcts",
	},
	{
		id:"",
		title:"",
		description:""
	}
]

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
					worked on marketing analytics, generative AI, full-stack web
					projects, 3D printers and ESP32/arduino breadboards.
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

			<section className="home-featured">
				<h2 className="home-featured-title">Future projects</h2>
				<div className="featured-projects-grid">
					{futureProjects.map((project) => (
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
