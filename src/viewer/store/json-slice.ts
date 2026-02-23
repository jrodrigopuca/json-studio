/**
 * JSON data slice — manages raw JSON, parsed nodes, and metadata.
 */

import type { StateCreator } from "zustand";
import type { FlatNode, ParseError } from "../core/parser.types";
import type { ViewMode, ResolvedTheme, ContentTypeClass } from "@shared/types";
import type { StoreState } from "./store.types";

export interface JsonSlice {
	// State
	rawJson: string;
	nodes: FlatNode[];
	parseError: ParseError | null;
	isValid: boolean;
	isParsing: boolean;
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
	setParseError: (error: ParseError) => void;
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
	viewMode: "tree",
	theme: "dark",
	contentType: "unknown",
	url: "",
	fileSize: 0,
	totalKeys: 0,
	maxDepth: 0,

	setJson: (json, nodes, metadata) =>
		set({
			rawJson: json,
			nodes,
			isValid: true,
			parseError: null,
			isParsing: false,
			...metadata,
		}),

	setParseError: (error) =>
		set({
			parseError: error,
			isValid: false,
			nodes: [],
			isParsing: false,
		}),

	setIsParsing: (parsing) => set({ isParsing: parsing }),

	setViewMode: (mode) => {
		const state = get();
		if (state.viewMode === "edit" && mode !== "edit" && state.hasUnsavedEdits) {
			set({ pendingViewMode: mode });
			return;
		}
		set({ viewMode: mode });
	},

	setTheme: (theme) => set({ theme }),
});
