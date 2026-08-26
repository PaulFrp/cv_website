declare module "virtual:pose-assets" {
	export type PoseAsset = {
		pose: string;
		file: string;
		src: string;
	};

	export const POSE_ASSETS: PoseAsset[];
	export const POSE_SRC: Record<string, string>;
	export const POSE_KEYS: string[];
}

declare module "virtual:museum-pose-assets" {
	export type PoseAsset = {
		pose: string;
		file: string;
		src: string;
	};

	export const POSE_ASSETS: PoseAsset[];
	export const POSE_SRC: Record<string, string>;
	export const POSE_KEYS: string[];
}

declare module "virtual:main-pose-assets" {
	export type PoseAsset = {
		pose: string;
		file: string;
		src: string;
	};

	export const POSE_ASSETS: PoseAsset[];
	export const POSE_SRC: Record<string, string>;
	export const POSE_KEYS: string[];
}

declare module "virtual:museum-exhibits" {
	export type MuseumExhibitAsset = {
		kind: "picture" | "pedestal";
		slug: string;
		stand: number;
		file: string;
		src: string;
	};

	export const MUSEUM_EXHIBITS: MuseumExhibitAsset[];
}
