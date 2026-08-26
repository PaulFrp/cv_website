import { useEffect, useRef } from "react";

const VIDEO_SRC = `${import.meta.env.BASE_URL}main.mp4`;

/**
 * Looping pixel-art clip behind the intro. Browsers only allow autoplay on
 * muted video, and some ignore the `autoPlay` attribute, so playback is also
 * kicked off from an effect.
 */
function HeroVideo() {
	const videoRef = useRef(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		video.muted = true;
		video.defaultMuted = true;
		video.play().catch(() => {
			// Autoplay was blocked; the poster frame stays visible.
		});
	}, []);

	return (
		<div className="home-stage">
			<video
				ref={videoRef}
				className="home-video"
				src={VIDEO_SRC}
				autoPlay
				muted
				loop
				playsInline
				preload="auto"
				controls={false}
				aria-label="Pixel art character programming at a desk"
			/>
		</div>
	);
}

export default HeroVideo;
