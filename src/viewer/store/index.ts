/**
 * Zustand store for JSON Studio viewer.
 * Composed from domain-specific slices for maintainability.
 */

import { create } from "zustand";
import { subscribeWithSelector, devtools } from "zustand/middleware";
import type { FlatNode } from "../core/parser.types";

// ─── Slices ──────────────────────────────────────────────────────────────────

import { createJsonSlice, type JsonSlice } from "./json-slice";
import { createTreeSlice, type TreeSlice } from "./tree-slice";
import { createSearchSlice, type SearchSlice } from "./search-slice";
import { createEditorSlice, type EditorSlice } from "./editor-slice";
import { createSavedSlice, type SavedSlice } from "./saved-slice";
import { createUiSlice, type UiSlice } from "./ui-slice";

// ─── Re-export types used by components ──────────────────────────────────────

export type { SavedJson } from "./saved-slice";
export type { Bookmark } from "./ui-slice";

// ─── Composed types ─────────────────────────────────────────────────────────

export type AppState = JsonSlice &
	TreeSlice &
	SearchSlice &
	EditorSlice &
	SavedSlice &
	UiSlice;

// Keep legacy alias for backward compatibility
export type AppActions = AppState;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
	devtools(
		subscribeWithSelector((...a) => ({
			...createJsonSlice(...a),
			...createTreeSlice(...a),
			...createSearchSlice(...a),
			...createEditorSlice(...a),
			...createSavedSlice(...a),
			...createUiSlice(...a),
		})),
		{ name: "json-studio" },
	),
);

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectVisibleNodes = (state: AppState) => {
	const { nodes, expandedNodes, focusedNodeId } = state;
	const result: FlatNode[] = [];
	const hiddenParents = new Set<number>();

	// If focused on a specific node, find its descendants
	let focusedNode: FlatNode | undefined;
	let focusedDescendants: Set<number> | null = null;

	if (focusedNodeId !== null) {
		focusedNode = nodes.find((n) => n.id === focusedNodeId);
		if (focusedNode) {
			focusedDescendants = new Set<number>([focusedNodeId]);
			const collectDescendants = (parentId: number) => {
				for (const n of nodes) {
					if (n.parentId === parentId) {
						focusedDescendants!.add(n.id);
						if (n.isExpandable) {
							collectDescendants(n.id);
						}
					}
				}
			};
			collectDescendants(focusedNodeId);
		}
	}

	for (const node of nodes) {
		if (focusedDescendants && !focusedDescendants.has(node.id)) {
			continue;
		}

		if (node.parentId !== -1 && hiddenParents.has(node.parentId)) {
			if (node.isExpandable) hiddenParents.add(node.id);
			continue;
		}

		if (focusedNode && node.id !== focusedNodeId) {
			result.push({ ...node, depth: node.depth - focusedNode.depth });
		} else if (focusedNode && node.id === focusedNodeId) {
			result.push({ ...node, depth: 0 });
		} else {
			result.push(node);
		}

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
