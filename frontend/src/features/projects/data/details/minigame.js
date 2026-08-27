export const minigameDetail = {
	displayTitle: "Mini Games / Real-time multiplayer party game platform",
	pitch:
		"A full-stack website with several real-time multiplayer games, with shared room management, WebSocket sync, and mobile session handling across iOS Safari and Heroku deployment.",
	overview:[
		"Built a multiplayer platform where players create or join rooms, pick a game, and play in sync across devices. ",
		"The hardest part was not the game rules themselves, but keeping every client on the same phase (lobby → captioning → voting → results) ",
		"when connections drop, cookies fail, or users refresh mid-game. ",
		"I introduced a shared room client layer, server-side background timers for phase transitions, a hybrid WebSocket + HTTP sync strategy, ",
		"and header-based identity as a fallback when cross-site cookies are blocked (especially on iPhone Safari).",
	], 
		techStack: [
		{ layer: "Frontend", technologies: "Next.js 14, React 18, CSS Modules" },
		{ layer: "Backend", technologies: "FastAPI, Uvicorn, Python asyncio" },
		{ layer: "Real-time", technologies: "WebSockets + HTTP polling fallback" },
		{
			layer: "Database",
			technologies: "SQLAlchemy ORM, PostgreSQL (prod) / SQLite (dev)",
		},
		{
			layer: "Auth / session",
			technologies:
				"Signed cookies (itsdangerous), custom headers (x-client-id, x-room-id)",
		},
		{
			layer: "Deployment",
			technologies:
				"Heroku (unified frontend + backend), CORS / same-origin handling",
		},
	],
	challenges: [
		{
			title: "Room creation & join flow unreliable on mobile",
			problem:
				"After creating/joining a room, some devices lost the room_id (localStorage blocked in Safari or private mode, Next.js router race, shared room_id key across games).",
			solution: [
				"URL-first room persistence: ?room_id=123 in the address bar",
				"Per-game storage keys (room_id_make_it_meme, etc.)",
				"Full-page navigation instead of router.push on mobile",
				"x-room-id header on every API call",
			],
			codeRefs: [
				"src/roomClient.js resolveRoomId, persistRoomId, roomHeaders, navigateToRoom",
				"pages/make_it_meme/index.js create/join + navigateToRoom",
				"backend/app/routes/room.py create_room, join_room_with_username",
			],
		},
		{
			title: "Cookies not working cross-origin (Safari ITP)",
			problem:
				"Backend set room_session cookies with Secure; SameSite=None, but Safari often blocks third-party / cross-site cookies when frontend (:3000) and backend (:8000) are on different origins.",
			solution: [
				"Treat cookies as optional; prefer explicit headers and URL params",
				"Backend reads identity in this order: x-room-id → query param → signed cookie",
			],
			codeRefs: [
				"backend/app/routes/general.py header/query priority over cookie",
				"backend/app/routes/room.py cookie set on join",
				"backend/app/session.py signed session with itsdangerous",
				"text_files/SAFARI_IOS_FIXES.md full write-up of Safari issues",
			],
		},
		{
			title: "WebSocket desync between players (especially iPhone)",
			problem:
				"Safari drops WebSocket connections when the tab is backgrounded. Players missed broadcasts and stayed stuck on an old phase until refresh and sometimes needed two refreshes to catch up.",
			solution: [
				"Always-on HTTP polling (1s) as source of truth",
				"WebSocket for low-latency actions + server broadcasts",
				"Auto-reconnect with exponential backoff",
				"onPageVisible() resync on tab focus / pageshow",
				"WS keepalive ping every 20s (Heroku timeout)",
				"HTTP fallback for caption submission when WS is down",
			],
			codeRefs: [
				"pages/make_it_meme/room.js WS connect/reconnect, HTTP poll, onPageVisible",
				"src/roomClient.js fetchGameStatus, onPageVisible",
				"backend/app/routes/websockets.py keepalive ping task",
				"backend/app/routes/meme.py HTTP caption fallback endpoint",
			],
		},
		{
			title: "Game phase desync (timer, early vote finish, stale state)",
			problem:
				"Phase transitions (captioning → voting → results) were originally triggered by whichever client polled first, causing race conditions. Timers drifted client-side. Early voting didn’t advance the game. After refresh, stale WebSocket frames could roll the UI backward (e.g. voting → captioning).",
			solution: [
				"Centralized background timer (meme_timer.py) single server loop checks every 1s",
				"try_advance_from_captioning() / try_advance_from_voting() atomic transitions + broadcast",
				"Server-synced timer via phase_epoch / start_time + client-side countdown from last server remaining",
				"Fresh SQLAlchemy session per WebSocket message (avoid stale ORM reads)",
				"shouldIgnoreMemeGameUpdate() reject regressive WS updates",
				"HTTP trusted over WS for state; burst poll on mount after refresh",
			],
			codeRefs: [
				"backend/app/game/meme_timer.py timer loop, phase advance, abstain logic",
				"backend/app/routes/websockets.py SessionLocal() per message",
				"src/roomClient.js shouldIgnoreMemeGameUpdate",
				"pages/make_it_meme/room.js applyGameUpdate, syncRemainingFromServer",
				"text_files/DESYNC_FIX.md architecture before/after diagram",
			],
		},
		{
			title: "Identity mismatch breaking vote completion",
			problem:
				"Game state stored usernames in some places and client UUIDs in others, so all_players_voted() never returned true when everyone had voted.",
			solution: [
				"Store user_ids in game snapshot at start; player_user_ids() helper resolves consistently",
			],
			codeRefs: [
				"backend/app/game/meme_timer.py player_user_ids, all_players_voted",
			],
		},
		{
			title: "Edge cases in game logic",
			problem:
				"Caption timeout with partial submissions, solo player / no votable memes, and results screen shape differences between voting (array) and results (object).",
			solution: [
				"Caption timeout with partial submissions → skip voting, auto-abstain",
				"Solo player / no votable memes → skip vote phase",
				"Results screen: normalized submissions shape on frontend",
			],
			codeRefs: [
				"backend/app/game/meme_timer.py should_skip_voting, ABSTAIN",
				"pages/make_it_meme/room.js normalizeSubmissions, results UI",
				"pages/make_it_meme/memecanvas.js meme + caption slot rendering",
			],
		},
	],
	codeHighlights: [
		{
			topic: "WebSocket broadcast hub",
			file: "backend/app/game/websockets.py",
			why: "Room-scoped connection manager, fan-out to all players",
		},
		{
			topic: "Shared game state model",
			file: "backend/app/models.py",
			why: "Room, Player, MemeGameState, CAH/WhoSaidIt state tables",
		},
		{
			topic: "Multi-game backend",
			file: "backend/app/main.py",
			why: "Single FastAPI app mounting meme, CAH, who_said_it, voting routes",
		},
		{
			topic: "Meme game lifecycle",
			file: "backend/app/game/meme.py",
			why: "Start game, status logic, next meme",
		},
		{
			topic: "CAH real-time room",
			file: "pages/cards_against_humanity/room.js",
			why: "Same roomClient patterns on another game",
		},
		{
			topic: "Architecture docs",
			file: "text_files/ARCHITECTURE.md",
			why: "System diagram (good for a CV architecture screenshot)",
		},
		{
			topic: "Room cleanup task",
			file: "backend/app/tasks/cleanup.py",
			why: "Background task emptying stale rooms",
		},
	],

};
