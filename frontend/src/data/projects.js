export const projects = [
	{
		id: "minigame",
		title: "Mini game Website",
		description:
			"A small project in the beginning turned into one of my biggest. Started with simple Trivia questions with cards we could click on. Then increased to other games like hangman, then to room games like make it meme, never have I ever etc. The main struggles were cookie/session management for the rooms. I went over multiple bad design choices such as hosting separately back end and front end forcing players to allow cross site cookie forwarding on their phone settings. Often lead to sync issues even after reuniting the back and front end.",
	},
	{
		id: "ekimetrics",
		title: "Ekimetrics Hackathon",
		description:
			"A hackathon organized by Ekimetrics where 2 teams were clashing. Red team goal was to create an Agent that will voluntarily hallucinate / make mistakes on data. Blue team goal was to detect those anomalies.",
	},
	{
		id: "xp-tracker",
		title: "Xp-tracker",
		description:
			"Another small project in the beginning. Inspired by a manga, I create this website to track different “statistics”. Strength, endurance, generosity, intelligence and many others. On which you could add points for a given statistics when you fulfill certain conditions. After reaching certain levels you would gain badges and be able to show them on your front page when others visit. There is also a leaderboard to see who is the most active and daily challenges to complete. This was then enhanced by the addition of a cooking tab when this website became an always on display in my apartment and drive to share cooking recipes. Recently, the plant tab was added in relation to another project (Humidity plant tracker) to see data and evolution over time.",
	},
	{
		id: "kaggle",
		title: "Kaggle competition",
		description:
			"This was a class group work. Training models to predict which consumers would be the best to focus the marketing on. This project showed me a lot about working with new developers.",
	},
	{
		id: "obsidian-clone",
		title: "Python Obsidian like project",
		description:
			"Group project for our python class. We create a small app imitating Obsidian with notes, smart identification of subject and graphs to display the links of everything together.",
	},
	{
		id: "noise-map",
		title: "ML Noise map predictor",
		description:
			"Training models to predict noise first in Paris with the goal to then apply to other similar cities like Lyon. It focused on a list of attributes and geolocation data.",
	},
	{
		id: "web-scraping",
		title: "Webscrapping",
		description: "Many small projects.",
	},
	{
		id: "maia",
		title: "Projet Maia",
		description:
			"Helped a friend on a work mission asking to find all the companies attending a talk in the sector of defence. Then tried to retrieve as many available public information about the company (Founders, CA, find others in the discussion with Mayo).",
	},
	{
		id: "pokemon",
		title: "Projet Pokémon Artefact",
		description:
			"Extracting comments and discussions on forums to establish what the fans are interested in mostly, created visualizations such as word clouds to see the most preeminent ones. Had to find a way to exclude repeating words like “the” “me” etc. If remember correctly I used a library of the common words Electronics.",
	},
	{
		id: "nas",
		title: "TNAS set up",
		description:
			"Docker / Tailscale / full arr stack / Uptime Kuma / Vault / Bitwarden.",
	},
	{
		id: "esp32",
		title: "ESP32 automatic turn on and off",
		description: "Soldering struggles.",
	},
	{
		id: "plant-tracker",
		title: "Humidity plant tracker",
		description: "",
	},
];

export function getProjectById(id) {
	return projects.find((project) => project.id === id);
}
