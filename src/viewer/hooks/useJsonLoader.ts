/**
 * Hook to load and parse JSON from URL or Chrome extension message.
 */

import { useEffect } from "react";
import { useStore } from "../store";
import { parseJSON } from "../core/parser";
import { prettyPrint } from "../core/formatter";
import { LARGE_FILE_THRESHOLD } from "@shared/constants";

export function useJsonLoader() {
	const setJson = useStore((s) => s.setJson);
	const setParseError = useStore((s) => s.setParseError);
	const setIsParsing = useStore((s) => s.setIsParsing);
	const hasData = useStore((s) => s.nodes.length > 0 || s.parseError !== null);

	useEffect(() => {
		// Skip if store already has data (loaded by initViewer)
		if (hasData) {
			return;
		}

		const loadJson = async () => {
			setIsParsing(true);

			try {
				// Try to get JSON from URL search params (for development)
				const params = new URLSearchParams(window.location.search);
				const jsonUrl = params.get("url");
				const jsonData = params.get("data");

				let rawJson = "";
				let url = "";

				if (jsonUrl) {
					// Fetch from URL
					const response = await fetch(jsonUrl);
					rawJson = await response.text();
					url = jsonUrl;
				} else if (jsonData) {
					// Inline data (base64 or raw)
					try {
						rawJson = atob(jsonData);
					} catch {
						rawJson = decodeURIComponent(jsonData);
					}
				} else {
					// Check for Chrome extension message
					const stored = sessionStorage.getItem("json-studio-data");
					if (stored) {
						const data = JSON.parse(stored);
						rawJson = data.content;
						url = data.url || "";
						sessionStorage.removeItem("json-studio-data");
					} else {
						// Demo data
						rawJson = JSON.stringify(
							{
								message: "Welcome to JSON Spark!",
								features: [
									"Tree View",
									"Raw View",
									"Table View",
									"Diff View",
									"Search",
								],
								version: "2.0.0",
							},
							null,
							2,
						);
					}
				}

				// Parse the JSON
				const result = parseJSON(rawJson);

				if (result.ok) {
					// Skip prettyPrint for large files — it's expensive and
					// the raw view is hidden in large-file mode anyway.
					const rawSize = new Blob([rawJson]).size;
					const formatted =
						rawSize >= LARGE_FILE_THRESHOLD ? rawJson : prettyPrint(rawJson);
					setJson(formatted, result.nodes, {
						fileSize: rawSize,
						totalKeys: result.totalKeys,
						maxDepth: result.maxDepth,
						url,
					});
				} else {
					setParseError(result.error);
				}
			} catch (error) {
				setParseError({
					message:
						error instanceof Error ? error.message : "Failed to load JSON",
					line: 0,
					column: 0,
					position: 0,
				});
			}
		};

		loadJson();
	}, [setJson, setParseError, setIsParsing, hasData]);
}
