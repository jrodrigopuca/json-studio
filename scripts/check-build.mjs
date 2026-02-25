#!/usr/bin/env node

/**
 * Debug script to check build output
 */

import { existsSync, readdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "../dist");

function listDir(dir, prefix = "") {
	if (!existsSync(dir)) {
		console.log(`${prefix}❌ Not found: ${dir}`);
		return;
	}

	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = resolve(dir, item);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			console.log(`${prefix}📁 ${item}/`);
			listDir(fullPath, prefix + "  ");
		} else {
			const size = (stats.size / 1024).toFixed(2);
			console.log(`${prefix}📄 ${item} (${size} KB)`);
		}
	}
}

console.log("🔍 Checking dist structure:\n");
listDir(dist);

console.log("\n📋 Checking specific files:");
const files = [
	"dist/manifest.json",
	"dist/viewer/index.html",
	"dist/viewer/init.html",
	"dist/viewer/index.js",
	"dist/viewer/init.js",
	"dist/options/options.html",
	"dist/src/viewer/index.html",
	"dist/src/viewer/init.html",
];

for (const file of files) {
	const fullPath = resolve(__dirname, "..", file);
	const exists = existsSync(fullPath);
	console.log(`${exists ? "✅" : "❌"} ${file}`);
}
