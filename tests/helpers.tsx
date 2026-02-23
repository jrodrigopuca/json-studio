/**
 * Test helpers for component tests.
 *
 * Provides a `renderWithStore` utility that renders a component
 * with the real Zustand store pre-set to a given partial state.
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { useStore, type AppState } from "@viewer/store";

/**
 * Set the Zustand store state for testing.
 * Merges partial state on top of the current (initial) state.
 */
export function setStoreState(partial: Partial<AppState>) {
	useStore.setState(partial);
}

/**
 * Reset the Zustand store to its initial state.
 * Call this in afterEach to prevent inter-test bleed.
 */
export function resetStore() {
	useStore.setState(useStore.getInitialState(), true);
}

/**
 * Render helper that optionally seeds the store before rendering.
 */
export function renderWithStore(
	ui: ReactElement,
	storeOverrides?: Partial<AppState>,
	options?: Omit<RenderOptions, "wrapper">,
) {
	if (storeOverrides) {
		setStoreState(storeOverrides);
	}
	return render(ui, options);
}
