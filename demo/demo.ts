/**
 * Demo entrypoint — Loads the JSON Spark viewer with sample data.
 * This file is only used during development, NOT part of the extension.
 */

import { initViewer } from "../src/viewer/init";

// Fixture imports (bundled for demo convenience)
import stripeWebhook from "./fixtures/stripe-webhook.json?raw";
import githubRepo from "./fixtures/github-repo.json?raw";
import clerkUser from "./fixtures/clerk-user.json?raw";
import shopifyProducts from "./fixtures/shopify-products.json?raw";
import packageJson from "./fixtures/package-json.json?raw";
import turboConfig from "./fixtures/turbo-config.json?raw";
import apiError from "./fixtures/api-error.json?raw";
import graphqlResponse from "./fixtures/graphql-response.json?raw";

const FIXTURES: Record<string, string> = {
	"stripe-webhook": stripeWebhook,
	"github-repo": githubRepo,
	"clerk-user": clerkUser,
	"shopify-products": shopifyProducts,
	"package-json": packageJson,
	"turbo-config": turboConfig,
	"api-error": apiError,
	"graphql-minified": graphqlResponse,
};

let cleanup: (() => void) | null = null;
const container = document.getElementById("root");

function loadFixture(name: string): void {
	console.log("[Demo] loadFixture called with:", name);
	if (!container) {
		console.error("[Demo] container not found!");
		return;
	}

	// Cleanup previous viewer
	if (cleanup) {
		console.log("[Demo] Cleaning up previous viewer");
		cleanup();
		cleanup = null;
	}

	const rawJson = FIXTURES[name] ?? "{}";
	console.log("[Demo] Loading JSON, length:", rawJson.length);

	cleanup = initViewer({
		container,
		rawJson,
		contentType: name === "invalid" ? "application/json" : "application/json",
		url: `demo://fixtures/${name}.json`,
	});
}

function loadCustomJson(jsonStr: string): void {
	if (!container) return;

	// Cleanup previous viewer
	if (cleanup) {
		cleanup();
		cleanup = null;
	}

	cleanup = initViewer({
		container,
		rawJson: jsonStr || "{}",
		contentType: "application/json",
		url: "demo://custom.json",
	});
}

// Wire up demo controls
const select = document.getElementById("fixture-select") as HTMLSelectElement;
const reloadBtn = document.getElementById("reload-btn") as HTMLButtonElement;
const customJsonInput = document.getElementById(
	"custom-json",
) as HTMLTextAreaElement;
const loadCustomBtn = document.getElementById(
	"load-custom-btn",
) as HTMLButtonElement;
const demoPanel = document.getElementById("demo-panel");
const demoHeader = document.getElementById("demo-header");
const demoToggle = document.getElementById("demo-toggle");
const themeBtns =
	document.querySelectorAll<HTMLButtonElement>(".demo-theme-btn");

// Fixture select
select?.addEventListener("change", () => {
	console.log("[Demo] Select changed to:", select.value);
	loadFixture(select.value);
});

reloadBtn?.addEventListener("click", () => {
	console.log("[Demo] Load button clicked, select value:", select?.value);
	loadFixture(select?.value ?? "medium");
});

// Custom JSON
loadCustomBtn?.addEventListener("click", () => {
	const customJson = customJsonInput?.value?.trim();
	if (customJson) {
		loadCustomJson(customJson);
	}
});

// Theme switcher
themeBtns.forEach((btn) => {
	btn.addEventListener("click", () => {
		const theme = btn.dataset.theme;
		if (theme) {
			document.documentElement.setAttribute("data-theme", theme);
			themeBtns.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
		}
	});
});

// Collapse/expand panel
demoHeader?.addEventListener("click", () => {
	demoPanel?.classList.toggle("collapsed");
	if (demoToggle) {
		demoToggle.textContent = demoPanel?.classList.contains("collapsed")
			? "▲"
			: "▼";
	}
});

// Initial load
loadFixture(select?.value ?? "github-repo");
