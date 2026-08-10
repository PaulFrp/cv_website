import PixelMuseum from "../components/PixelMuseum";

function Museum() {
	return (
		<section className="page museum-page">
			<h1>Project museum</h1>
			<p className="museum-help">
				Walk with WASD or arrow keys. Get close to an exhibit to read a short
				project description.
			</p>
			<PixelMuseum />
		</section>
	);
}

export default Museum;
