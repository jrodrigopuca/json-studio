/**
 * Saved-JSON & diff slice — localStorage persistence, CRUD, diff.
 */

import type { StateCreator } from "zustand";
import type { ViewMode } from "@shared/types";
import type { StoreState } from "./store.types";
import { parseJSON } from "../core/parser";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A saved JSON document. */
export interface SavedJson {
	id: string;
	name: string;
	json: string;
	size: number;
	createdAt: number;
	updatedAt: number;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

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

// ─── Slice ───────────────────────────────────────────────────────────────────

export interface SavedSlice {
	// State
	savedJsons: SavedJson[];
	diffJson: string | null;

	// Actions
	saveCurrentJson: (name: string) => boolean;
	loadSavedJson: (id: string, targetView?: ViewMode) => void;
	deleteSavedJson: (id: string) => void;
	renameSavedJson: (id: string, name: string) => void;
	setDiffJson: (json: string | null) => void;
}

export const createSavedSlice: StateCreator<StoreState, [], [], SavedSlice> = (
	set,
	get,
) => ({
	savedJsons: loadSavedJsons(),
	diffJson: null,

	saveCurrentJson: (name) => {
		const { rawJson, savedJsons } = get();
		const MAX_ITEMS = 10;
		const MAX_SIZE = 500 * 1024; // 500KB per item

		const size = new Blob([rawJson]).size;
		if (size > MAX_SIZE) return false;

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

	setDiffJson: (json) => set({ diffJson: json }),
});
