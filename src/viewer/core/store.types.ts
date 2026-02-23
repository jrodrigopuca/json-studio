/**
 * Types for the viewer's global state and store.
 */

import type {
	ViewMode,
	ResolvedTheme,
	ContentTypeClass,
} from "../../shared/types.js";
import type { FlatNode, ParseError } from "./parser.types.js";

/** A saved bookmark for a JSON path. */
export interface Bookmark {
	/** Unique ID. */
	id: string;
	/** JSONPath. */
	path: string;
	/** Display label (key name or custom). */
	label: string;
	/** Node ID for navigation. */
	nodeId: number;
}

/** Full application state. */
export interface AppState {
	/** The raw JSON string. */
	rawJson: string;
	/** Flattened tree nodes for virtualised rendering. */
	nodes: FlatNode[];
	/** Parse error if JSON is invalid. */
	parseError: ParseError | null;
	/** Whether the JSON was successfully parsed. */
	isValid: boolean;
	/** Current view mode. */
	viewMode: ViewMode;
	/** Resolved theme. */
	theme: ResolvedTheme;
	/** Content-type classification. */
	contentType: ContentTypeClass;
	/** Source URL. */
	url: string;
	/** Set of expanded node IDs. */
	expandedNodes: Set<number>;
	/** Currently selected node ID. */
	selectedNodeId: number | null;
	/** Search query string. */
	searchQuery: string;
	/** IDs of nodes matching search. */
	searchMatches: number[];
	/** Current match index in search results. */
	searchCurrentIndex: number;
	/** Line numbers matching search in raw/edit view. */
	searchLineMatches: number[];
	/** File size in bytes. */
	fileSize: number;
	/** Total number of keys. */
	totalKeys: number;
	/** Max depth of the JSON tree. */
	maxDepth: number;
	/** Whether parsing is in progress (Web Worker). */
	isParsing: boolean;
	/** Whether keys are sorted alphabetically. */
	sortedByKeys: boolean;
	/** Whether line numbers are shown in raw view. */
	showLineNumbers: boolean;
	/** Whether inline editing mode is active. */
	isEditing: boolean;
	/** Undo history stack (raw JSON snapshots). */
	undoStack: string[];
	/** Redo history stack (raw JSON snapshots). */
	redoStack: string[];
	/** Saved bookmarks for the current JSON. */
	bookmarks: Bookmark[];
	/** Second JSON for diff comparison (null = no diff active). */
	diffJson: string | null;
	/** Whether edit view has unsaved changes. */
	hasUnsavedEdits: boolean;
}

/** Keys of AppState for subscription granularity. */
export type StateKey = keyof AppState;

/** Callback for state change subscriptions. */
export type StateListener = (state: AppState, changed: StateKey[]) => void;
