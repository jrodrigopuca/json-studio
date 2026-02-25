#!/usr/bin/env node
import { readdirSync, statSync } from "fs";
import { join } from "path";

function listFiles(dir, prefix = "") {
	const entries = readdirSync(dir);
	entries.sort().forEach((entry) => {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			console.log(`${prefix}${entry}/`);
			listFiles(fullPath, prefix + "  ");
		} else {
			console.log(`${prefix}${entry}`);
		}
	});
}

console.log("dist/");
listFiles("dist", "  ");
