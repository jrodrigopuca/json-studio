/**
 * SearchBar component tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { SearchBar } from "@viewer/components/SearchBar";
import { renderWithStore, resetStore } from "../helpers";
import { useStore } from "@viewer/store";

afterEach(resetStore);



describe("SearchBar", () => {
	it("renders when isSearchOpen is true", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: true,
			viewMode: "tree",
		});

		expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
	});

	it("does not render input when isSearchOpen is false", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: false,
			viewMode: "tree",
		});

		expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
	});

	it("shows match count when there are results", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: true,
			viewMode: "tree",
			searchQuery: "test",
			searchMatches: [1, 3, 5],
			searchCurrentIndex: 0,
		});

		// Should show "1 of 3" or similar
		expect(screen.getByText(/1.*3/)).toBeInTheDocument();
	});

	it("shows no results message when query has no matches", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: true,
			viewMode: "tree",
			searchQuery: "nonexistent",
			searchMatches: [],
			searchCurrentIndex: 0,
		});

		expect(screen.getByText(/no results/i)).toBeInTheDocument();
	});

	it("has previous and next navigation buttons", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: true,
			viewMode: "tree",
			searchQuery: "test",
			searchMatches: [1, 2, 3],
			searchCurrentIndex: 0,
		});

		expect(screen.getByTitle(/previous/i)).toBeInTheDocument();
		expect(screen.getByTitle(/next/i)).toBeInTheDocument();
	});

	it("has a close button", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: true,
			viewMode: "tree",
		});

		expect(screen.getByTitle(/close/i)).toBeInTheDocument();
	});

	it("closes search on close button click", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: true,
			viewMode: "tree",
		});

		fireEvent.click(screen.getByTitle(/close/i));

		expect(useStore.getState().isSearchOpen).toBe(false);
	});

	it("opens search on Ctrl/Cmd+F", () => {
		renderWithStore(<SearchBar />, {
			isSearchOpen: false,
			viewMode: "tree",
		});

		act(() => {
			fireEvent.keyDown(window, { key: "f", metaKey: true });
		});

		expect(useStore.getState().isSearchOpen).toBe(true);
	});
});
