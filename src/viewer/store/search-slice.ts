/**
 * Search slice — query, matches, navigation.
 */

import type { StateCreator } from "zustand";
import type { StoreState } from "./store.types";

export interface SearchSlice {
	// State
	searchQuery: string;
	searchMatches: number[];
	searchCurrentIndex: number;
	searchLineMatches: number[];
	isSearchOpen: boolean;

	// Actions
	setSearchQuery: (query: string) => void;
	setSearchMatches: (matches: number[]) => void;
	setSearchLineMatches: (matches: number[]) => void;
	setSearchCurrentIndex: (index: number) => void;
	nextMatch: () => void;
	prevMatch: () => void;
	clearSearch: () => void;
	toggleSearch: () => void;
	closeSearch: () => void;
}

export const createSearchSlice: StateCreator<
	StoreState,
	[],
	[],
	SearchSlice
> = (set, get) => ({
	searchQuery: "",
	searchMatches: [],
	searchCurrentIndex: 0,
	searchLineMatches: [],
	isSearchOpen: false,

	setSearchQuery: (query) => set({ searchQuery: query }),

	setSearchMatches: (matches) =>
		set({ searchMatches: matches, searchCurrentIndex: 0 }),

	setSearchLineMatches: (matches) =>
		set({ searchLineMatches: matches, searchCurrentIndex: 0 }),

	setSearchCurrentIndex: (index) => set({ searchCurrentIndex: index }),

	nextMatch: () => {
		const { searchMatches, searchLineMatches, searchCurrentIndex, viewMode } =
			get();
		const matches = viewMode === "tree" ? searchMatches : searchLineMatches;
		if (matches.length === 0) return;
		set({ searchCurrentIndex: (searchCurrentIndex + 1) % matches.length });
	},

	prevMatch: () => {
		const { searchMatches, searchLineMatches, searchCurrentIndex, viewMode } =
			get();
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
});
