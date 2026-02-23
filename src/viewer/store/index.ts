/**
 * Zustand store for JSON Spark viewer.
 * Centralized state management with React 19 support.
 */

import { create } from "zustand";
import { subscribeWithSelector, devtools } from "zustand/middleware";
import type { ViewMode, ResolvedTheme, ContentTypeClass } from "@shared/types";
import type { FlatNode, ParseError } from "../core/parser.types";
import { parseJSON } from "../core/parser";
import { prettyPrint, minify, sortJsonByKeys } from "../core/formatter";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A saved bookmark for a JSON path. */
export interface Bookmark {
	id: string;
	path: string;
	label: string;
	nodeId: number;
}

/** A saved JSON document. */
export interface SavedJson {
	id: string;
	name: string;
	json: string;
	size: number;
	createdAt: number;
	updatedAt: number;
}

// ─── LocalStorage Persistence ────────────────────────────────────────────────

const STORAGE_KEY = "json-studio-saved";

function loadSavedJsons(): SavedJson[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored) as SavedJson[];
		}
	} catch (e) {
		console.error("Failed to load saved JSONs:", e);
	}
	return [];
}

function persistSavedJsons(items: SavedJson[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch (e) {
		console.error("Failed to persist saved JSONs:", e);
	}
}

/** Application state. */
export interface AppState {
	// JSON data
	rawJson: string;
	nodes: FlatNode[];
	parseError: ParseError | null;
	isValid: boolean;
	isParsing: boolean;

	// View
	viewMode: ViewMode;
	theme: ResolvedTheme;
	contentType: ContentTypeClass;
	url: string;

	// Tree navigation
	expandedNodes: Set<number>;
	selectedNodeId: number | null;

	// Search
	searchQuery: string;
	searchMatches: number[];
	searchCurrentIndex: number;
	searchLineMatches: number[];
	isSearchOpen: boolean;

	// Metadata
	fileSize: number;
	totalKeys: number;
	maxDepth: number;

	// Options
	keySortOrder: "asc" | "desc" | null;
	originalJsonForSort: string | null;
	showLineNumbers: boolean;
	isEditing: boolean;

	// History
	undoStack: string[];
	redoStack: string[];
	hasUnsavedEdits: boolean;
	editContent: string;

	// Features
	bookmarks: Bookmark[];
	diffJson: string | null;
	savedJsons: SavedJson[];

	// Modal state
	pendingViewMode: ViewMode | null;
	showShortcutsHelp: boolean;
}

/** Actions for state mutations. */
export interface AppActions {
	// JSON operations
	setJson: (
		json: string,
		nodes: FlatNode[],
		metadata: Partial<AppState>,
	) => void;
	setParseError: (error: ParseError) => void;
	setIsParsing: (parsing: boolean) => void;

	// View operations
	setViewMode: (mode: ViewMode) => void;
	setTheme: (theme: ResolvedTheme) => void;

	// Tree operations
	toggleNode: (nodeId: number) => void;
	expandNode: (nodeId: number) => void;
	collapseNode: (nodeId: number) => void;
	expandAll: () => void;
	collapseAll: () => void;
	expandToLevel: (level: number) => void;
	selectNode: (nodeId: number | null) => void;

	// Search operations
	setSearchQuery: (query: string) => void;
	setSearchMatches: (matches: number[]) => void;
	setSearchLineMatches: (matches: number[]) => void;
	setSearchCurrentIndex: (index: number) => void;
	nextMatch: () => void;
	prevMatch: () => void;
	clearSearch: () => void;
	toggleSearch: () => void;
	closeSearch: () => void;

	// Tree navigation
	expandToNode: (nodeId: number) => void;

	// Edit operations
	updateJson: (newJson: string) => void;
	undo: () => void;
	redo: () => void;
	setHasUnsavedEdits: (value: boolean) => void;
	setEditContent: (content: string) => void;
	saveEditContent: () => boolean;

	// Options
	toggleSortedByKeys: () => void;
	toggleLineNumbers: () => void;

	// Format actions (Raw view)
	prettifyJson: () => void;
	minifyJson: () => void;
	setIsEditing: (editing: boolean) => void;

	// Bookmarks
	addBookmark: (bookmark: Omit<Bookmark, "id">) => void;
	removeBookmark: (id: string) => void;

	// Diff
	setDiffJson: (json: string | null) => void;

	// Saved JSONs
	saveCurrentJson: (name: string) => boolean;
	loadSavedJson: (id: string, targetView?: ViewMode) => void;
	deleteSavedJson: (id: string) => void;
	renameSavedJson: (id: string, name: string) => void;

	// Modal actions
	confirmViewChange: () => void;
	cancelViewChange: () => void;
	setShowShortcutsHelp: (show: boolean) => void;

	// Reset
	reset: () => void;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: AppState = {
	rawJson: "",
	nodes: [],
	parseError: null,
	isValid: false,
	isParsing: false,

	viewMode: "tree",
	theme: "dark",
	contentType: "unknown",
	url: "",

	expandedNodes: new Set([0]),
	selectedNodeId: null,

	searchQuery: "",
	searchMatches: [],
	searchCurrentIndex: 0,
	searchLineMatches: [],
	isSearchOpen: false,

	fileSize: 0,
	totalKeys: 0,
	maxDepth: 0,

	keySortOrder: null,
	originalJsonForSort: null,
	showLineNumbers: true,
	isEditing: false,

	undoStack: [],
	redoStack: [],
	hasUnsavedEdits: false,
	editContent: "",

	bookmarks: [],
	diffJson: null,
	savedJsons: loadSavedJsons(),
	pendingViewMode: null,
	showShortcutsHelp: false,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<AppState & AppActions>()(
	devtools(
		subscribeWithSelector((set, get) => ({
			...initialState,

			// ─── JSON Operations ─────────────────────────────────────────────────
			setJson: (json, nodes, metadata) =>
				set({
					rawJson: json,
					nodes,
					isValid: true,
					parseError: null,
					isParsing: false,
					expandedNodes: new Set([0]),
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

			// ─── View Operations ─────────────────────────────────────────────────
			setViewMode: (mode) => {
				const { viewMode, hasUnsavedEdits } = get();
				// If leaving edit mode with unsaved changes, show modal
				if (viewMode === "edit" && mode !== "edit" && hasUnsavedEdits) {
					set({ pendingViewMode: mode });
					return;
				}
				set({ viewMode: mode });
			},
			setTheme: (theme) => set({ theme }),

			// ─── Tree Operations ─────────────────────────────────────────────────
			toggleNode: (nodeId) => {
				const { expandedNodes } = get();
				const next = new Set(expandedNodes);
				if (next.has(nodeId)) {
					next.delete(nodeId);
				} else {
					next.add(nodeId);
				}
				set({ expandedNodes: next });
			},

			expandNode: (nodeId) => {
				const { expandedNodes } = get();
				if (!expandedNodes.has(nodeId)) {
					const next = new Set(expandedNodes);
					next.add(nodeId);
					set({ expandedNodes: next });
				}
			},

			collapseNode: (nodeId) => {
				const { expandedNodes } = get();
				if (expandedNodes.has(nodeId)) {
					const next = new Set(expandedNodes);
					next.delete(nodeId);
					set({ expandedNodes: next });
				}
			},

			expandAll: () => {
				const { nodes } = get();
				const all = new Set(
					nodes.filter((n) => n.isExpandable).map((n) => n.id),
				);
				set({ expandedNodes: all });
			},

			collapseAll: () => set({ expandedNodes: new Set([0]) }),

			expandToLevel: (level) => {
				const { nodes } = get();
				const expanded = new Set<number>();
				nodes.forEach((n) => {
					if (n.isExpandable && n.depth < level) {
						expanded.add(n.id);
					}
				});
				set({ expandedNodes: expanded });
			},

			selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

			// ─── Search Operations ───────────────────────────────────────────────
			setSearchQuery: (query) => set({ searchQuery: query }),

			setSearchMatches: (matches) =>
				set({ searchMatches: matches, searchCurrentIndex: 0 }),

			setSearchLineMatches: (matches) =>
				set({ searchLineMatches: matches, searchCurrentIndex: 0 }),

			setSearchCurrentIndex: (index) => set({ searchCurrentIndex: index }),

			nextMatch: () => {
				const {
					searchMatches,
					searchLineMatches,
					searchCurrentIndex,
					viewMode,
				} = get();
				const matches = viewMode === "tree" ? searchMatches : searchLineMatches;
				if (matches.length === 0) return;
				set({ searchCurrentIndex: (searchCurrentIndex + 1) % matches.length });
			},

			prevMatch: () => {
				const {
					searchMatches,
					searchLineMatches,
					searchCurrentIndex,
					viewMode,
				} = get();
				const matches = viewMode === "tree" ? searchMatches : searchLineMatches;
				if (matches.length === 0) return;
				set({
					searchCurrentIndex:
						(searchCurrentIndex - 1 + matches.length) % matches.length,
				});
			},

			clearSearch: () =>
				set({
					searchQuery: "",
					searchMatches: [],
					searchLineMatches: [],
					searchCurrentIndex: 0,
				}),

			toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),

			closeSearch: () =>
				set({
					isSearchOpen: false,
					searchQuery: "",
					searchMatches: [],
					searchLineMatches: [],
					searchCurrentIndex: 0,
				}),

			// ─── Tree Navigation ─────────────────────────────────────────────────
			expandToNode: (nodeId) => {
				const { nodes, expandedNodes } = get();
				const node = nodes.find((n) => n.id === nodeId);
				if (!node) return;

				// Collect all ancestors
				const toExpand = new Set(expandedNodes);
				let current = node;
				while (current.parentId !== -1) {
					const parent = nodes.find((n) => n.id === current.parentId);
					if (!parent) break;
					if (parent.isExpandable) {
						toExpand.add(parent.id);
					}
					current = parent;
				}

				set({ expandedNodes: toExpand });
			},

			// ─── Edit Operations ─────────────────────────────────────────────────
			updateJson: (newJson) => {
				const { rawJson, undoStack } = get();
				set({
					rawJson: newJson,
					undoStack: [...undoStack, rawJson],
					redoStack: [],
					hasUnsavedEdits: true,
				});
			},

			undo: () => {
				const { undoStack, rawJson, redoStack } = get();
				if (undoStack.length === 0) return;
				const prev = undoStack[undoStack.length - 1]!;
				set({
					rawJson: prev,
					undoStack: undoStack.slice(0, -1),
					redoStack: [...redoStack, rawJson],
				});
			},

			redo: () => {
				const { redoStack, rawJson, undoStack } = get();
				if (redoStack.length === 0) return;
				const next = redoStack[redoStack.length - 1]!;
				set({
					rawJson: next,
					redoStack: redoStack.slice(0, -1),
					undoStack: [...undoStack, rawJson],
				});
			},

			setHasUnsavedEdits: (value) => set({ hasUnsavedEdits: value }),

			setEditContent: (content) => {
				const { rawJson } = get();
				set({ editContent: content, hasUnsavedEdits: content !== rawJson });
			},

			saveEditContent: () => {
				const { editContent } = get();
				try {
					const result = parseJSON(editContent);
					if (result.ok) {
						const formatted = prettyPrint(editContent);
						set({
							rawJson: formatted,
							nodes: result.nodes,
							isValid: true,
							parseError: null,
							editContent: formatted,
							hasUnsavedEdits: false,
							fileSize: new Blob([formatted]).size,
							totalKeys: result.totalKeys,
							maxDepth: result.maxDepth,
						});
						return true;
					}
				} catch (e) {
					console.error("Failed to save:", e);
				}
				return false;
			},

			// ─── Options ─────────────────────────────────────────────────────────
			toggleSortedByKeys: () => {
				const { keySortOrder, rawJson, originalJsonForSort } = get();

				if (keySortOrder === null) {
					// null → 'asc': Save original, sort ascending
					const sorted = sortJsonByKeys(rawJson, "asc");
					const result = parseJSON(sorted);
					if (result.ok) {
						set({
							keySortOrder: "asc",
							originalJsonForSort: rawJson,
							rawJson: sorted,
							nodes: result.nodes,
						});
					}
				} else if (keySortOrder === "asc") {
					// 'asc' → 'desc': Sort descending
					const original = originalJsonForSort || rawJson;
					const sorted = sortJsonByKeys(original, "desc");
					const result = parseJSON(sorted);
					if (result.ok) {
						set({
							keySortOrder: "desc",
							rawJson: sorted,
							nodes: result.nodes,
						});
					}
				} else {
					// 'desc' → null: Restore original
					const original = originalJsonForSort || rawJson;
					const result = parseJSON(original);
					if (result.ok) {
						set({
							keySortOrder: null,
							originalJsonForSort: null,
							rawJson: original,
							nodes: result.nodes,
						});
					} else {
						set({
							keySortOrder: null,
							originalJsonForSort: null,
						});
					}
				}
			},
			toggleLineNumbers: () =>
				set((s) => ({ showLineNumbers: !s.showLineNumbers })),
			setIsEditing: (editing) => set({ isEditing: editing }),

			// ─── Format Actions (Raw view) ───────────────────────────────────────
			prettifyJson: () => {
				const { rawJson } = get();
				const formatted = prettyPrint(rawJson);
				set({ rawJson: formatted });
			},

			minifyJson: () => {
				const { rawJson } = get();
				const minified = minify(rawJson);
				set({ rawJson: minified });
			},

			// ─── Bookmarks ───────────────────────────────────────────────────────
			addBookmark: (bookmark) => {
				const { bookmarks } = get();
				const id = crypto.randomUUID();
				set({ bookmarks: [...bookmarks, { ...bookmark, id }] });
			},

			removeBookmark: (id) => {
				const { bookmarks } = get();
				set({ bookmarks: bookmarks.filter((b) => b.id !== id) });
			},

			// ─── Diff ────────────────────────────────────────────────────────────
			setDiffJson: (json) => set({ diffJson: json }),

			// ─── Saved JSONs ─────────────────────────────────────────────────────
			saveCurrentJson: (name) => {
				const { rawJson, savedJsons } = get();
				const MAX_ITEMS = 10;
				const MAX_SIZE = 500 * 1024; // 500KB per item

				// Check size limit
				const size = new Blob([rawJson]).size;
				if (size > MAX_SIZE) {
					return false;
				}

				// Check item limit - remove oldest if at max
				let updated = [...savedJsons];
				if (updated.length >= MAX_ITEMS) {
					updated.sort((a, b) => a.updatedAt - b.updatedAt);
					updated = updated.slice(1);
				}

				const now = Date.now();
				const newItem: SavedJson = {
					id: crypto.randomUUID(),
					name,
					json: rawJson,
					size,
					createdAt: now,
					updatedAt: now,
				};

				updated.push(newItem);
				set({ savedJsons: updated });
				persistSavedJsons(updated);
				return true;
			},

			loadSavedJson: (id, targetView) => {
				const { savedJsons } = get();
				const item = savedJsons.find((s) => s.id === id);
				if (!item) return;

				const result = parseJSON(item.json);
				if (result.ok) {
					set({
						rawJson: item.json,
						nodes: result.nodes,
						isValid: true,
						parseError: null,
						expandedNodes: new Set([0]),
						fileSize: item.size,
						totalKeys: result.totalKeys,
						maxDepth: result.maxDepth,
						viewMode: targetView ?? "tree",
						editContent: item.json,
						hasUnsavedEdits: false,
					});
				}
			},

			deleteSavedJson: (id) => {
				const { savedJsons } = get();
				const updated = savedJsons.filter((s) => s.id !== id);
				set({ savedJsons: updated });
				persistSavedJsons(updated);
			},

			renameSavedJson: (id, name) => {
				const { savedJsons } = get();
				const updated = savedJsons.map((s) =>
					s.id === id ? { ...s, name, updatedAt: Date.now() } : s,
				);
				set({ savedJsons: updated });
				persistSavedJsons(updated);
			},

			// ─── Modal Actions ───────────────────────────────────────────────────
			confirmViewChange: () => {
				const { pendingViewMode } = get();
				if (pendingViewMode) {
					set({
						viewMode: pendingViewMode,
						pendingViewMode: null,
						hasUnsavedEdits: false,
					});
				}
			},

			cancelViewChange: () => set({ pendingViewMode: null }),

			setShowShortcutsHelp: (show) => set({ showShortcutsHelp: show }),

			// ─── Reset ───────────────────────────────────────────────────────────
			reset: () => set(initialState),
		})),
		{ name: "json-studio" },
	),
);

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectVisibleNodes = (state: AppState) => {
	const { nodes, expandedNodes } = state;
	const result: FlatNode[] = [];
	const hiddenParents = new Set<number>();

	for (const node of nodes) {
		// Skip if any ancestor is collapsed
		if (node.parentId !== -1 && hiddenParents.has(node.parentId)) {
			if (node.isExpandable) hiddenParents.add(node.id);
			continue;
		}

		result.push(node);

		// If this node is expandable but not expanded, hide its children
		if (node.isExpandable && !expandedNodes.has(node.id)) {
			hiddenParents.add(node.id);
		}
	}

	return result;
};

export const selectCurrentMatch = (state: AppState) => {
	const matches =
		state.viewMode === "tree" ? state.searchMatches : state.searchLineMatches;
	return matches[state.searchCurrentIndex] ?? null;
};
