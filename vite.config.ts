import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@viewer": resolve(__dirname, "src/viewer"),
			"@shared": resolve(__dirname, "src/shared"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				// Chrome extension entry points
				viewer: resolve(__dirname, "src/viewer/index.html"),
				popup: resolve(__dirname, "src/popup/popup.html"),
				options: resolve(__dirname, "src/options/options.html"),
				background: resolve(__dirname, "src/background/service-worker.ts"),
				content: resolve(__dirname, "src/content/detector.ts"),
			},
			output: {
				entryFileNames: "[name]/index.js",
				chunkFileNames: "shared/[name]-[hash].js",
				assetFileNames: (assetInfo) => {
					if (assetInfo.name?.endsWith(".css")) {
						return "[name]/style[extname]";
					}
					return "assets/[name]-[hash][extname]";
				},
			},
		},
	},
	// Dev server for testing viewer
	server: {
		port: 3000,
		open: "/src/viewer/index.html",
	},
});
