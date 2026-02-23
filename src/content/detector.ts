/**
 * Content script — Detects JSON content and activates the viewer.
 *
 * Runs on every page at document_end. Checks if the page contains raw JSON
 * and if so, replaces the page content with the JSON Spark viewer.
 *
 * @module detector
 */

import { JSONP_PATTERN } from "../shared/constants.js";
import type { ContentTypeClass } from "../shared/types.js";

/**
 * Main detection logic. Runs immediately on script load.
 */
function detect(): void {
	const body = document.body;
	if (!body) return;

	// Check if this is a Chrome extension page, devtools, etc.
	if (isExcludedPage()) return;

	// Get content type from the pre-rendered meta or header
	const contentType = detectContentType();

	// Get the raw text content
	const rawText = extractRawText(body);
	if (!rawText) return;

	// Try to determine if this is JSON
	const jsonContent = extractJson(rawText, contentType);
	if (!jsonContent) return;

	// Activate the viewer
	activateViewer(jsonContent.raw, jsonContent.contentType);
}

/**
 * Determines the content-type classification.
 */
function detectContentType(): ContentTypeClass {
	// Check the URL for .json extension
	const url = window.location.href;
	if (url.endsWith(".json") || url.match(/\.json[?#]/)) {
		return "application/json";
	}

	// file:// protocol with JSON content
	if (window.location.protocol === "file:") {
		return "file";
	}

	// For http(s) URLs, we can't directly access the response headers from
	// a content script. We rely on the browser rendering raw JSON as a <pre>
	// element (which Chrome does for application/json responses).
	return "unknown";
}

/**
 * Extracts raw text from the page body.
 * Browsers typically render raw JSON inside a <pre> tag.
 */
function extractRawText(body: HTMLElement): string | null {
	// Chrome renders raw JSON/text responses as: <body><pre>content</pre></body>
	const pre = body.querySelector("pre");

	// Check for the simple indicator: body has ONLY a <pre> child
	if (pre && body.childNodes.length === 1) {
		return pre.textContent;
	}

	// Some browsers may render it differently
	if (body.children.length === 0 && body.textContent?.trim()) {
		return body.textContent;
	}

	return null;
}

/**
 * Attempts to extract valid JSON from the raw text.
 */
function extractJson(
	rawText: string,
	contentType: ContentTypeClass,
): { raw: string; contentType: ContentTypeClass } | null {
	const trimmed = rawText.trim();

	// Check for JSONP wrapper
	const jsonpMatch = trimmed.match(JSONP_PATTERN);
	if (jsonpMatch?.[1]) {
		const inner = jsonpMatch[1];
		if (isValidJson(inner)) {
			return {
				raw: inner,
				contentType:
					contentType === "unknown" ? "application/json" : contentType,
			};
		}
	}

	// Direct JSON check
	if (isValidJson(trimmed)) {
		return { raw: trimmed, contentType };
	}

	// If content-type suggests JSON, try harder
	if (contentType !== "unknown") {
		return { raw: trimmed, contentType };
	}

	return null;
}

/**
 * Quick check if a string is valid JSON.
 */
function isValidJson(str: string): boolean {
	const firstChar = str[0];
	// JSON must start with {, [, ", or a digit, or true/false/null
	if (
		firstChar !== "{" &&
		firstChar !== "[" &&
		firstChar !== '"' &&
		firstChar !== "t" &&
		firstChar !== "f" &&
		firstChar !== "n" &&
		firstChar !== "-" &&
		!(firstChar && firstChar >= "0" && firstChar <= "9")
	) {
		return false;
	}

	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}

/**
 * Checks if this page should be excluded from detection.
 */
function isExcludedPage(): boolean {
	const url = window.location.href;

	// Skip Chrome internal pages
	if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
		return true;
	}

	// Skip if json-spark viewer is already active
	if (document.querySelector(".js-app")) {
		return true;
	}

	// Skip pages with substantial HTML structure
	if (document.querySelector("header, nav, footer, main, article")) {
		return true;
	}

	return false;
}

/**
 * Replaces the page content with the JSON Spark viewer.
 */
async function activateViewer(
	rawJson: string,
	contentType: ContentTypeClass,
): Promise<void> {
	// Dynamically import the viewer (lazy loaded)
	const { initViewer } = await import("../viewer/app.js");

	// Replace page content
	document.title = `JSON Spark — ${document.title || window.location.pathname}`;

	// Clear the body and create the viewer container
	const container = document.createElement("div");
	document.body.innerHTML = "";
	document.body.appendChild(container);

	// Initialize the viewer
	initViewer({
		container,
		rawJson,
		contentType,
		url: window.location.href,
	});
}

// Run detection
detect();

// Listen for messages from background script
chrome.runtime?.onMessage?.addListener((message, _sender, _sendResponse) => {
	if (message.type === "FORMAT_SELECTION") {
		const text = message.payload?.text ?? "";
		if (text) {
			formatSelectionAsJson(text);
		}
	}
	return false;
});

/**
 * Attempts to format selected text as JSON and show it in a floating panel.
 */
function formatSelectionAsJson(text: string): void {
	try {
		const parsed = JSON.parse(text);
		const formatted = JSON.stringify(parsed, null, 2);

		// Create a floating panel with the formatted JSON
		const existing = document.getElementById("json-spark-format-panel");
		if (existing) existing.remove();

		const panel = document.createElement("div");
		panel.id = "json-spark-format-panel";
		panel.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			max-width: 80vw;
			max-height: 80vh;
			overflow: auto;
			background: #1e293b;
			color: #f1f5f9;
			padding: 16px;
			border-radius: 8px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
			z-index: 999999;
			font-family: "SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace;
			font-size: 13px;
			white-space: pre;
			tab-size: 2;
		`;

		const closeBtn = document.createElement("button");
		closeBtn.textContent = "✕ Close";
		closeBtn.style.cssText = `
			position: sticky;
			top: 0;
			float: right;
			background: #334155;
			color: #f1f5f9;
			border: none;
			padding: 4px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			margin-bottom: 8px;
		`;
		closeBtn.addEventListener("click", () => panel.remove());

		const copyBtn = document.createElement("button");
		copyBtn.textContent = "📋 Copy";
		copyBtn.style.cssText = `
			position: sticky;
			top: 0;
			float: right;
			background: #334155;
			color: #f1f5f9;
			border: none;
			padding: 4px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			margin-bottom: 8px;
			margin-right: 4px;
		`;
		copyBtn.addEventListener("click", () => {
			navigator.clipboard.writeText(formatted);
			copyBtn.textContent = "✓ Copied!";
			setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
		});

		const pre = document.createElement("pre");
		pre.textContent = formatted;
		pre.style.margin = "0";

		panel.appendChild(closeBtn);
		panel.appendChild(copyBtn);
		panel.appendChild(pre);
		document.body.appendChild(panel);

		// Close on Escape
		const onEscape = (e: KeyboardEvent): void => {
			if (e.key === "Escape") {
				panel.remove();
				document.removeEventListener("keydown", onEscape);
			}
		};
		document.addEventListener("keydown", onEscape);
	} catch {
		// Not valid JSON — silently ignore
	}
}
