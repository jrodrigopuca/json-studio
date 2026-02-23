import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@viewer": path.resolve(__dirname, "src/viewer"),
			"@shared": path.resolve(__dirname, "src/shared"),
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
		globals: false,
	},
});
