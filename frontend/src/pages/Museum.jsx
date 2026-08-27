import { DevPoseEditor } from "../dev";
import { PixelMuseum } from "../features/museum";

function Museum() {
	return (
		<section className="page museum-page">
			<h1>Project museum</h1>
			<p className="museum-help">
				Walk with WASD or the arrow keys. Get close to a stand to read about a
				project, then press Enter to open it. Press H to toggle the collision
				overlay.
			</p>

			<PixelMuseum />

			<DevPoseEditor
				pageId="museum"
				rootSelector=".museum-page"
				assetSet="museum"
			/>
		</section>
	);
}

export default Museum;
