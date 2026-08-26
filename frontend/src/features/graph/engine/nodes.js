import { graphNodes } from "../graphData";

export const NODE_FONT = "600 12px system-ui, -apple-system, sans-serif";

const MIN_NODE_WIDTH = 72;
const HORIZONTAL_PADDING = 24;
const SINGLE_LINE_HEIGHT = 28;
const TWO_LINE_HEIGHT = 42;

/** Project nodes start on an outer ring, concept nodes on an inner one. */
const PROJECT_RING_RADIUS = 200;
const CONCEPT_RING_RADIUS = 90;

/** Sizes a node box around its label, which may contain one line break. */
function measureLabel(context, label) {
	context.font = NODE_FONT;
	const lines = label.split("\n");
	const widest = Math.max(...lines.map((line) => context.measureText(line).width));

	return {
		lines,
		width: Math.max(widest + HORIZONTAL_PADDING, MIN_NODE_WIDTH),
		height: lines.length > 1 ? TWO_LINE_HEIGHT : SINGLE_LINE_HEIGHT,
	};
}

/**
 * Builds the simulation nodes and seeds them on two rings, which settles the
 * layout far faster than starting everything at the centre.
 */
export function createNodes(context, width, height) {
	const centerX = width / 2;
	const centerY = height / 2;

	const nodes = graphNodes.map((definition) => ({
		...definition,
		...measureLabel(context, definition.label),
		x: centerX,
		y: centerY,
		vx: 0,
		vy: 0,
		releasedAt: 0,
	}));

	const rings = [
		{ radius: PROJECT_RING_RADIUS, members: nodes.filter((n) => n.category !== "concept") },
		{ radius: CONCEPT_RING_RADIUS, members: nodes.filter((n) => n.category === "concept") },
	];

	for (const { radius, members } of rings) {
		members.forEach((node, index) => {
			const angle = (index / members.length) * Math.PI * 2 - Math.PI / 2;
			node.x = centerX + Math.cos(angle) * radius;
			node.y = centerY + Math.sin(angle) * radius;
		});
	}

	return nodes;
}

export function findNodeById(nodes, id) {
	return nodes.find((node) => node.id === id);
}

/** Topmost node under the pointer, or null. Nodes are drawn in array order. */
export function findNodeAt(nodes, x, y) {
	for (let i = nodes.length - 1; i >= 0; i--) {
		const node = nodes[i];
		if (
			Math.abs(x - node.x) <= node.width / 2 &&
			Math.abs(y - node.y) <= node.height / 2
		) {
			return node;
		}
	}
	return null;
}
