export const FEATURED_PROJECT_IDS = ["xp-tracker", "plant-tracker", "nas"];

export const projects = [
	{
		id: "nas",
		title: "TNAS set up",
		description:
			"Self-hosted TNAS homelab with Docker Compose: Jellyfin, *arr stack, qBittorrent behind Gluetun (Mullvad), Caddy, Vaultwarden, Uptime Kuma, and Tailscale remote access.",
	},
	{
		id: "plant-tracker",
		title: "Plant health tracker",
		description: [
			"A comprehensive project that I started as a way to reconciliate all of the different skills I had been learning over the years ",
			"(Programming, electronics, soldering, 3D-printing). ",
		],
	},
	{
		id: "esp32",
		title: "ESP32 automatic Dashboard",
		description:
			"Turned an old touch screen into an autonomous dashboard to display my habit and cooking website.",
	},
	{
		id: "minigame",
		title: "Mini game Website",
		description: [
			"A small project in the beginning turned into one of my most complex. ",
			"Started with simple static mini games. ",
			"Then I decided to increase the scope to more complex simultaneous real time games across multiple devices. ",
		],
	},
	{
		id: "xp-tracker",
		title: "Xp-tracker",
		description: [
			"Another small website in the beginning meant to track and reward habits building. ",
			"It was later incremented with a collaborative cooking Drive and an ESP32 plant-sensor dashboard.",
		],
	},
	{
		id: "ekimetrics",
		title: "Ekimetrics Hackathon",
		description: [
			"A hackathon organized by Ekimetrics where 2 teams were clashing. ",
			"Red team goal was to create an Agent that will voluntarily hallucinate / make mistakes on financial data. ",
			"Blue team goal was to detect those anomalies.",
		],
	},
	{
		id: "kaggle",
		title: "Kaggle competition",
		description: [
			"A Kaggle competition where we had to train models to predict which consumers a company should focus marketing on. ",
			"This project taught me a lot about working with new developers.",
		],
	},
	{
		id: "obsidian-clone",
		title: "Python Obsidian like project",
		description: [
			"Group project for our python class. ",
			"We create a small app imitating Obsidian, smart identification of subject and graphs to display the links of everything together.",
		],
	},
	{
		id: "noise-map",
		title: "ML Noise map predictor",
		description: [
			"Training models to predict noise first in Paris with the goal to then apply to other similar cities like Lyon. ",
			"It focused on a list of attributes and geolocation data.",
		],
	},

	{
		id: "webscrapping",
		title: "Webscrapping",
		description: [
			"A combination of many webscrapping projects that are too small to have a dedicated project page each. ",
		],
	},
];

/** Planned / in-progress ideas shown on the home page. */
export const futureProjects = [
	{
		id: "pcb",
		title: "PCB design learning",
		description:
			"In the aim of making circuits more replicable and smaller size I would like to be able to design my own PCBs.",
	},
	{
		id: "backtesting",
		title: "Markets backtesting",
		description:
			"In order to learn more about Quant finance I would like to have comprehensive projects.",
	},
	{
		id: "ci-cd",
		title: "CI/CD",
		description:
			"Properly learning and setting up CI/CD in current and new projects.",
	},
];

export function getProjectById(id) {
	return projects.find((project) => project.id === id);
}
