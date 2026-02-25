#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";

console.log("🧹 Cleaning dist...");
if (existsSync("dist")) {
	rmSync("dist", { recursive: true, force: true });
}

console.log("🔨 Running build:ext...");
try {
	const output = execSync("npm run build:ext", {
		encoding: "utf-8",
		stdio: "inherit",
	});
} catch (error) {
	console.error("Build failed:", error.message);
	process.exit(1);
}

console.log("\n✅ Build complete!");
