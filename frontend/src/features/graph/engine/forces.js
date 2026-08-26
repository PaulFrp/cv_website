import { findNodeById } from "./nodes";

/** Spring settings for the edges between nodes. */
const SPRING_REST_LENGTH = 120;
const SPRING_STIFFNESS = 0.012;

/** Pull towards the centre, plus the friction that lets the layout settle. */
const GRAVITY = 0.005;
const DAMPING = 0.78;

/** Box separation: how hard overlapping nodes push apart, and their margin. */
const NODE_GAP = 10;
const REPULSION = 0.45;
const OVERLAP_CORRECTION = 0.55;
const SEPARATION_PASSES = 2;

/** Keep nodes this far from the canvas edge so labels stay readable. */
const EDGE_INSET = 50;

/**
 * After a drag the node is left almost still, then eased back into the
 * simulation, so releasing a node does not fling the whole graph around.
 */
const RELEASE_HOLD_MS = 2000;
const RELEASE_RAMP_MS = 4000;
const RELEASE_DAMPING = 0.06;

function forceScale(node) {
	if (!node.releasedAt) return 1;

	const elapsed = Date.now() - node.releasedAt;
	if (elapsed < RELEASE_HOLD_MS) return RELEASE_DAMPING;
	if (elapsed < RELEASE_HOLD_MS + RELEASE_RAMP_MS) {
		const progress = (elapsed - RELEASE_HOLD_MS) / RELEASE_RAMP_MS;
		return RELEASE_DAMPING + progress * (1 - RELEASE_DAMPING);
	}

	node.releasedAt = 0;
	return 1;
}

export function clampToCanvas(node, width, height) {
	const halfWidth = node.width / 2;
	const halfHeight = node.height / 2;
	node.x = Math.min(Math.max(node.x, EDGE_INSET + halfWidth), width - EDGE_INSET - halfWidth);
	node.y = Math.min(Math.max(node.y, EDGE_INSET + halfHeight), height - EDGE_INSET - halfHeight);
}

/** Pushes two overlapping boxes apart along whichever axis overlaps least. */
function separate(a, b, draggedId) {
	let dx = b.x - a.x;
	let dy = b.y - a.y;
	if (dx === 0 && dy === 0) {
		dx = (Math.random() - 0.5) * 0.01;
		dy = (Math.random() - 0.5) * 0.01;
	}

	const overlapX = (a.width + b.width) / 2 + NODE_GAP - Math.abs(dx);
	const overlapY = (a.height + b.height) / 2 + NODE_GAP - Math.abs(dy);
	if (overlapX <= 0 || overlapY <= 0) return;

	const alongX = overlapX < overlapY;
	const pushX = alongX ? overlapX * Math.sign(dx) : 0;
	const pushY = alongX ? 0 : overlapY * Math.sign(dy);

	const aMovable = a.id !== draggedId;
	const bMovable = b.id !== draggedId;
	if (!aMovable && !bMovable) return;

	// A node being dragged absorbs none of the push, so the free one takes all.
	const solo = !aMovable || !bMovable;
	const bounce = REPULSION * (solo ? 2 : 1);
	const shift = OVERLAP_CORRECTION * (solo ? 1 : 0.5);

	if (aMovable) {
		a.vx -= pushX * bounce;
		a.vy -= pushY * bounce;
		a.x -= pushX * shift;
		a.y -= pushY * shift;
	}
	if (bMovable) {
		b.vx += pushX * bounce;
		b.vy += pushY * bounce;
		b.x += pushX * shift;
		b.y += pushY * shift;
	}
}

/** Edges rest far enough apart that the two node boxes cannot touch. */
function restLength(a, b) {
	const minimum =
		Math.max(a.width, b.width) / 2 + Math.max(a.height, b.height) / 2 + NODE_GAP + 16;
	return Math.max(SPRING_REST_LENGTH, minimum);
}

function applySprings(nodes, edges, draggedId) {
	for (const edge of edges) {
		const a = findNodeById(nodes, edge.source);
		const b = findNodeById(nodes, edge.target);
		if (!a || !b) continue;

		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const distance = Math.hypot(dx, dy) || 1;
		const force = SPRING_STIFFNESS * (distance - restLength(a, b));
		const unitX = dx / distance;
		const unitY = dy / distance;

		if (a.id !== draggedId) {
			const scale = force * forceScale(a);
			a.vx += unitX * scale;
			a.vy += unitY * scale;
		}
		if (b.id !== draggedId) {
			const scale = force * forceScale(b);
			b.vx -= unitX * scale;
			b.vy -= unitY * scale;
		}
	}
}

/** Advances the force-directed layout by one frame. */
export function stepSimulation(nodes, edges, width, height, draggedId) {
	for (let pass = 0; pass < SEPARATION_PASSES; pass++) {
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				separate(nodes[i], nodes[j], draggedId);
			}
		}
	}

	applySprings(nodes, edges, draggedId);

	const centerX = width / 2;
	const centerY = height / 2;

	for (const node of nodes) {
		if (node.id === draggedId) continue;

		const scale = forceScale(node);
		node.vx = (node.vx + (centerX - node.x) * GRAVITY * scale) * DAMPING;
		node.vy = (node.vy + (centerY - node.y) * GRAVITY * scale) * DAMPING;
		node.x += node.vx;
		node.y += node.vy;
		clampToCanvas(node, width, height);
	}
}
