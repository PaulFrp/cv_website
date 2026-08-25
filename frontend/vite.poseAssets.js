import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_VIRTUAL_ID = "virtual:pose-assets";
const PROJECT_RESOLVED_VIRTUAL_ID = `\0${PROJECT_VIRTUAL_ID}`;
const MUSEUM_VIRTUAL_ID = "virtual:museum-pose-assets";
const MUSEUM_RESOLVED_VIRTUAL_ID = `\0${MUSEUM_VIRTUAL_ID}`;
const EXHIBITS_VIRTUAL_ID = "virtual:museum-exhibits";
const EXHIBITS_RESOLVED_VIRTUAL_ID = `\0${EXHIBITS_VIRTUAL_ID}`;

function projectPositionsDir() {
	return path.resolve(__dirname, "public/positions");
}

function museumPositionsDir() {
	return path.resolve(__dirname, "public/museum/bg_char");
}

function exhibitFolders() {
	return [
		{
			kind: "picture",
			dir: path.resolve(__dirname, "public/museum/projects/pictures"),
			prefix: "/museum/projects/pictures",
		},
		{
			kind: "pedestal",
			dir: path.resolve(__dirname, "public/museum/projects/pedestal"),
			prefix: "/museum/projects/pedestal",
		},
	];
}

function readExhibitAssets() {
	const assets = [];
	for (const { kind, dir, prefix } of exhibitFolders()) {
		if (!fs.existsSync(dir)) continue;
		for (const file of fs
			.readdirSync(dir)
			.filter((name) => /\.png$/i.test(name))
			.sort((a, b) => a.localeCompare(b))) {
			const match = file.match(/^(.*)_(\d+)\.png$/i);
			if (!match) continue;
			assets.push({
				kind,
				slug: match[1],
				stand: Number(match[2]),
				file,
				src: `${prefix}/${file}`,
			});
		}
	}
	return assets;
}

function exhibitsModuleSource() {
	return `export const MUSEUM_EXHIBITS = ${JSON.stringify(readExhibitAssets())};
`;
}

function fileToPoseKey(fileName) {
	return fileName
		.replace(/^pos_/i, "")
		.replace(/\.png$/i, "")
		.replace(/_/g, "-");
}

function readPoseAssets(dir, srcPrefix) {
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter((name) => /\.png$/i.test(name))
		.sort((a, b) => a.localeCompare(b))
		.map((file) => ({
			pose: fileToPoseKey(file),
			file,
			src: `${srcPrefix}/${file}`,
		}));
}

function manifestModuleSource(dir, srcPrefix) {
	const assets = readPoseAssets(dir, srcPrefix);
	const srcMap = Object.fromEntries(assets.map((asset) => [asset.pose, asset.src]));
	return `export const POSE_ASSETS = ${JSON.stringify(assets)};
export const POSE_SRC = ${JSON.stringify(srcMap)};
export const POSE_KEYS = POSE_ASSETS.map((asset) => asset.pose);
`;
}

function invalidateModule(server, resolvedId) {
	const mod = server.moduleGraph.getModuleById(resolvedId);
	if (mod) {
		server.moduleGraph.invalidateModule(mod);
	}
	server.ws.send({ type: "full-reload", path: "*" });
}

function isUnderDir(filePath, dir) {
	const normalizedFilePath = filePath.replace(/\\/g, "/");
	const normalizedDir = dir.replace(/\\/g, "/");
	return normalizedFilePath.startsWith(normalizedDir);
}

/** Exposes every PNG in public/positions and public/museum/bg_char via virtual modules. */
export function poseAssetsPlugin() {
	return {
		name: "pose-assets",
		resolveId(id) {
			if (id === PROJECT_VIRTUAL_ID) return PROJECT_RESOLVED_VIRTUAL_ID;
			if (id === MUSEUM_VIRTUAL_ID) return MUSEUM_RESOLVED_VIRTUAL_ID;
			if (id === EXHIBITS_VIRTUAL_ID) return EXHIBITS_RESOLVED_VIRTUAL_ID;
		},
		load(id) {
			if (id === PROJECT_RESOLVED_VIRTUAL_ID) {
				return manifestModuleSource(projectPositionsDir(), "/positions");
			}
			if (id === MUSEUM_RESOLVED_VIRTUAL_ID) {
				return manifestModuleSource(museumPositionsDir(), "/museum/bg_char");
			}
			if (id === EXHIBITS_RESOLVED_VIRTUAL_ID) {
				return exhibitsModuleSource();
			}
		},
		configureServer(server) {
			const projectDir = projectPositionsDir();
			const museumDir = museumPositionsDir();
			const exhibitDirs = exhibitFolders().map((folder) => folder.dir);
			server.watcher.add(projectDir);
			server.watcher.add(museumDir);
			for (const dir of exhibitDirs) server.watcher.add(dir);

			const refresh = (filePath) => {
				if (isUnderDir(filePath, projectDir)) {
					invalidateModule(server, PROJECT_RESOLVED_VIRTUAL_ID);
					return;
				}
				if (isUnderDir(filePath, museumDir)) {
					invalidateModule(server, MUSEUM_RESOLVED_VIRTUAL_ID);
					return;
				}
				if (exhibitDirs.some((dir) => isUnderDir(filePath, dir))) {
					invalidateModule(server, EXHIBITS_RESOLVED_VIRTUAL_ID);
				}
			};

			server.watcher.on("add", refresh);
			server.watcher.on("unlink", refresh);
			server.watcher.on("change", refresh);
		},
	};
}
