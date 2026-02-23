/**
 * Editor slice — editing, undo/redo, formatting, options.
 */

import type { StateCreator } from "zustand";
import type { StoreState } from "./store.types";
import { parseJSON } from "../core/parser";
import { prettyPrint, minify, sortJsonByKeys } from "../core/formatter";

export interface EditorSlice {
	// State
	keySortOrder: "asc" | "desc" | null;
	originalJsonForSort: string | null;
	showLineNumbers: boolean;
	isEditing: boolean;
	editorIndentSize: 2 | 4 | "tab";
	editorWordWrap: boolean;
	editorFontSize: number;
	editorCurrentLine: number | null;
	undoStack: string[];
	redoStack: string[];
	hasUnsavedEdits: boolean;
	editContent: string;

	// Actions
	updateJson: (newJson: string) => void;
	undo: () => void;
	redo: () => void;
	setHasUnsavedEdits: (value: boolean) => void;
	setEditContent: (content: string) => void;
	saveEditContent: () => boolean;
	toggleSortedByKeys: () => void;
	toggleLineNumbers: () => void;
	setIsEditing: (editing: boolean) => void;
	toggleEditorIndent: () => void;
	toggleEditorWordWrap: () => void;
	setEditorFontSize: (size: number) => void;
	setEditorCurrentLine: (line: number | null) => void;
	prettifyJson: () => void;
	minifyJson: () => void;
}

export const createEditorSlice: StateCreator<
	StoreState,
	[],
	[],
	EditorSlice
> = (set, get) => ({
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
		const { editContent, editorIndentSize } = get();
		try {
			const result = parseJSON(editContent);
			if (result.ok) {
				const formatted = prettyPrint(editContent, editorIndentSize);
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

	toggleSortedByKeys: () => {
		const { keySortOrder, rawJson, originalJsonForSort } = get();

		if (keySortOrder === null) {
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

	toggleEditorIndent: () => {
		const { editorIndentSize, editContent, rawJson } = get();
		const newIndent =
			editorIndentSize === 2 ? 4 : editorIndentSize === 4 ? "tab" : 2;

		const contentToFormat = editContent || rawJson;
		try {
			const reformatted = prettyPrint(contentToFormat, newIndent);
			set({
				editorIndentSize: newIndent,
				editContent: reformatted,
				rawJson: reformatted,
				hasUnsavedEdits: false,
			});
		} catch {
			set({ editorIndentSize: newIndent });
		}
	},

	toggleEditorWordWrap: () =>
		set((s) => ({ editorWordWrap: !s.editorWordWrap })),

	setEditorFontSize: (size) =>
		set({ editorFontSize: Math.max(10, Math.min(24, size)) }),

	setEditorCurrentLine: (line) => set({ editorCurrentLine: line }),

	prettifyJson: () => {
		const { rawJson, editorIndentSize } = get();
		const formatted = prettyPrint(rawJson, editorIndentSize);
		set({ rawJson: formatted });
	},

	minifyJson: () => {
		const { rawJson } = get();
		const minified = minify(rawJson);
		set({ rawJson: minified });
	},
});
