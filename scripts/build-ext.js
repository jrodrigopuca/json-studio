/**
 * Extension build script.
 *
 * Builds the Chrome extension using vite.extension.config.ts.
 * The viewer uses an HTML entry (init.html) so that Vite properly
 * extracts CSS Modules. The HTML file is discarded after the build
 * by the chromeExtensionHtmlPlugin.
 */

import { build } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

async function buildExtension() {
	console.log("Building Chrome extension...");
	await build({
		root,
		configFile: resolve(root, "vite.extension.config.ts"),
		logLevel: "info",
	});
	console.log("Done ✓");
}

buildExtension().catch((err) => {
	console.error("Build failed:", err);
	process.exit(1);
});
