/**
 * JSON data slice — manages raw JSON, parsed nodes, and metadata.
 */

import type { StateCreator } from "zustand";
import type { FlatNode, ParseError } from "../core/parser.types";
import type { ViewMode, ResolvedTheme, ContentTypeClass } from "@shared/types";
import type { StoreState } from "./store.types";
import { LARGE_FILE_THRESHOLD, HEAVY_VIEW_THRESHOLD } from "@shared/constants";

export interface JsonSlice {
	// State
	rawJson: string;
	nodes: FlatNode[];
	parseError: ParseError | null;
	isValid: boolean;
	isParsing: boolean;
	isLargeFile: boolean;
	viewMode: ViewMode;
	theme: ResolvedTheme;
	contentType: ContentTypeClass;
	url: string;
	fileSize: number;
	totalKeys: number;
	maxDepth: number;

	// Actions
	setJson: (
		json: string,
		nodes: FlatNode[],
		metadata: Partial<JsonSlice>,
	) => void;
	setParseError: (error: ParseError, rawJson?: string) => void;
	setIsParsing: (parsing: boolean) => void;
	setViewMode: (mode: ViewMode) => void;
	setTheme: (theme: ResolvedTheme) => void;
}

export const createJsonSlice: StateCreator<StoreState, [], [], JsonSlice> = (
	set,
	get,
) => ({
	rawJson: "",
	nodes: [],
	parseError: null,
	isValid: false,
	isParsing: false,
	isLargeFile: false,
	viewMode: "tree",
	theme: "dark",
	contentType: "unknown",
	url: "",
	fileSize: 0,
	totalKeys: 0,
	maxDepth: 0,

	setJson: (json, nodes, metadata) => {
		const fileSize = metadata.fileSize ?? new Blob([json]).size;
		const isLargeFile = fileSize >= LARGE_FILE_THRESHOLD;
		set({
			rawJson: json,
			nodes,
			isValid: true,
			parseError: null,
			isParsing: false,
			isLargeFile,
			...metadata,
		});

		// For large files, collapse to only top-level nodes (depth 0–1)
		if (isLargeFile) {
			const expanded = new Set<number>();
			for (const node of nodes) {
				if (node.isExpandable && node.depth < 2) {
					expanded.add(node.id);
				}
			}
			set({ expandedNodes: expanded });
		}
	},

	setParseError: (error, rawJson) => {
		const update: Partial<StoreState> = {
			parseError: error,
			isValid: false,
			nodes: [],
			isParsing: false,
		};
		if (rawJson !== undefined) {
			update.rawJson = rawJson;
			update.fileSize = new Blob([rawJson]).size;
		}
		set(update);
	},

	setIsParsing: (parsing) => set({ isParsing: parsing }),

	setViewMode: (mode) => {
		const state = get();
		// Warn about unsaved edits when leaving edit mode
		if (state.viewMode === "edit" && mode !== "edit" && state.hasUnsavedEdits) {
			set({ pendingViewMode: mode });
			return;
		}
		// Warn about performance when switching to heavy views with large content
		if (
			(mode === "edit" || mode === "diff") &&
			state.fileSize >= HEAVY_VIEW_THRESHOLD
		) {
			set({ pendingSizeWarning: mode });
			return;
		}
		set({ viewMode: mode });
	},

	setTheme: (theme) => set({ theme }),
});
