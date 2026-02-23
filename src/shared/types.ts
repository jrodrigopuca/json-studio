/**
 * Shared type definitions used across viewer, popup, options, and background.
 */

/** Supported view modes for the JSON viewer. */
export type ViewMode = "tree" | "raw" | "table";

/** Theme options. */
export type Theme = "dark" | "light" | "system";

/** Resolved theme (after resolving 'system'). */
export type ResolvedTheme = "dark" | "light";

/** Content-type classification for JSON detection. */
export type ContentTypeClass =
	| "application/json"
	| "text/json"
	| "text/plain"
	| "application/ld+json"
	| "unknown"
	| "file";

/** Message types for Chrome extension messaging. */
export type MessageType =
	| "DETECT_JSON"
	| "JSON_DETECTED"
	| "ACTIVATE_VIEWER"
	| "GET_SETTINGS";

/** Message payload sent between extension components. */
export interface ExtensionMessage {
	type: MessageType;
	payload?: unknown;
}

/** JSON detection result from content script to background. */
export interface DetectionResult {
	isJson: boolean;
	contentType: ContentTypeClass;
	rawContent: string;
	url: string;
	size: number;
}

/** User-configurable settings. */
export interface Settings {
	theme: Theme;
	defaultView: ViewMode;
	indentSize: number;
}

/** Default settings. */
export const DEFAULT_SETTINGS: Settings = {
	theme: "system",
	defaultView: "tree",
	indentSize: 2,
};
