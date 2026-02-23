/**
 * Demo entrypoint — Loads the JSON Spark viewer with sample data.
 * This file is only used during development, NOT part of the extension.
 */

import { initViewer } from "../src/viewer/init";

// Fixture imports (bundled for demo convenience)
import smallJson from "./fixtures/small.json?raw";
import mediumJson from "./fixtures/medium.json?raw";
import nestedDeepJson from "./fixtures/nested-deep.json?raw";
import arrayOfObjectsJson from "./fixtures/array-of-objects.json?raw";
import withUrlsJson from "./fixtures/with-urls.json?raw";
import invalidJson from "./fixtures/invalid.json?raw";
import minifiedJson from "./fixtures/minified.json?raw";

const FIXTURES: Record<string, string> = {
	small: smallJson,
	medium: mediumJson,
	"nested-deep": nestedDeepJson,
	"array-of-objects": arrayOfObjectsJson,
	"with-urls": withUrlsJson,
	invalid: invalidJson,
	minified: minifiedJson,
};

let cleanup: (() => void) | null = null;
const container = document.getElementById("root");

function loadFixture(name: string): void {
	if (!container) return;

	// Cleanup previous viewer
	if (cleanup) {
		cleanup();
		cleanup = null;
	}

	const rawJson = FIXTURES[name] ?? "{}";

	cleanup = initViewer({
		container,
		rawJson,
		contentType: name === "invalid" ? "application/json" : "application/json",
		url: `demo://fixtures/${name}.json`,
	});
}

// Wire up demo controls
const select = document.getElementById("fixture-select") as HTMLSelectElement;
const reloadBtn = document.getElementById("reload-btn") as HTMLButtonElement;

select?.addEventListener("change", () => {
	loadFixture(select.value);
});

reloadBtn?.addEventListener("click", () => {
	loadFixture(select?.value ?? "medium");
});

// Initial load
loadFixture(select?.value ?? "medium");
