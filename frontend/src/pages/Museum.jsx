import { lazy, Suspense } from "react";
import { PixelMuseum } from "../features/museum";

const DevPoseEditor = import.meta.env.DEV
	? lazy(() => import("../dev/DevPoseEditor"))
	: null;

function Museum() {
	return (
		<section className="page museum-page">
			<h1>Project museum</h1>
			<p className="museum-help">
				Walk with WASD or arrow keys. Get close to a stand to read about a
				project. Press H to toggle collision/debug overlays if needed.
			</p>
			<PixelMuseum />
			{DevPoseEditor && (
				<Suspense fallback={null}>
					<DevPoseEditor
						pageId="museum"
						rootSelector=".museum-page"
						assetSet="museum"
					/>
				</Suspense>
			)}
		</section>
	);
}

export default Museum;
