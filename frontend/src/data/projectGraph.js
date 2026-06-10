export const CATEGORIES = {
	web: { color: "#7F77DD", textDark: "#26215C", label: "Web / fullstack" },
	data: { color: "#1D9E75", textDark: "#1A4D3A", label: "Data / ML" },
	hardware: { color: "#D85A30", textDark: "#5C2A14", label: "Electronics / hardware" },
	concept: { color: "#888780", textDark: "#3A3A36", label: "Concept nodes" },
};

export const LEGEND_ITEMS = ["web", "data", "hardware", "concept"];

export const graphNodes = [
	{
		id: "minigame",
		label: "Minigame website",
		category: "web",
		cardId: "minigame",
		description:
			"Trivia, hangman, and room games like Make It Meme — grew from a small idea into a full multiplayer platform.",
	},
	{
		id: "xp-tracker",
		label: "XP tracker",
		category: "web",
		cardId: "xp-tracker",
		description:
			"Manga-inspired stat tracker with badges, leaderboards, daily challenges, cooking recipes, and plant monitoring.",
	},
	{
		id: "web-scraping",
		label: "Web scraping",
		category: "web",
		cardId: "web-scraping",
		description:
			"Collection of scraping projects — defence sector company research and Pokémon forum analysis with word clouds.",
	},
	{
		id: "culture-website",
		label: "Culture website",
		category: "web",
		description: "A web project exploring cultural content and shared experiences.",
	},
	{
		id: "obsidian-clone",
		label: "Obsidian clone",
		category: "web",
		cardId: "obsidian-clone",
		description:
			"Python group project mimicking Obsidian — linked notes, subject detection, and relationship graphs.",
	},
	{
		id: "mood-music",
		label: "Mood music",
		category: "web",
		description: "A web app for discovering and organizing music by mood.",
	},
	{
		id: "ekimetrics",
		label: "Ekimetrics hackathon",
		category: "data",
		cardId: "ekimetrics",
		description:
			"Red team built a hallucinating data agent; blue team detected the injected anomalies.",
	},
	{
		id: "mmm",
		label: "MMM examples",
		category: "data",
		description: "Marketing mix modeling experiments and example implementations.",
	},
	{
		id: "kaggle",
		label: "Kaggle comp.",
		category: "data",
		cardId: "kaggle",
		description:
			"Class group project predicting the best consumers to target for marketing campaigns.",
	},
	{
		id: "noise-map",
		label: "Noise map ML",
		category: "data",
		cardId: "noise-map",
		description:
			"Models predicting urban noise levels in Paris, designed to generalize to cities like Lyon.",
	},
	{
		id: "nas",
		label: "NAS / homelab",
		category: "hardware",
		cardId: "nas",
		description:
			"Self-hosted stack — Docker, Tailscale, full *arr suite, Uptime Kuma, Vault, and Bitwarden.",
	},
	{
		id: "esp32",
		label: "ESP32 auto switch",
		category: "hardware",
		cardId: "esp32",
		description: "Automatic on/off controller built on ESP32 — with some soldering lessons along the way.",
	},
	{
		id: "plant-tracker",
		label: "Plant tracker",
		category: "hardware",
		cardId: "plant-tracker",
		description:
			"Humidity plant tracker monitoring conditions over time, integrated into XP tracker.",
	},
	{
		id: "websockets",
		label: "WebSockets",
		category: "concept",
		description: "Real-time bidirectional communication for multiplayer rooms and live updates.",
	},
	{
		id: "llm-agents",
		label: "LLM / AI agents",
		category: "concept",
		description: "Language-model agents — including deliberate hallucination and anomaly detection.",
	},
	{
		id: "docker-infra",
		label: "Docker / infra",
		category: "concept",
		description: "Containerized services, networking, and self-hosted infrastructure.",
	},
	{
		id: "nlp-text",
		label: "NLP / text",
		category: "concept",
		description: "Text extraction, subject identification, and stop-word filtering for analysis.",
	},
	{
		id: "data-viz",
		label: "Data viz",
		category: "concept",
		description: "Word clouds, relationship graphs, leaderboards, and visual data exploration.",
	},
	{
		id: "team-challenges",
		label: "Team challenges",
		category: "concept",
		description: "Hackathons, group coursework, and collaborative development experiences.",
	},
];

export const graphEdges = [
	{ source: "minigame", target: "websockets" },
	{ source: "xp-tracker", target: "plant-tracker" },
	{ source: "xp-tracker", target: "esp32" },
	{ source: "plant-tracker", target: "esp32" },
	{ source: "plant-tracker", target: "nas" },
	{ source: "esp32", target: "nas" },
	{ source: "nas", target: "docker-infra" },
	{ source: "ekimetrics", target: "llm-agents" },
	{ source: "ekimetrics", target: "nlp-text" },
	{ source: "mood-music", target: "llm-agents" },
	{ source: "mmm", target: "kaggle" },
	{ source: "mmm", target: "data-viz" },
	{ source: "kaggle", target: "team-challenges" },
	{ source: "noise-map", target: "team-challenges" },
	{ source: "noise-map", target: "data-viz" },
	{ source: "web-scraping", target: "nlp-text" },
	{ source: "web-scraping", target: "data-viz" },
	{ source: "obsidian-clone", target: "nlp-text" },
	{ source: "obsidian-clone", target: "data-viz" },
	{ source: "culture-website", target: "data-viz" },
];
