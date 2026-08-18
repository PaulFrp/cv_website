import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, graphEdges, graphNodes, LEGEND_ITEMS } from "./graphData";

const MIN_WIDTH = 72;
const HORIZONTAL_PADDING = 24;
const SINGLE_LINE_HEIGHT = 28;
const TWO_LINE_HEIGHT = 42;
const CORNER_RADIUS = 8;
const FONT = "600 12px system-ui, -apple-system, sans-serif";
const SPRING_REST = 120;
const SPRING_K = 0.012;
const GRAVITY = 0.005;
const DAMPING = 0.78;
const RELEASE_HOLD_MS = 2000;
const RELEASE_RAMP_MS = 4000;
const EDGE_INSET = 50;
const OUTER_RADIUS = 200;
const INNER_RADIUS = 90;
const NODE_GAP = 10;
const BOX_REPULSION = 0.45;
const OVERLAP_CORRECTION = 0.55;
const CLICK_MOVE_THRESHOLD = 6;
const DOUBLE_CLICK_MS = 400;

function isDarkMode() {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function measureNode(ctx, label) {
	const lines = label.split("\n");
	ctx.font = FONT;

	let maxLineWidth = 0;
	for (const line of lines) {
		maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
	}

	const width = Math.max(maxLineWidth + HORIZONTAL_PADDING, MIN_WIDTH);
	const height = lines.length > 1 ? TWO_LINE_HEIGHT : SINGLE_LINE_HEIGHT;

	return { lines, width, height };
}

function initNodes(ctx, width, height) {
	const cx = width / 2;
	const cy = height / 2;

	const projectNodes = graphNodes.filter((n) => n.category !== "concept");
	const conceptNodes = graphNodes.filter((n) => n.category === "concept");

	const nodes = graphNodes.map((nodeDef) => {
		const { lines, width: nodeWidth, height: nodeHeight } = measureNode(
			ctx,
			nodeDef.label,
		);
		return {
			...nodeDef,
			lines,
			width: nodeWidth,
			height: nodeHeight,
			x: cx,
			y: cy,
			vx: 0,
			vy: 0,
			releaseAt: 0,
		};
	});

	projectNodes.forEach((nodeDef, i) => {
		const angle = (i / projectNodes.length) * Math.PI * 2 - Math.PI / 2;
		const simNode = nodes.find((n) => n.id === nodeDef.id);
		simNode.x = cx + Math.cos(angle) * OUTER_RADIUS;
		simNode.y = cy + Math.sin(angle) * OUTER_RADIUS;
	});

	conceptNodes.forEach((nodeDef, i) => {
		const angle = (i / conceptNodes.length) * Math.PI * 2 - Math.PI / 2;
		const simNode = nodes.find((n) => n.id === nodeDef.id);
		simNode.x = cx + Math.cos(angle) * INNER_RADIUS;
		simNode.y = cy + Math.sin(angle) * INNER_RADIUS;
	});

	return nodes;
}

function getNodeById(nodes, id) {
	return nodes.find((n) => n.id === id);
}

function hitTest(nodes, x, y) {
	for (let i = nodes.length - 1; i >= 0; i--) {
		const node = nodes[i];
		const left = node.x - node.width / 2;
		const right = node.x + node.width / 2;
		const top = node.y - node.height / 2;
		const bottom = node.y + node.height / 2;

		if (x >= left && x <= right && y >= top && y <= bottom) {
			return node;
		}
	}
	return null;
}

function getSpringRestLength(a, b) {
	const minCenterDist =
		Math.max(a.width, b.width) / 2 +
		Math.max(a.height, b.height) / 2 +
		NODE_GAP +
		16;
	return Math.max(SPRING_REST, minCenterDist);
}

function getForceMultiplier(node) {
	if (!node.releaseAt) return 1;

	const elapsed = Date.now() - node.releaseAt;
	if (elapsed < RELEASE_HOLD_MS) return 0.06;
	if (elapsed < RELEASE_HOLD_MS + RELEASE_RAMP_MS) {
		const t = (elapsed - RELEASE_HOLD_MS) / RELEASE_RAMP_MS;
		return 0.06 + t * 0.94;
	}

	node.releaseAt = 0;
	return 1;
}

function isNodeFixed(node, draggedId) {
	return node.id === draggedId;
}

function applyBoxCollision(a, b, draggedId) {
	const hwA = a.width / 2;
	const hhA = a.height / 2;
	const hwB = b.width / 2;
	const hhB = b.height / 2;

	let dx = b.x - a.x;
	let dy = b.y - a.y;
	if (dx === 0 && dy === 0) {
		dx = (Math.random() - 0.5) * 0.01;
		dy = (Math.random() - 0.5) * 0.01;
	}

	const overlapX = hwA + hwB + NODE_GAP - Math.abs(dx);
	const overlapY = hhA + hhB + NODE_GAP - Math.abs(dy);

	if (overlapX <= 0 || overlapY <= 0) return;

	const sepX = overlapX < overlapY;
	const push = sepX ? overlapX : overlapY;
	const signX = sepX ? Math.sign(dx) : 0;
	const signY = sepX ? 0 : Math.sign(dy);

	const moveX = push * signX;
	const moveY = push * signY;

	const aMovable = !isNodeFixed(a, draggedId);
	const bMovable = !isNodeFixed(b, draggedId);

	if (aMovable && bMovable) {
		a.vx -= moveX * BOX_REPULSION;
		a.vy -= moveY * BOX_REPULSION;
		b.vx += moveX * BOX_REPULSION;
		b.vy += moveY * BOX_REPULSION;

		a.x -= moveX * OVERLAP_CORRECTION * 0.5;
		a.y -= moveY * OVERLAP_CORRECTION * 0.5;
		b.x += moveX * OVERLAP_CORRECTION * 0.5;
		b.y += moveY * OVERLAP_CORRECTION * 0.5;
	} else if (aMovable) {
		a.vx -= moveX * BOX_REPULSION * 2;
		a.vy -= moveY * BOX_REPULSION * 2;
		a.x -= moveX * OVERLAP_CORRECTION;
		a.y -= moveY * OVERLAP_CORRECTION;
	} else if (bMovable) {
		b.vx += moveX * BOX_REPULSION * 2;
		b.vy += moveY * BOX_REPULSION * 2;
		b.x += moveX * OVERLAP_CORRECTION;
		b.y += moveY * OVERLAP_CORRECTION;
	}
}

function simulate(nodes, edges, width, height, draggedId) {
	const cx = width / 2;
	const cy = height / 2;

	for (let pass = 0; pass < 2; pass++) {
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				applyBoxCollision(nodes[i], nodes[j], draggedId);
			}
		}
	}

	for (const edge of edges) {
		const a = getNodeById(nodes, edge.source);
		const b = getNodeById(nodes, edge.target);
		if (!a || !b) continue;

		let dx = b.x - a.x;
		let dy = b.y - a.y;
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		const restLength = getSpringRestLength(a, b);
		const displacement = dist - restLength;
		const force = SPRING_K * displacement;

		dx /= dist;
		dy /= dist;

		if (!isNodeFixed(a, draggedId)) {
			const forceA = force * getForceMultiplier(a);
			a.vx += dx * forceA;
			a.vy += dy * forceA;
		}
		if (!isNodeFixed(b, draggedId)) {
			const forceB = force * getForceMultiplier(b);
			b.vx -= dx * forceB;
			b.vy -= dy * forceB;
		}
	}

	for (const node of nodes) {
		if (isNodeFixed(node, draggedId)) continue;

		const forceScale = getForceMultiplier(node);
		node.vx += (cx - node.x) * GRAVITY * forceScale;
		node.vy += (cy - node.y) * GRAVITY * forceScale;
		node.vx *= DAMPING;
		node.vy *= DAMPING;
		node.x += node.vx;
		node.y += node.vy;

		const halfW = node.width / 2;
		const halfH = node.height / 2;
		node.x = Math.max(EDGE_INSET + halfW, Math.min(width - EDGE_INSET - halfW, node.x));
		node.y = Math.max(EDGE_INSET + halfH, Math.min(height - EDGE_INSET - halfH, node.y));
	}
}

function drawRoundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function drawGraph(ctx, nodes, edges, width, height, hoveredId, dark) {
	ctx.clearRect(0, 0, width, height);

	ctx.strokeStyle = dark ? "rgba(180,178,169,0.18)" : "rgba(136,135,128,0.25)";
	ctx.lineWidth = 1;

	for (const edge of edges) {
		const a = getNodeById(nodes, edge.source);
		const b = getNodeById(nodes, edge.target);
		if (!a || !b) continue;

		ctx.beginPath();
		ctx.moveTo(a.x, a.y);
		ctx.lineTo(b.x, b.y);
		ctx.stroke();
	}

	for (const node of nodes) {
		const category = CATEGORIES[node.category];
		const isHovered = node.id === hoveredId;
		const left = node.x - node.width / 2;
		const top = node.y - node.height / 2;

		ctx.fillStyle = `${category.color}22`;
		ctx.strokeStyle = category.color;
		ctx.lineWidth = isHovered ? 1.5 : 0.8;

		drawRoundRect(ctx, left, top, node.width, node.height, CORNER_RADIUS);
		ctx.fill();
		ctx.stroke();

		ctx.font = FONT;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = dark ? "#e8e6de" : category.textDark;

		if (node.lines.length === 1) {
			ctx.fillText(node.lines[0], node.x, node.y);
		} else {
			ctx.fillText(node.lines[0], node.x, node.y - 7);
			ctx.fillText(node.lines[1], node.x, node.y + 8);
		}
	}
}

function ProjectGraph() {
	const navigate = useNavigate();
	const containerRef = useRef(null);
	const canvasRef = useRef(null);
	const simRef = useRef(null);
	const rafRef = useRef(null);
	const dragRef = useRef({ id: null, offsetX: 0, offsetY: 0 });
	const pointerRef = useRef({ x: 0, y: 0 });
	const downRef = useRef({ nodeId: null, x: 0, y: 0 });
	const lastClickRef = useRef({ nodeId: null, time: 0 });

	const [tooltip, setTooltip] = useState(null);
	const [cursorStyle, setCursorStyle] = useState("grab");

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;

		const ctx = canvas.getContext("2d");
		let logicalWidth = 0;
		let logicalHeight = 0;
		let hoveredId = null;
		let dark = isDarkMode();

		function resize() {
			const dpr = window.devicePixelRatio || 1;
			const rect = container.getBoundingClientRect();
			logicalWidth = rect.width;
			logicalHeight = rect.height;

			canvas.width = logicalWidth * dpr;
			canvas.height = logicalHeight * dpr;
			canvas.style.width = `${logicalWidth}px`;
			canvas.style.height = `${logicalHeight}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			if (!simRef.current) {
				simRef.current = {
					nodes: initNodes(ctx, logicalWidth, logicalHeight),
					edges: graphEdges,
				};
			}
		}

		function getCanvasCoords(clientX, clientY) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: clientX - rect.left,
				y: clientY - rect.top,
			};
		}

		function tick() {
			const sim = simRef.current;
			if (!sim || logicalWidth === 0) {
				rafRef.current = requestAnimationFrame(tick);
				return;
			}

			const draggedId = dragRef.current.id;
			if (draggedId) {
				const node = getNodeById(sim.nodes, draggedId);
				const { x, y } = pointerRef.current;
				node.x = x - dragRef.current.offsetX;
				node.y = y - dragRef.current.offsetY;

				const halfW = node.width / 2;
				const halfH = node.height / 2;
				node.x = Math.max(
					EDGE_INSET + halfW,
					Math.min(logicalWidth - EDGE_INSET - halfW, node.x),
				);
				node.y = Math.max(
					EDGE_INSET + halfH,
					Math.min(logicalHeight - EDGE_INSET - halfH, node.y),
				);
				node.vx = 0;
				node.vy = 0;
			}

			simulate(sim.nodes, sim.edges, logicalWidth, logicalHeight, draggedId);

			drawGraph(
				ctx,
				sim.nodes,
				sim.edges,
				logicalWidth,
				logicalHeight,
				hoveredId ?? draggedId,
				dark,
			);
			rafRef.current = requestAnimationFrame(tick);
		}

		function onPointerDown(e) {
			const { x, y } = getCanvasCoords(e.clientX, e.clientY);
			pointerRef.current = { x, y };

			const node = hitTest(simRef.current.nodes, x, y);
			if (node) {
				node.releaseAt = 0;
				node.vx = 0;
				node.vy = 0;
				downRef.current = { nodeId: node.id, x, y };
				dragRef.current = {
					id: node.id,
					offsetX: x - node.x,
					offsetY: y - node.y,
				};
				setCursorStyle("grabbing");
				setTooltip(null);
				canvas.setPointerCapture(e.pointerId);
			} else {
				downRef.current = { nodeId: null, x: 0, y: 0 };
			}
		}

		function onPointerMove(e) {
			const { x, y } = getCanvasCoords(e.clientX, e.clientY);
			pointerRef.current = { x, y };

			if (dragRef.current.id) return;

			const node = hitTest(simRef.current.nodes, x, y);
			const newHoveredId = node?.id ?? null;

			if (newHoveredId !== hoveredId) {
				hoveredId = newHoveredId;
				if (node) {
					setTooltip({
						x: e.clientX + 12,
						y: e.clientY - 10,
						label: node.label.replace("\n", " "),
						description: node.description,
					});
					setCursorStyle("grab");
				} else {
					setTooltip(null);
					setCursorStyle("grab");
				}
			} else if (node) {
				setTooltip((prev) =>
					prev ? { ...prev, x: e.clientX + 12, y: e.clientY - 10 } : null,
				);
			}
		}

		function onPointerUp(e) {
			const draggedId = dragRef.current.id;
			if (draggedId) {
				const node = getNodeById(simRef.current.nodes, draggedId);
				const { x, y } = pointerRef.current;
				const moved = Math.hypot(x - downRef.current.x, y - downRef.current.y);

				if (
					node &&
					downRef.current.nodeId === node.id &&
					moved < CLICK_MOVE_THRESHOLD
				) {
					const now = Date.now();
					const lastClick = lastClickRef.current;
					if (
						lastClick.nodeId === node.id &&
						now - lastClick.time < DOUBLE_CLICK_MS
					) {
						if (node.cardId) {
							navigate(`/projects/${node.cardId}`);
						}
						lastClickRef.current = { nodeId: null, time: 0 };
					} else {
						lastClickRef.current = { nodeId: node.id, time: now };
					}
				}

				if (node) {
					node.vx = 0;
					node.vy = 0;
					node.releaseAt = Date.now();
				}
				dragRef.current = { id: null, offsetX: 0, offsetY: 0 };
				downRef.current = { nodeId: null, x: 0, y: 0 };
				setCursorStyle("grab");
				canvas.releasePointerCapture(e.pointerId);
			}
		}

		function onPointerLeave() {
			if (!dragRef.current.id) {
				hoveredId = null;
				setTooltip(null);
			}
		}

		const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
		function onDarkChange(e) {
			dark = e.matches;
		}

		resize();
		rafRef.current = requestAnimationFrame(tick);

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);

		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", onPointerMove);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointercancel", onPointerUp);
		canvas.addEventListener("pointerleave", onPointerLeave);
		darkQuery.addEventListener("change", onDarkChange);

		return () => {
			cancelAnimationFrame(rafRef.current);
			resizeObserver.disconnect();
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointercancel", onPointerUp);
			canvas.removeEventListener("pointerleave", onPointerLeave);
			darkQuery.removeEventListener("change", onDarkChange);
		};
	}, [navigate]);

	return (
		<div className="project-graph-wrapper">
			<ul className="graph-legend" aria-label="Node category legend">
				{LEGEND_ITEMS.map((key) => (
					<li key={key} className="graph-legend-item">
						<span
							className="graph-legend-swatch"
							style={{
								backgroundColor: `${CATEGORIES[key].color}22`,
								borderColor: CATEGORIES[key].color,
							}}
						/>
						<span className="graph-legend-label">{CATEGORIES[key].label}</span>
					</li>
				))}
			</ul>
			<div ref={containerRef} className="project-graph-container">
				<canvas
					ref={canvasRef}
					className="project-graph-canvas"
					style={{ cursor: cursorStyle }}
				/>
			</div>
			{tooltip && (
				<div
					className="graph-tooltip"
					style={{ left: tooltip.x, top: tooltip.y }}
				>
					<strong>{tooltip.label}</strong>
					<p>{tooltip.description}</p>
				</div>
			)}
		</div>
	);
}

export default ProjectGraph;
