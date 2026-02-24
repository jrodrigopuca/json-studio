/**
 * Web Worker for parsing large JSON files off the main thread.
 *
 * Receives raw JSON string, runs JSON.parse + flatten + optional prettyPrint,
 * and posts back the result. This keeps the main thread responsive during
 * heavy parsing operations.
 *
 * @module parser.worker
 */

import { parseJSON } from "./parser";
import { prettyPrint } from "./formatter";
import type { WorkerRequest, WorkerResponse } from "./parser.worker.types";

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const { rawJson, skipFormat } = event.data;

	try {
		const result = parseJSON(rawJson);

		if (result.ok) {
			const formatted = skipFormat ? rawJson : prettyPrint(rawJson);

			const response: WorkerResponse = {
				ok: true,
				nodes: result.nodes,
				formatted,
				totalKeys: result.totalKeys,
				maxDepth: result.maxDepth,
			};

			self.postMessage(response);
		} else {
			const response: WorkerResponse = {
				ok: false,
				error: result.error,
			};

			self.postMessage(response);
		}
	} catch (err) {
		const response: WorkerResponse = {
			ok: false,
			error: {
				message: err instanceof Error ? err.message : "Worker parsing failed",
				line: 0,
				column: 0,
				position: 0,
			},
		};

		self.postMessage(response);
	}
};
