/**
 * Standalone viewer page loader.
 * Handles loading JSON from chrome.storage when opened from popup.
 */

import { useEffect } from "react";
import { useStore } from "../store";
import { parseJSON } from "../core/parser";
import { prettyPrint } from "../core/formatter";

/**
 * Hook to load JSON from chrome.storage.session when URL contains temp key.
 */
export function usePopupJsonLoader() {
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tempKey = params.get("temp");

		if (!tempKey) return;

		// Load from chrome.storage.session
		chrome.storage.session.get(tempKey, (result) => {
			const jsonText = result[tempKey];

			if (!jsonText || typeof jsonText !== "string") {
				console.error("No JSON found in storage for key:", tempKey);
				return;
			}

			// Clear from storage
			chrome.storage.session.remove(tempKey);

			// Load into store
			const store = useStore.getState();
			const parseResult = parseJSON(jsonText);

			if (parseResult.ok) {
				const formatted = prettyPrint(jsonText);
				store.setJson(formatted, parseResult.nodes, {
					fileSize: new Blob([formatted]).size,
					totalKeys: parseResult.totalKeys,
					maxDepth: parseResult.maxDepth,
					url: "extension://popup",
					contentType: "application/json",
				});
			} else {
				store.setParseError(parseResult.error, jsonText);
			}
		});
	}, []);
}
