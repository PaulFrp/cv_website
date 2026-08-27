const STORAGE_KEY = "museum-player-return";

/** Latest live pose, updated every frame while the museum is running. */
let live = null;

/** Keep an in-memory snapshot so leaving via link or Enter can persist it. */
export function trackMuseumPlayer(player, nearby) {
	live = {
		x: player.x,
		y: player.y,
		facing: player.facing,
		projectId: nearby?.hasPage ? nearby.id : (live?.projectId ?? null),
	};
}

/** Writes the current pose to sessionStorage before leaving the museum. */
export function rememberMuseumPlayer(projectId) {
	if (!live) return;
	try {
		sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				...live,
				projectId: projectId ?? live.projectId,
			}),
		);
	} catch {
		// Private mode / quota — restoration simply won't happen.
	}
}

/** Reads a previously saved pose, or null when none is available. */
export function recallMuseumPlayer() {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
