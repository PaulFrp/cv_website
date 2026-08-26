import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../public",
);

/** Folders of pixel-art poses, each exposed as its own virtual module. */
const POSE_FOLDERS = [
	{ id: "virtual:pose-assets", dir: "positions" },
	{ id: "virtual:museum-pose-assets", dir: "museum/bg_char" },
	{ id: "virtual:main-pose-assets", dir: "main_positions" },
];

/** Museum exhibit art, split by how it is displayed in the gallery. */
const EXHIBIT_FOLDERS = [
	{ kind: "picture", dir: "museum/projects/pictures" },
	{ kind: "pedestal", dir: "museum/projects/pedestal" },
];

const EXHIBITS_MODULE_ID = "virtual:museum-exhibits";

/** Exhibit files are named `<project-slug>_<stand-number>.png`. */
const EXHIBIT_FILE = /^(.*)_(\d+)\.png$/i;

function listPngs(relativeDir) {
	const dir = path.join(PUBLIC_DIR, relativeDir);
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter((name) => /\.png$/i.test(name))
		.sort((a, b) => a.localeCompare(b));
}

/** `pos_wall_right.png` → `wall-right` */
function poseKey(file) {
	return file
		.replace(/^pos_/i, "")
		.replace(/\.png$/i, "")
		.replace(/_/g, "-");
}

function posesModuleSource(relativeDir) {
	const assets = listPngs(relativeDir).map((file) => ({
		pose: poseKey(file),
		file,
		src: `/${relativeDir}/${file}`,
	}));
	const byPose = Object.fromEntries(assets.map((asset) => [asset.pose, asset.src]));

	return [
		`export const POSE_ASSETS = ${JSON.stringify(assets)};`,
		`export const POSE_SRC = ${JSON.stringify(byPose)};`,
		"export const POSE_KEYS = POSE_ASSETS.map((asset) => asset.pose);",
		"",
	].join("\n");
}

function exhibitsModuleSource() {
	const assets = EXHIBIT_FOLDERS.flatMap(({ kind, dir }) =>
		listPngs(dir).flatMap((file) => {
			const match = file.match(EXHIBIT_FILE);
			if (!match) return [];

			return [
				{
					kind,
					slug: match[1],
					stand: Number(match[2]),
					file,
					src: `/${dir}/${file}`,
				},
			];
		}),
	);

	return `export const MUSEUM_EXHIBITS = ${JSON.stringify(assets)};\n`;
}

const VIRTUAL_MODULES = [
	...POSE_FOLDERS.map(({ id, dir }) => ({
		id,
		dirs: [dir],
		source: () => posesModuleSource(dir),
	})),
	{
		id: EXHIBITS_MODULE_ID,
		dirs: EXHIBIT_FOLDERS.map((folder) => folder.dir),
		source: exhibitsModuleSource,
	},
];

const resolvedId = (id) => `\0${id}`;
const toPosix = (filePath) => filePath.replace(/\\/g, "/");

/**
 * Turns folders of PNGs under `public/` into importable manifests, so adding
 * artwork never needs a matching code change. Dropping a file into one of the
 * folders below regenerates its module and reloads the dev server.
 */
export function poseAssetsPlugin() {
	const byId = new Map(VIRTUAL_MODULES.map((module) => [module.id, module]));
	const byResolvedId = new Map(
		VIRTUAL_MODULES.map((module) => [resolvedId(module.id), module]),
	);

	return {
		name: "pose-assets",

		resolveId(id) {
			return byId.has(id) ? resolvedId(id) : undefined;
		},

		load(id) {
			return byResolvedId.get(id)?.source();
		},

		configureServer(server) {
			const watched = VIRTUAL_MODULES.map((module) => ({
				module,
				dirs: module.dirs.map((dir) => toPosix(path.join(PUBLIC_DIR, dir))),
			}));

			for (const { dirs } of watched) {
				for (const dir of dirs) server.watcher.add(dir);
			}

			const onAssetChange = (filePath) => {
				const changed = toPosix(filePath);
				const match = watched.find(({ dirs }) =>
					dirs.some((dir) => changed.startsWith(dir)),
				);
				if (!match) return;

				const cached = server.moduleGraph.getModuleById(
					resolvedId(match.module.id),
				);
				if (cached) server.moduleGraph.invalidateModule(cached);
				server.ws.send({ type: "full-reload", path: "*" });
			};

			for (const event of ["add", "unlink", "change"]) {
				server.watcher.on(event, onAssetChange);
			}
		},
	};
}
