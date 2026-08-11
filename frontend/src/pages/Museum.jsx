import PixelMuseum from "../components/PixelMuseum";

function Museum() {
	return (
		<section className="page museum-page">
			<h1>Project museum</h1>
			<p className="museum-help">
				Walk with WASD or arrow keys. Get close to a stand to read about a
				project. Press H to toggle collision/debug overlays if needed.
			</p>
			<PixelMuseum />
		</section>
	);
}

export default Museum;
