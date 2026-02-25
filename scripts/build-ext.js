/**
 * Extension build script.
 *
 * Builds the Chrome extension using vite.extension.config.ts.
 * Then copies public/ assets (manifest.json, icons) to dist/.
 */

import { build } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cpSync, existsSync, readdirSync, statSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function listDistContents() {
	const dist = resolve(root, "dist");
	if (!existsSync(dist)) {
		console.log("❌ dist/ does not exist");
		return;
	}

	console.log("\n📁 dist/ structure:");
	function listDir(dir, prefix = "") {
		const items = readdirSync(dir);
		for (const item of items) {
			const fullPath = resolve(dir, item);
			const stats = statSync(fullPath);
			if (stats.isDirectory()) {
				console.log(`${prefix}📁 ${item}/`);
				if (item !== "chunks" && item !== "assets" && item !== "node_modules") {
					listDir(fullPath, prefix + "  ");
				}
			} else if (item.endsWith(".html") || item === "manifest.json") {
				console.log(`${prefix}📄 ${item}`);
			}
		}
	}
	listDir(dist);
}

async function buildExtension() {
	console.log("🔨 Building Chrome extension...");
	await build({
		root,
		configFile: resolve(root, "vite.extension.config.ts"),
		logLevel: "info",
	});

	console.log("\n📦 Copying public assets...");

	// Copy manifest.json
	const manifestSrc = resolve(root, "public/manifest.json");
	const manifestDest = resolve(root, "dist/manifest.json");
	if (existsSync(manifestSrc)) {
		cpSync(manifestSrc, manifestDest);
		console.log("  ✅ manifest.json");
	}

	// Copy icons/
	const iconsSrc = resolve(root, "public/icons");
	const iconsDest = resolve(root, "dist/icons");
	if (existsSync(iconsSrc)) {
		cpSync(iconsSrc, iconsDest, {
			recursive: true,
			filter: (src) => !src.endsWith(".svg"),
		});
		console.log("  ✅ icons/ (PNG only)");
	}

	// Debug: list what was built
	listDistContents();

	console.log("\n✅ Build complete!");
}

buildExtension().catch((err) => {
	console.error("❌ Build failed:", err);
	process.exit(1);
});
