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
