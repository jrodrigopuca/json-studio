/**
 * Global viewer type definitions.
 */

import type { AppState } from "./core/store.types.js";

/**
 * Interface all view components must implement.
 * Allows views to be swapped without modifying the app orchestrator.
 */
export interface ViewComponent {
	/** Render the view into the given container. */
	render(container: HTMLElement): void;
	/** Update the view with new state. */
	update(state: Partial<AppState>): void;
	/** Clean up resources. */
	dispose(): void;
}

/**
 * Interface for components that support text search.
 */
export interface Searchable {
	/** Highlight matches for the given query. */
	search(query: string): number[];
	/** Clear all search highlights. */
	clearSearch(): void;
	/** Scroll to the match at the given index. */
	goToMatch(index: number): void;
}

/**
 * Interface for disposable resources.
 */
export interface Disposable {
	dispose(): void;
}
