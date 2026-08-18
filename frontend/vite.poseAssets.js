import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIRTUAL_ID = "virtual:pose-assets";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

function positionsDir() {
	return path.resolve(__dirname, "public/positions");
}

function fileToPoseKey(fileName) {
	return fileName
		.replace(/^pos_/i, "")
		.replace(/\.png$/i, "")
		.replace(/_/g, "-");
}

function readPoseAssets() {
	const dir = positionsDir();
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter((name) => /\.png$/i.test(name))
		.sort((a, b) => a.localeCompare(b))
		.map((file) => ({
			pose: fileToPoseKey(file),
			file,
			src: `/positions/${file}`,
		}));
}

function manifestModuleSource() {
	const assets = readPoseAssets();
	const srcMap = Object.fromEntries(assets.map((asset) => [asset.pose, asset.src]));
	return `export const POSE_ASSETS = ${JSON.stringify(assets)};
export const POSE_SRC = ${JSON.stringify(srcMap)};
export const POSE_KEYS = POSE_ASSETS.map((asset) => asset.pose);
`;
}

/** Exposes every PNG in public/positions via `virtual:pose-assets`. */
export function poseAssetsPlugin() {
	return {
		name: "pose-assets",
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_ID) return manifestModuleSource();
		},
		configureServer(server) {
			const dir = positionsDir();
			server.watcher.add(dir);

			const refresh = (filePath) => {
				if (!filePath.replace(/\\/g, "/").includes("/positions/")) return;
				const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
				server.ws.send({ type: "full-reload", path: "*" });
			};

			server.watcher.on("add", refresh);
			server.watcher.on("unlink", refresh);
			server.watcher.on("change", refresh);
		},
	};
}
