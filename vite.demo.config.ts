import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Vite config for the demo/preview page.
 * Allows developing the viewer without loading as a Chrome extension.
 */
export default defineConfig({
	root: "demo",
	resolve: {
		alias: {
			"@viewer": resolve(__dirname, "src/viewer"),
			"@shared": resolve(__dirname, "src/shared"),
		},
	},
	server: {
		port: 5173,
		open: true,
	},
	build: {
		outDir: resolve(__dirname, "dist-demo"),
	},
});
