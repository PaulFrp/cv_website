import { lazy, Suspense } from "react";

// `import.meta.env.DEV` is inlined at build time, so the editor and its assets
// are dropped from production bundles entirely.
const Editor = import.meta.env.DEV ? lazy(() => import("./DevPoseEditor")) : null;

/** Mounts the pose editor during development and renders nothing in production. */
export function DevPoseEditor(props) {
	if (!Editor) return null;

	return (
		<Suspense fallback={null}>
			<Editor {...props} />
		</Suspense>
	);
}
