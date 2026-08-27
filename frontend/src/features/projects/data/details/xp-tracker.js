export const xpTrackerDetail = {
	displayTitle: "XP Tracker",
	pitch:[
		"A full-stack website made to imrpove and keep track of personal productivity. To make it more fun it is gamified with: 16 skills, daily challenges, badges and titles. Although not in the scope in the beginning I decided to add a collaborative recipe manager and a dashboard for my plant-sensors. This rescope decision was made when I turned an old touch screen into a dashboard that would automatically turn on in the morning and display this site.",
	],
	overview:[
		"XP Tracker crossed my mind after watching a manga which had pretty much the same basis. Users level up across 16 skills in four categories: Physical, Mental, Lifestyle, and Meta attributes like Discipline, Planning, Reflection, and Good deeds. The user then records workouts or everything done during the day and earns XP. When progressing, you then unlock badges and skill titles every 10 levels.",
		"Inspired by strava I wanted to add a more social experience. I decided to make public profiles that your friends could see and where you can display your badges and titles. In the same idea I added a public page leaderboard that ranks every participants by average skill level. ",
		"Beyond the first idea of gamification, the app now expands into two other products. First implemented is cooking / recipe page that acts like a Google drive. The second one to be implemented is a plant humidity & environment dashboard that ingests live ESP32 sensor data (See Plant tracker project) through an API-key POST to the /api/sensor endpoint, it stores time-series readings in PostgreSQL, ",
	],
		techStack: [
		{
			layer: "Backend",
			technologies:
				"Python, Flask 3 (application factory + 11 blueprints), Gunicorn, WSGI",
		},
		{
			layer: "Frontend",
			technologies:
				"Jinja2, custom CSS, vanilla JS, Tailwind (auth pages), Chart.js",
		},
		{
			layer: "Database",
			technologies:
				"PostgreSQL, psycopg2, raw SQL, idempotent schema bootstrap",
		},
		{
			layer: "Auth / sessions",
			technologies: "Session-based auth, API keys for IoT ingestion",
		},
		{
			layer: "Gamification",
			technologies:
				"16 skills, triangular XP curve, streaks, ~70 daily challenges (deprecated now), 80 badges, 80 titles, leaderboard",
		},
		{
			layer: "Domains",
			technologies:
				"Cooking Drive (ACL shares), ESP32 plant sensors (POST /api/sensor)",
		},
		{
			layer: "Deployment",
			technologies: "Heroku Procfile, environment-aware DB provisioning",
		},
	],
	challenges: [
		{
			title: "RPG-feel progression without feeling like a checklist",
			problem:[
				"A flat “add points” model reads as a to-do list. Users needed a curve, streaks, ",
				"and unlocks that make daily actions feel like leveling a character.",
			],
				solution: [
				"Triangular XP curve: 80 + 12 × L × (L+1) / 2 with multi-level-up handling",
				"Per-skill streak tracking and daily XP aggregates",
				"Content-driven unlocks: badges and skill titles every 10 levels",
				"Public profiles and a leaderboard ranked by average skill level",
			],
		},
		{
			title: "Collaborative cooking Drive with real ACLs",
			problem:
				"Recipe sharing needed a Google drive feeling as wel as ownership not a single public dump but a recipe with an owner and split view / edit permissions, filters, and safe share updates when collaborators change.",
			solution: [
				"Shared collections with owner / view / edit ACL model", // ACL model ? 
				"Recipe CRUD plus multi-tag and difficulty / time / cost filters",
				"Creator attribution on recipes",
				"Upsert-based share management so ACL changes stay idempotent", // Crazy sentence 
			],
		},
		{
			title: "IoT plant ingestion into the same product",
			problem:
				"ESP32 devices needed a reliable path into the app: authenticated posts, time-series storage, per-device thresholds, and a dashboard that shows live “needs water” plus history trends without a separate backend.",
			solution: [
				"API-key–protected POST /api/sensor for moisture, temperature, humidity, lux",
				"PostgreSQL time-series storage with auto-provisioned watering thresholds",
				"DISTINCT ON queries for latest-per-device sensor state",
				"Live dashboard + Chart.js history with rolling-average overlays",
			],
		},
		{
			title: "Schema that works locally and on managed Postgres",
			problem:
				"No migration framework, but the app had to boot cleanly on a laptop and on Heroku/RDS where CREATE DATABASE / heavy provisioning is restricted or wrong.",
			solution: [
				"Idempotent bootstrap: CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS",
				"Environment-aware DB creation (skip provisioning on Heroku/RDS)",
				"Raw SQL via psycopg2 kept explicit and portable across environments",
			],
		},
	],
	codeHighlights: [
		{
			topic: "Application factory & blueprints",
			file: "Flask app factory 11 blueprints",
			why: "Auth, XP, challenges, cooking, plants, etc. stay modular in one monolith",
		},
		{
			topic: "XP progression engine",
			file: "stats / XP game logic",
			why: "Triangular curve, multi-level-up, streaks, daily aggregates",
		},
		{
			topic: "Challenge reset clock",
			file: "global config clock",
			why: "Rotating daily challenges from a ~70-prompt bank",
		},
		{
			topic: "Cooking ACL shares",
			file: "cooking share upserts",
			why: "Owner / view / edit permissions without duplicate share rows",
		},
		{
			topic: "Sensor ingestion API",
			file: "POST /api/sensor",
			why: "API-key auth + time-series insert for ESP32 payloads",
		},
		{
			topic: "Latest device state",
			file: "DISTINCT ON sensor queries",
			why: "Efficient latest-per-device status for the live plant dashboard",
		},
		{
			topic: "Schema bootstrap",
			file: "idempotent CREATE / ADD COLUMN",
			why: "Local + cloud Postgres without Alembic/migrations",
		},
	],
	cvShort:
		"Built XP Tracker, a Flask 3 + PostgreSQL “life OS” with 16 skills, a triangular XP curve, daily challenges, 80 badges/titles, public profiles, and a leaderboard. Extended it with a collaborative cooking Drive (ACL shares, filters, upserts) and an IoT plant tracker (API-key sensor POST, time-series storage, Chart.js dashboard). Deployed with Gunicorn on a Heroku-style stack using an idempotent, environment-aware schema bootstrap.",
	cvMedium: [
		"Gamification: 16 skills in 4 categories, triangular XP curve with multi-level-up, streaks, ~70 daily challenges, 80 badges + 80 titles, leaderboard",
		"Architecture: Flask application factory, 11 blueprints, Jinja2 + vanilla JS, session auth, Gunicorn / Procfile deployment",
		"Cooking Drive: shared collections with owner/view/edit ACLs, recipe CRUD, filters, creator attribution, upsert share management",
		"IoT plants: API-key POST /api/sensor, PostgreSQL time-series, auto thresholds, DISTINCT ON latest state, Chart.js trends",
		"Data layer: psycopg2 raw SQL, idempotent schema bootstrap, skip DB provisioning on Heroku/RDS",
	],
	techTags: [
		"Python",
		"Flask",
		"PostgreSQL",
		"psycopg2",
		"Jinja2",
		"Chart.js",
		"Gunicorn",
		"Heroku",
		"Gamification",
		"ACL / sharing",
		"IoT",
		"ESP32",
		"Time-series",
		"REST API",
	],
	lessonsLearned:[
		"A personal habit app becomes a real product when game design, collaboration, and hardware share one coherent backend. ",
		"Separating progression logic (XP curve, streaks, challenge clock) from feature blueprints (cooking, plants) kept the monolith scalable. ",
		"Idempotent schema bootstrap and environment-aware provisioning mattered more than a migration framework early on: ",
		"the same raw SQL path had to work on local Postgres and managed cloud DBs. ",
		"End-to-end ownership UX, RPG rules, ACL modeling, IoT ingestion, and production packaging is what turned a manga-inspired experiment into a multi-domain platform.",
	]
};
