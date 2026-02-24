/**
 * Hook to load and parse JSON from URL or Chrome extension message.
 *
 * For files >= WORKER_THRESHOLD (1 MB) the heavy work (JSON.parse + flatten +
 * prettyPrint) is delegated to a Web Worker so the main thread stays
 * responsive and the loading spinner keeps animating.
 */

import { useEffect } from "react";
import { useStore } from "../store";
import { parseJSON } from "../core/parser";
import { prettyPrint } from "../core/formatter";
import { LARGE_FILE_THRESHOLD, WORKER_THRESHOLD } from "@shared/constants";
import type {
	WorkerRequest,
	WorkerResponse,
} from "../core/parser.worker.types";

/**
 * Parse + format on the main thread (small files).
 */
function parseOnMainThread(
	rawJson: string,
	rawSize: number,
	url: string,
	setJson: ReturnType<typeof useStore.getState>["setJson"],
	setParseError: ReturnType<typeof useStore.getState>["setParseError"],
) {
	const result = parseJSON(rawJson);

	if (result.ok) {
		const formatted =
			rawSize >= LARGE_FILE_THRESHOLD ? rawJson : prettyPrint(rawJson);
		setJson(formatted, result.nodes, {
			fileSize: rawSize,
			totalKeys: result.totalKeys,
			maxDepth: result.maxDepth,
			url,
		});
	} else {
		setParseError(result.error, rawJson);
	}
}

/**
 * Delegate parse + format to a Web Worker (large files).
 * Returns a cleanup function that terminates the worker.
 */
function parseInWorker(
	rawJson: string,
	rawSize: number,
	url: string,
	setJson: ReturnType<typeof useStore.getState>["setJson"],
	setParseError: ReturnType<typeof useStore.getState>["setParseError"],
): () => void {
	const worker = new Worker(
		new URL("../core/parser.worker.ts", import.meta.url),
		{ type: "module" },
	);

	worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
		const result = event.data;

		if (result.ok) {
			setJson(result.formatted, result.nodes, {
				fileSize: rawSize,
				totalKeys: result.totalKeys,
				maxDepth: result.maxDepth,
				url,
			});
		} else {
			setParseError(result.error, rawJson);
		}

		worker.terminate();
	};

	worker.onerror = (err) => {
		setParseError(
			{
				message: err.message || "Worker error",
				line: 0,
				column: 0,
				position: 0,
			},
			rawJson,
		);
		worker.terminate();
	};

	const request: WorkerRequest = {
		rawJson,
		skipFormat: rawSize >= LARGE_FILE_THRESHOLD,
	};

	worker.postMessage(request);

	return () => worker.terminate();
}

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

		let workerCleanup: (() => void) | null = null;

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

				const rawSize = new Blob([rawJson]).size;

				if (rawSize >= WORKER_THRESHOLD) {
					// Large file → off-main-thread parsing
					workerCleanup = parseInWorker(
						rawJson,
						rawSize,
						url,
						setJson,
						setParseError,
					);
				} else {
					// Small file → parse synchronously on main thread
					parseOnMainThread(rawJson, rawSize, url, setJson, setParseError);
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

		// Cleanup: terminate worker if component unmounts mid-parse
		return () => {
			workerCleanup?.();
		};
	}, [setJson, setParseError, setIsParsing, hasData]);
}
