/**
 * Background service worker — Handles extension events.
 *
 * Responsibilities:
 * - Listens for messages from content scripts
 * - Manages extension lifecycle
 * - Handles browser action clicks
 * - Provides "Format JSON in selection" context menu
 *
 * @module service-worker
 */

import { JSON_CONTENT_TYPES } from "../shared/constants.js";

/**
 * Create context menu items on install.
 */
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "json-spark-format-selection",
		title: "Format JSON in selection",
		contexts: ["selection"],
	});
});

/**
 * Handle extension icon clicks — open viewer in new tab.
 */
chrome.action.onClicked.addListener(() => {
	const viewerUrl = chrome.runtime.getURL("viewer/index.html");
	chrome.tabs.create({ url: viewerUrl });
});

/**
 * Handle context menu clicks.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "json-spark-format-selection" && tab?.id) {
		const selectedText = info.selectionText ?? "";
		chrome.tabs
			.sendMessage(tab.id, {
				type: "FORMAT_SELECTION",
				payload: { text: selectedText },
			})
			.catch(() => {
				// Content script not loaded — try executing inline
			});
	}
});

/**
 * Listen for web navigation events to detect JSON content-type
 * via response headers (when possible).
 */
chrome.webNavigation?.onCompleted.addListener((details) => {
	// Only interested in main frame
	if (details.frameId !== 0) return;

	// The content script will handle actual detection
	// This is a secondary signal for content-type based detection
});

/**
 * Handle messages from content scripts and popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "GET_SETTINGS") {
		// Return user settings (from chrome.storage in the future)
		sendResponse({
			theme: "system",
			defaultView: "tree",
			indentSize: 2,
		});
		return true;
	}

	if (message.type === "JSON_DETECTED") {
		// Content script reports JSON was detected
		// Update the extension badge
		if (sender.tab?.id) {
			chrome.action.setBadgeText({
				text: "JSON",
				tabId: sender.tab.id,
			});
			chrome.action.setBadgeBackgroundColor({
				color: "#fbbf24",
				tabId: sender.tab.id,
			});
		}
		return false;
	}

	return false;
});

/**
 * Handle extension icon click when no popup is configured.
 */
chrome.action.onClicked.addListener(async (tab) => {
	if (!tab.id) return;

	// Try to activate the viewer on the current tab
	try {
		await chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_VIEWER" });
	} catch {
		// Content script not loaded on this page
	}
});

/**
 * Check if a content-type header indicates JSON.
 */
export function isJsonContentType(contentType: string): boolean {
	const normalized = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
	return JSON_CONTENT_TYPES.some((ct) => normalized === ct);
}

// Keep the service worker alive
self.addEventListener("install", () => {
	// No-op: just here to register the service worker event
});
