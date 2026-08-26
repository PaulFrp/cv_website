import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { poseAssetsPlugin } from "./vite/poseAssetsPlugin";

export default defineConfig({
	plugins: [react(), poseAssetsPlugin()],
	build: {
		outDir: "dist",
	},
});
