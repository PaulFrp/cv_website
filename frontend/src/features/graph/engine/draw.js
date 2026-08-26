import { CATEGORIES } from "../graphData";
import { findNodeById, NODE_FONT } from "./nodes";

const CORNER_RADIUS = 8;
const EDGE_COLOR = "rgba(136, 135, 128, 0.25)";
const NODE_FILL_ALPHA = "22";
const TWO_LINE_OFFSET = { top: -7, bottom: 8 };

function roundedRectPath(context, x, y, width, height, radius) {
	context.beginPath();
	context.moveTo(x + radius, y);
	context.arcTo(x + width, y, x + width, y + height, radius);
	context.arcTo(x + width, y + height, x, y + height, radius);
	context.arcTo(x, y + height, x, y, radius);
	context.arcTo(x, y, x + width, y, radius);
	context.closePath();
}

function drawEdges(context, nodes, edges) {
	context.strokeStyle = EDGE_COLOR;
	context.lineWidth = 1;

	for (const edge of edges) {
		const a = findNodeById(nodes, edge.source);
		const b = findNodeById(nodes, edge.target);
		if (!a || !b) continue;

		context.beginPath();
		context.moveTo(a.x, a.y);
		context.lineTo(b.x, b.y);
		context.stroke();
	}
}

function drawNode(context, node, highlighted) {
	const category = CATEGORIES[node.category];

	context.fillStyle = `${category.color}${NODE_FILL_ALPHA}`;
	context.strokeStyle = category.color;
	context.lineWidth = highlighted ? 1.5 : 0.8;
	roundedRectPath(
		context,
		node.x - node.width / 2,
		node.y - node.height / 2,
		node.width,
		node.height,
		CORNER_RADIUS,
	);
	context.fill();
	context.stroke();

	context.font = NODE_FONT;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = category.textDark;

	if (node.lines.length === 1) {
		context.fillText(node.lines[0], node.x, node.y);
		return;
	}
	context.fillText(node.lines[0], node.x, node.y + TWO_LINE_OFFSET.top);
	context.fillText(node.lines[1], node.x, node.y + TWO_LINE_OFFSET.bottom);
}

export function drawGraph(context, nodes, edges, width, height, highlightedId) {
	context.clearRect(0, 0, width, height);
	drawEdges(context, nodes, edges);
	for (const node of nodes) {
		drawNode(context, node, node.id === highlightedId);
	}
}
