/**
 * Web Worker for parsing large JSON files off the main thread.
 * Receives raw JSON string, returns flat node array.
 *
 * @module worker
 */

import { parseJSON } from "./parser.js";
import type { ParseOptions } from "./parser.types.js";

interface WorkerMessage {
	type: "PARSE";
	raw: string;
	options?: ParseOptions;
}

self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
	const { type, raw, options } = event.data;

	if (type === "PARSE") {
		const result = parseJSON(raw, options);
		self.postMessage(result);
	}
});
