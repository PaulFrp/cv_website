/** The museum art is authored at this pixel size; every world coordinate uses it. */
export const MUSEUM_WORLD = { width: 1402, height: 1122 };

/** Where the player appears when the museum loads, in world pixels. */
export const SPAWN_POINT = { x: 701, y: 860 };

/** Walk speed in world pixels per second. */
export const PLAYER_SPEED = 140;

/** Height the player sprite is drawn at, in world pixels. */
export const PLAYER_DRAW_HEIGHT = 96;

/** Distance walked before the sprite advances to its next walk frame. */
export const WALK_CYCLE_DISTANCE = 12;

/** How close the player must get to a stand before its caption appears. */
export const PROXIMITY_RADIUS = 70;

/** Bump this after re-exporting museum art so browsers refetch it. */
export const ASSET_VERSION = "20260826a";
