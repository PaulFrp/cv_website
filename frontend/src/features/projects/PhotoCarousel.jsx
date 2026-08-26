import { useMemo, useState } from "react";

const VISIBLE_THUMBNAILS = 4;

/** The strip wraps around, so both ends stay reachable in one direction. */
function wrapIndex(index, length) {
	return (index + length) % length;
}

function ArrowButton({ direction, label, onClick, className = "" }) {
	return (
		<button
			type="button"
			className={`detail-carousel-arrow${className ? ` ${className}` : ""}`}
			onClick={onClick}
			aria-label={label}
		>
			{direction === "previous" ? "\u2039" : "\u203A"}
		</button>
	);
}

function Lightbox({ photo, onPrevious, onNext, onClose }) {
	return (
		<div
			className="detail-photo-modal"
			role="dialog"
			aria-modal="true"
			aria-label="Expanded photo"
			onClick={onClose}
		>
			<div
				className="detail-photo-modal-content"
				onClick={(event) => event.stopPropagation()}
			>
				<ArrowButton
					direction="previous"
					label="Previous photo"
					onClick={onPrevious}
					className="detail-modal-arrow"
				/>
				<img src={photo.src} alt={photo.alt} className="detail-photo-large" />
				<ArrowButton
					direction="next"
					label="Next photo"
					onClick={onNext}
					className="detail-modal-arrow"
				/>
				<button
					type="button"
					className="detail-modal-close"
					onClick={onClose}
					aria-label="Close enlarged photo"
				>
					&times;
				</button>
			</div>
		</div>
	);
}

/**
 * Wrapping strip of photo thumbnails; clicking one opens it full size.
 */
function PhotoCarousel({ photos, label }) {
	const [firstVisible, setFirstVisible] = useState(0);
	const [expandedIndex, setExpandedIndex] = useState(null);

	const wrap = (index) => wrapIndex(index, photos.length);

	const visiblePhotos = useMemo(
		() =>
			Array.from(
				{ length: Math.min(VISIBLE_THUMBNAILS, photos.length) },
				(_, offset) => {
					const index = wrapIndex(firstVisible + offset, photos.length);
					return { ...photos[index], index };
				},
			),
		[firstVisible, photos],
	);

	const scrollBy = (step) => setFirstVisible((first) => wrap(first + step));

	const stepExpanded = (step) => {
		setExpandedIndex((current) => {
			if (current === null) return null;
			const next = wrap(current + step);
			setFirstVisible(next);
			return next;
		});
	};

	if (photos.length === 0) return null;

	return (
		<>
			<div className="detail-photo-carousel" aria-label={label}>
				<ArrowButton
					direction="previous"
					label="Previous photos"
					onClick={() => scrollBy(-1)}
				/>
				<div className="detail-photo-row">
					{visiblePhotos.map((photo) => (
						<button
							type="button"
							key={photo.src}
							className="detail-photo-card detail-photo-button"
							onClick={() => setExpandedIndex(photo.index)}
							aria-label={`Open ${photo.alt}`}
						>
							<img src={photo.src} alt={photo.alt} className="detail-photo" />
						</button>
					))}
				</div>
				<ArrowButton
					direction="next"
					label="Next photos"
					onClick={() => scrollBy(1)}
				/>
			</div>

			{expandedIndex !== null && (
				<Lightbox
					photo={photos[expandedIndex]}
					onPrevious={() => stepExpanded(-1)}
					onNext={() => stepExpanded(1)}
					onClose={() => setExpandedIndex(null)}
				/>
			)}
		</>
	);
}

export default PhotoCarousel;
