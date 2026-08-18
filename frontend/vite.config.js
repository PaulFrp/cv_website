import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { poseAssetsPlugin } from "./vite.poseAssets.js";

export default defineConfig({
	plugins: [react(), poseAssetsPlugin()],
	build: {
		outDir: "dist",
	},
});
