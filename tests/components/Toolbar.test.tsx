/**
 * Toolbar component tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { Toolbar } from "@viewer/components/Toolbar";
import { ToastProvider } from "@viewer/components/Toast";
import { renderWithStore, resetStore } from "../helpers";
import { useStore } from "@viewer/store";

afterEach(resetStore);

function renderToolbar(storeOverrides = {}) {
	return renderWithStore(
		<ToastProvider>
			<Toolbar />
		</ToastProvider>,
		{
			rawJson: '{"a":1}',
			nodes: [],
			viewMode: "tree" as const,
			expandedNodes: new Set<number>(),
			undoStack: [],
			redoStack: [],
			isSearchOpen: false,
			keySortOrder: null,
			showLineNumbers: false,
			savedJsons: [],
			...storeOverrides,
		},
	);
}

describe("Toolbar", () => {
	it("renders all view tabs", () => {
		renderToolbar();

		const tablist = screen.getByRole("tablist");
		const tabs = within(tablist).getAllByRole("tab");

		expect(tabs).toHaveLength(7);
		expect(tabs[0]).toHaveTextContent(/tree/i);
		expect(tabs[1]).toHaveTextContent(/raw/i);
		expect(tabs[2]).toHaveTextContent(/table/i);
		expect(tabs[3]).toHaveTextContent(/diff/i);
	});

	it("marks current view as active tab", () => {
		renderToolbar({ viewMode: "raw" });

		const tabs = screen.getAllByRole("tab");
		const rawTab = tabs.find((t) => t.textContent?.match(/raw/i));
		expect(rawTab).toHaveAttribute("aria-selected", "true");
	});

	it("changes view mode on tab click", () => {
		renderToolbar({ viewMode: "tree" });

		const tabs = screen.getAllByRole("tab");
		const rawTab = tabs.find((t) => t.textContent?.match(/raw/i))!;
		fireEvent.click(rawTab);

		expect(useStore.getState().viewMode).toBe("raw");
	});

	it("shows expand/collapse in tree view", () => {
		renderToolbar({ viewMode: "tree" });

		// Should have expand or collapse button (Icon-based)
		expect(screen.getByTitle(/expand|collapse/i)).toBeInTheDocument();
	});

	it("shows sort button in tree view", () => {
		renderToolbar({ viewMode: "tree" });

		expect(screen.getByTitle(/sort/i)).toBeInTheDocument();
	});

	it("shows line numbers button in raw view", () => {
		renderToolbar({ viewMode: "raw" });

		expect(screen.getByTitle(/line numbers/i)).toBeInTheDocument();
	});

	it("shows prettify/minify buttons in raw view", () => {
		renderToolbar({ viewMode: "raw" });

		expect(screen.getByTitle(/prettify/i)).toBeInTheDocument();
		expect(screen.getByTitle(/minify/i)).toBeInTheDocument();
	});

	it("shows search button for tree/raw/edit views", () => {
		renderToolbar({ viewMode: "tree" });
		expect(screen.getByTitle(/search/i)).toBeInTheDocument();
	});

	it("hides search button in non-searchable views", () => {
		renderToolbar({ viewMode: "diff" });
		expect(screen.queryByTitle(/search/i)).not.toBeInTheDocument();
	});

	it("disables undo when undo stack is empty", () => {
		renderToolbar({ undoStack: [] });

		const undoButton = screen.getByTitle(/undo/i);
		expect(undoButton).toBeDisabled();
	});

	it("enables undo when undo stack is not empty", () => {
		renderToolbar({ undoStack: ['{"old":1}'] });

		const undoButton = screen.getByTitle(/undo/i);
		expect(undoButton).not.toBeDisabled();
	});

	it("disables redo when redo stack is empty", () => {
		renderToolbar({ redoStack: [] });

		const redoButton = screen.getByTitle(/redo/i);
		expect(redoButton).toBeDisabled();
	});

	it("renders copy, download, and help buttons", () => {
		renderToolbar();

		expect(screen.getByTitle(/copy.*json/i)).toBeInTheDocument();
		expect(screen.getByTitle(/download/i)).toBeInTheDocument();
		expect(screen.getByTitle(/keyboard|shortcuts/i)).toBeInTheDocument();
	});

	it("renders save to favorites button", () => {
		renderToolbar({ rawJson: '{"a":1}', viewMode: "tree" });

		expect(screen.getByTitle(/save.*favorite/i)).toBeInTheDocument();
	});

	it("hides save button in saved view", () => {
		renderToolbar({ viewMode: "saved" });

		expect(screen.queryByTitle(/save.*favorite/i)).not.toBeInTheDocument();
	});
});
