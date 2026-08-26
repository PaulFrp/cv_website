import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { drawGraph } from "./engine/draw";
import { clampToCanvas, stepSimulation } from "./engine/forces";
import { createNodes, findNodeAt, findNodeById } from "./engine/nodes";
import { CATEGORIES, graphEdges, LEGEND_ORDER } from "./graphData";
import "./graph.css";

/** A pointer that moves less than this between down and up counts as a click. */
const CLICK_SLOP_PX = 6;
const DOUBLE_CLICK_MS = 400;

const TOOLTIP_OFFSET = { x: 12, y: -10 };

function GraphLegend() {
	return (
		<ul className="graph-legend" aria-label="Node category legend">
			{LEGEND_ORDER.map((key) => (
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
	);
}

function GraphTooltip({ tooltip }) {
	if (!tooltip) return null;

	return (
		<div className="graph-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
			<strong>{tooltip.label}</strong>
			<p>{tooltip.description}</p>
		</div>
	);
}

/**
 * Force-directed map of how the projects relate to each other. Nodes can be
 * dragged around; double-clicking a project opens its detail page.
 */
function ProjectGraph() {
	const navigate = useNavigate();
	const containerRef = useRef(null);
	const canvasRef = useRef(null);

	const [tooltip, setTooltip] = useState(null);
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		let nodes = null;
		let width = 0;
		let height = 0;
		let hoveredId = null;
		let frameHandle = 0;

		const pointer = { x: 0, y: 0 };
		const drag = { id: null, offsetX: 0, offsetY: 0 };
		const pressed = { id: null, x: 0, y: 0 };
		let lastClick = { id: null, time: 0 };

		function resize() {
			const ratio = window.devicePixelRatio || 1;
			const rect = container.getBoundingClientRect();
			width = rect.width;
			height = rect.height;

			canvas.width = width * ratio;
			canvas.height = height * ratio;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			context.setTransform(ratio, 0, 0, ratio, 0, 0);

			nodes ??= createNodes(context, width, height);
		}

		function toCanvasSpace(event) {
			const rect = canvas.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		}

		function tick() {
			frameHandle = requestAnimationFrame(tick);
			if (!nodes || width === 0) return;

			if (drag.id) {
				const node = findNodeById(nodes, drag.id);
				node.x = pointer.x - drag.offsetX;
				node.y = pointer.y - drag.offsetY;
				node.vx = 0;
				node.vy = 0;
				clampToCanvas(node, width, height);
			}

			stepSimulation(nodes, graphEdges, width, height, drag.id);
			drawGraph(context, nodes, graphEdges, width, height, hoveredId ?? drag.id);
		}

		function onPointerDown(event) {
			const point = toCanvasSpace(event);
			pointer.x = point.x;
			pointer.y = point.y;

			const node = findNodeAt(nodes, point.x, point.y);
			pressed.id = node?.id ?? null;
			pressed.x = point.x;
			pressed.y = point.y;
			if (!node) return;

			node.releasedAt = 0;
			node.vx = 0;
			node.vy = 0;
			drag.id = node.id;
			drag.offsetX = point.x - node.x;
			drag.offsetY = point.y - node.y;

			setDragging(true);
			setTooltip(null);
			canvas.setPointerCapture(event.pointerId);
		}

		function onPointerMove(event) {
			const point = toCanvasSpace(event);
			pointer.x = point.x;
			pointer.y = point.y;
			if (drag.id) return;

			const node = findNodeAt(nodes, point.x, point.y);
			const position = {
				x: event.clientX + TOOLTIP_OFFSET.x,
				y: event.clientY + TOOLTIP_OFFSET.y,
			};

			if ((node?.id ?? null) === hoveredId) {
				if (node) setTooltip((prev) => (prev ? { ...prev, ...position } : null));
				return;
			}

			hoveredId = node?.id ?? null;
			setTooltip(
				node
					? {
							...position,
							label: node.label.replace("\n", " "),
							description: node.description,
						}
					: null,
			);
		}

		function onPointerUp(event) {
			if (!drag.id) return;

			const node = findNodeById(nodes, drag.id);
			const travelled = Math.hypot(pointer.x - pressed.x, pointer.y - pressed.y);
			const isClick = node && pressed.id === node.id && travelled < CLICK_SLOP_PX;

			if (isClick) {
				const now = Date.now();
				const isDoubleClick =
					lastClick.id === node.id && now - lastClick.time < DOUBLE_CLICK_MS;

				if (isDoubleClick && node.cardId) navigate(`/projects/${node.cardId}`);
				lastClick = isDoubleClick ? { id: null, time: 0 } : { id: node.id, time: now };
			}

			if (node) {
				node.vx = 0;
				node.vy = 0;
				node.releasedAt = Date.now();
			}

			drag.id = null;
			pressed.id = null;
			setDragging(false);
			canvas.releasePointerCapture(event.pointerId);
		}

		function onPointerLeave() {
			if (drag.id) return;
			hoveredId = null;
			setTooltip(null);
		}

		resize();
		frameHandle = requestAnimationFrame(tick);

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);

		const listeners = {
			pointerdown: onPointerDown,
			pointermove: onPointerMove,
			pointerup: onPointerUp,
			pointercancel: onPointerUp,
			pointerleave: onPointerLeave,
		};
		for (const [type, handler] of Object.entries(listeners)) {
			canvas.addEventListener(type, handler);
		}

		return () => {
			cancelAnimationFrame(frameHandle);
			resizeObserver.disconnect();
			for (const [type, handler] of Object.entries(listeners)) {
				canvas.removeEventListener(type, handler);
			}
		};
	}, [navigate]);

	return (
		<div className="project-graph-wrapper">
			<GraphLegend />
			<div ref={containerRef} className="project-graph-container">
				<canvas
					ref={canvasRef}
					className="project-graph-canvas"
					style={{ cursor: dragging ? "grabbing" : "grab" }}
				/>
			</div>
			<GraphTooltip tooltip={tooltip} />
		</div>
	);
}

export default ProjectGraph;
