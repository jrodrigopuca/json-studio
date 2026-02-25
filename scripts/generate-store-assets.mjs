#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const designs = [
	{
		svgPath: "design/chrome-store/promo-small-440x280.svg",
		outputPath: "design/chrome-store/promo-small-440x280.png",
		width: 440,
		height: 280,
	},
	{
		svgPath: "design/chrome-store/promo-large-1400x560.svg",
		outputPath: "design/chrome-store/promo-large-1400x560.png",
		width: 1400,
		height: 560,
	},
];

console.log("🎨 Generating Chrome Web Store promotional images...\n");

for (const design of designs) {
	const svgPath = join(rootDir, design.svgPath);
	const outputPath = join(rootDir, design.outputPath);

	try {
		const svgBuffer = readFileSync(svgPath);

		await sharp(svgBuffer)
			.resize(design.width, design.height)
			.png()
			.toFile(outputPath);

		const stats = await sharp(outputPath).metadata();
		const fileSize = (await import("fs")).statSync(outputPath).size;

		console.log(`✅ ${design.width}×${design.height}: ${outputPath}`);
		console.log(`   Size: ${(fileSize / 1024).toFixed(1)} KB\n`);
	} catch (error) {
		console.error(`❌ Error generating ${design.outputPath}:`, error.message);
		process.exit(1);
	}
}

console.log("✨ All promotional images generated successfully!");
console.log("\n📋 Chrome Web Store requirements:");
console.log("   • Small promo tile: 440×280 ✓");
console.log("   • Large promo tile (marquee): 1400×560 ✓");
console.log("\n📂 Files are ready in: design/chrome-store/");
