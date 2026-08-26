const ROWS = [
	[{ direction: "up", glyph: "▲", label: "Walk up" }],
	[
		{ direction: "left", glyph: "◀", label: "Walk left" },
		{ direction: "down", glyph: "▼", label: "Walk down" },
		{ direction: "right", glyph: "▶", label: "Walk right" },
	],
];

function PadButton({ direction, glyph, label, onPress, onRelease }) {
	const release = () => onRelease(direction);

	return (
		<button
			type="button"
			className="pixel-museum-pad"
			aria-label={label}
			onPointerDown={(event) => {
				event.preventDefault();
				onPress(direction);
			}}
			onPointerUp={release}
			onPointerLeave={release}
			onPointerCancel={release}
		>
			{glyph}
		</button>
	);
}

/** D-pad shown instead of the keyboard hint on touch devices. */
function MuseumTouchPad({ onPress, onRelease }) {
	return (
		<div className="pixel-museum-controls" aria-label="Touch controls">
			{ROWS.map((row) => (
				<div key={row[0].direction} className="pixel-museum-pad-row">
					{row.map((button) => (
						<PadButton
							key={button.direction}
							{...button}
							onPress={onPress}
							onRelease={onRelease}
						/>
					))}
				</div>
			))}
		</div>
	);
}

export default MuseumTouchPad;
