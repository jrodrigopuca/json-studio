/**
 * Types for communication between the main thread and the parser Web Worker.
 */

import type { FlatNode, ParseError } from "./parser.types";

/** Message sent from main thread → worker. */
export interface WorkerRequest {
	rawJson: string;
	/** Whether to skip prettyPrint (large file mode). */
	skipFormat: boolean;
}

/** Successful result from worker → main thread. */
export interface WorkerSuccessResponse {
	ok: true;
	nodes: FlatNode[];
	formatted: string;
	totalKeys: number;
	maxDepth: number;
}

/** Error result from worker → main thread. */
export interface WorkerErrorResponse {
	ok: false;
	error: ParseError;
}

/** Message sent from worker → main thread. */
export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
