/**
 * Shared constants used across the extension.
 */

/** Extension name. */
export const APP_NAME = "JSON Spark";

/** Size threshold (bytes) for delegating parse to Web Worker. */
export const WORKER_THRESHOLD = 1_048_576; // 1MB

/** Size threshold (bytes) for activating Large File Mode. */
export const LARGE_FILE_THRESHOLD = 1_048_576; // 1MB

/** Size threshold (bytes) for warning before opening Edit/Diff views. */
export const HEAVY_VIEW_THRESHOLD = 204_800; // 200KB

/** Default indent size for pretty printing. */
export const DEFAULT_INDENT = 2;

/** Maximum depth for tree rendering before virtual scrolling kicks in. */
export const MAX_VISIBLE_NODES = 500;

/** CSS class prefix for scoped styling. */
export const CSS_PREFIX = "js";

/** JSON content-type patterns for detection. */
export const JSON_CONTENT_TYPES = [
	"application/json",
	"text/json",
	"application/ld+json",
	"application/vnd.api+json",
	"application/hal+json",
	"application/problem+json",
] as const;

/** JSONP callback pattern. */
export const JSONP_PATTERN = /^[\w$.]+\s*\(\s*([\s\S]*?)\s*\);?\s*$/;

/** Node height in pixels (for tree virtualisation). */
export const NODE_HEIGHT = 24;

/** Line height in pixels (for raw-view virtualisation). */
export const RAW_LINE_HEIGHT = 21;

/** Keyboard shortcut definitions. */
export const SHORTCUTS = {
	SEARCH: { key: "f", ctrl: true },
	EXPAND_ALL: { key: "F", ctrl: true, shift: true },
	COLLAPSE_ALL: { key: "C", ctrl: true, shift: true },
	COPY_VALUE: { key: "c", ctrl: true },
	COPY_PATH: { key: "P", ctrl: true, shift: true },
} as const;
