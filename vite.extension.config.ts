import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renameSync, mkdirSync, rmSync, existsSync, unlinkSync } from "node:fs";
import type { OutputAsset, OutputBundle } from "rollup";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Rollup plugin that merges all emitted CSS assets into a single
 * predictable file (assets/style.css).
 *
 * With multi-entry builds, Vite emits separate CSS files per entry.
 * This plugin combines them so the content script can load one file.
 */
function mergeCssPlugin(): Plugin {
	return {
		name: "merge-css",
		enforce: "post",

		generateBundle(_options, bundle: OutputBundle) {
			const cssAssets: string[] = [];
			const cssKeys: string[] = [];

			// Collect all CSS assets from the bundle (these are the
			// ones Vite DID extract — typically from HTML entries and
			// non-module CSS imports)
			for (const [key, chunk] of Object.entries(bundle)) {
				if (
					chunk.type === "asset" &&
					typeof chunk.fileName === "string" &&
					chunk.fileName.endsWith(".css")
				) {
					const source =
						typeof (chunk as OutputAsset).source === "string"
							? ((chunk as OutputAsset).source as string)
							: "";
					if (source.length > 0) {
						cssAssets.push(source);
					}
					cssKeys.push(key);
				}
			}

			if (cssAssets.length === 0) return;

			// Remove all individual CSS assets
			for (const key of cssKeys) {
				delete bundle[key];
			}

			// Emit a single merged CSS asset
			this.emitFile({
				type: "asset",
				fileName: "assets/style.css",
				source: cssAssets.join("\n"),
			});

			// Update HTML files to reference the merged CSS
			for (const chunk of Object.values(bundle)) {
				if (
					chunk.type === "asset" &&
					typeof chunk.fileName === "string" &&
					chunk.fileName.endsWith(".html")
				) {
					const asset = chunk as OutputAsset;
					if (typeof asset.source === "string") {
						asset.source = asset.source.replace(
							/href="[^"]*\.css"/g,
							'href="/assets/style.css"',
						);
					}
				}
			}
		},
	};
}

/**
 * Vite plugin that removes build artifacts and handles HTML relocation if needed.
 *
 * - Removes viewer/init.html (build-only artifact for CSS Module extraction)
 * - Relocates HTML files from dist/src/ to dist/ if Vite places them there
 */
function chromeExtensionHtmlPlugin(): Plugin {
	return {
		name: "chrome-extension-html",
		enforce: "post",
		closeBundle() {
			const dist = resolve(__dirname, "dist");
			const srcDir = resolve(dist, "src");

			console.log("\n🔍 chromeExtensionHtmlPlugin running...");

			// Check if Vite generated HTML files in dist/src/ (older Vite behavior)
			if (existsSync(srcDir)) {
				console.log("   📁 Found dist/src/ - relocating HTML files...");

				const moves: [string, string][] = [
					[
						resolve(srcDir, "viewer/index.html"),
						resolve(dist, "viewer/index.html"),
					],
					[
						resolve(srcDir, "options/options.html"),
						resolve(dist, "options/options.html"),
					],
				];

				for (const [from, to] of moves) {
					if (existsSync(from)) {
						console.log(`   ✅ Moving: ${from} -> ${to}`);
						mkdirSync(resolve(to, ".."), { recursive: true });
						renameSync(from, to);
					}
				}

				// Remove init.html from dist/src/viewer/
				const initInSrc = resolve(srcDir, "viewer/init.html");
				if (existsSync(initInSrc)) {
					console.log(`   🗑️  Removing: ${initInSrc}`);
					unlinkSync(initInSrc);
				}

				// Clean up empty dist/src/
				rmSync(srcDir, { recursive: true, force: true });
			}

			// Remove init.html if it was generated directly in dist/viewer/
			const initInDist = resolve(dist, "viewer/init.html");
			if (existsSync(initInDist)) {
				console.log(`   🗑️  Removing build artifact: ${initInDist}`);
				unlinkSync(initInDist);
			}

			// Log final state
			console.log("\n   📊 Final HTML files:");
			const viewerIndexHtml = resolve(dist, "viewer/index.html");
			const optionsHtml = resolve(dist, "options/options.html");
			console.log(
				`   ${existsSync(viewerIndexHtml) ? "✅" : "❌"} viewer/index.html`,
			);
			console.log(
				`   ${existsSync(optionsHtml) ? "✅" : "❌"} options/options.html`,
			);
			console.log("✅ chromeExtensionHtmlPlugin done\n");
		},
	};
}

/**
 * Vite config for building the Chrome extension.
 *
 * Build with: npm run build:ext
 *
 * Note: publicDir is disabled. The build script (scripts/build-ext.js) manually
 * copies manifest.json and icons/ from public/ to dist/ after Vite builds.
 *
 * The viewer uses an HTML entry (init.html) instead of a direct JS entry.
 * This is required because Vite 7 silently drops CSS Module class name
 * mappings from JS-only entries in multi-entry builds. Using an HTML
 * entry forces proper CSS extraction and preserves class name references
 * in the JavaScript output. The HTML file itself is discarded after the
 * build (see chromeExtensionHtmlPlugin).
 *
 * Produces:
 *   dist/
 *   ├── manifest.json          (copied from public/)
 *   ├── icons/                 (copied from public/icons/)
 *   ├── background/
 *   │   └── service-worker.js  (ES module, MV3 supports type: module)
 *   ├── content/
 *   │   └── detector.js        (self-contained, no top-level imports)
 *   ├── viewer/
 *   │   ├── index.html         (main viewer page, opened on icon click)
 *   │   ├── index.js           (standalone viewer bundle)
 *   │   └── init.js            (ES module, loaded dynamically by content script)
 *   ├── options/
 *   │   ├── options.html
 *   │   └── options.js
 *   ├── chunks/                (shared ES module chunks)
 *   └── assets/
 *       ├── style.css          (all CSS combined)
 *       └── parser.worker-*.js
 */
export default defineConfig({
	plugins: [react(), mergeCssPlugin(), chromeExtensionHtmlPlugin()],
	publicDir: false, // Don't copy public/ automatically; we do it manually in build script
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
		target: "chrome120",
		minify: true,
		sourcemap: false,
		rollupOptions: {
			input: {
				// Background service worker (ES module — MV3 supports "type": "module")
				"background/service-worker": resolve(
					__dirname,
					"src/background/service-worker.ts",
				),
				// Content script (self-contained — no top-level imports)
				"content/detector": resolve(__dirname, "src/content/detector.ts"),
				// Viewer standalone page (opened when clicking extension icon)
				"viewer/index": resolve(__dirname, "src/viewer/index.html"),
				// Viewer init entry — HTML artifact to preserve CSS Module extraction.
				// The HTML is discarded after build; only init.js matters for content script.
				"viewer/init": resolve(__dirname, "src/viewer/init.html"),
				// Options page (HTML entry)
				"options/options": resolve(__dirname, "src/options/options.html"),
			},
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "chunks/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
});
