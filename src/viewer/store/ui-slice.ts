/**
 * UI slice — bookmarks, modals, shortcuts help, reset.
 */

import type { StateCreator } from "zustand";
import type { ViewMode } from "@shared/types";
import type { StoreState } from "./store.types";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A saved bookmark for a JSON path. */
export interface Bookmark {
	id: string;
	path: string;
	label: string;
	nodeId: number;
}

// ─── Slice ───────────────────────────────────────────────────────────────────

export interface UiSlice {
	// State
	bookmarks: Bookmark[];
	pendingViewMode: ViewMode | null;
	pendingSizeWarning: ViewMode | null;
	showShortcutsHelp: boolean;

	// Actions
	addBookmark: (bookmark: Omit<Bookmark, "id">) => void;
	removeBookmark: (id: string) => void;
	confirmViewChange: () => void;
	cancelViewChange: () => void;
	confirmSizeWarning: () => void;
	cancelSizeWarning: () => void;
	setShowShortcutsHelp: (show: boolean) => void;
	reset: () => void;
}

export const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (
	set,
	get,
) => ({
	bookmarks: [],
	pendingViewMode: null,
	pendingSizeWarning: null,
	showShortcutsHelp: false,

	addBookmark: (bookmark) => {
		const { bookmarks } = get();
		const id = crypto.randomUUID();
		set({ bookmarks: [...bookmarks, { ...bookmark, id }] });
	},

	removeBookmark: (id) => {
		const { bookmarks } = get();
		set({ bookmarks: bookmarks.filter((b) => b.id !== id) });
	},

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

	confirmSizeWarning: () => {
		const { pendingSizeWarning } = get();
		if (pendingSizeWarning) {
			set({ viewMode: pendingSizeWarning, pendingSizeWarning: null });
		}
	},

	cancelSizeWarning: () => set({ pendingSizeWarning: null }),

	setShowShortcutsHelp: (show) => set({ showShortcutsHelp: show }),

	reset: () =>
		set({
			// JSON data
			rawJson: "",
			nodes: [],
			parseError: null,
			isValid: false,
			isParsing: false,
			// View
			viewMode: "tree",
			contentType: "unknown",
			url: "",
			// Tree
			expandedNodes: new Set([0]),
			selectedNodeId: null,
			focusedNodeId: null,
			// Search
			searchQuery: "",
			searchMatches: [],
			searchCurrentIndex: 0,
			searchLineMatches: [],
			isSearchOpen: false,
			// Metadata
			fileSize: 0,
			totalKeys: 0,
			maxDepth: 0,
			// Editor
			keySortOrder: null,
			originalJsonForSort: null,
			showLineNumbers: true,
			isEditing: false,
			editorIndentSize: 2,
			editorWordWrap: true,
			editorFontSize: 13,
			editorCurrentLine: null,
			undoStack: [],
			redoStack: [],
			hasUnsavedEdits: false,
			editContent: "",
			// UI
			bookmarks: [],
			diffJson: null,
			pendingViewMode: null,
			pendingSizeWarning: null,
			showShortcutsHelp: false,
		} as Partial<StoreState>),
});
