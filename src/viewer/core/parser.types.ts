/**
 * Types for the JSON parser module.
 */

/** Type of a JSON node. */
export type JsonNodeType =
	| "object"
	| "array"
	| "string"
	| "number"
	| "boolean"
	| "null";

/**
 * A flattened tree node optimised for virtualised rendering.
 * Instead of a recursive tree, the parser outputs a flat array
 * where depth and parent relationships are encoded as indices.
 */
export interface FlatNode {
	/** Unique sequential ID. */
	id: number;
	/** Property key (null for array items and root). */
	key: string | null;
	/** The raw value for primitives, or null for objects/arrays. */
	value: string | number | boolean | null;
	/** Node type. */
	type: JsonNodeType;
	/** Nesting depth (0 = root). */
	depth: number;
	/** Parent node ID (-1 for root). */
	parentId: number;
	/** Whether this node is expandable (object or array). */
	isExpandable: boolean;
	/** Number of direct children (for objects/arrays). */
	childCount: number;
	/** Index range of children in the flat array [start, end). */
	childrenRange: [number, number] | null;
	/** JSONPath to this node. */
	path: string;
}

/** Detailed parse error with location. */
export interface ParseError {
	message: string;
	line: number;
	column: number;
	position: number;
}

/** Result of parsing: either success or error. */
export type ParseResult =
	| { ok: true; nodes: FlatNode[]; totalKeys: number; maxDepth: number }
	| { ok: false; error: ParseError };

/** Options for the parser. */
export interface ParseOptions {
	/** Maximum depth to parse (-1 for unlimited). Default: -1. */
	maxDepth?: number;
}
