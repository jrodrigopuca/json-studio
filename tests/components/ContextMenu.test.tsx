/**
 * ContextMenu component tests.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ContextMenu } from "@viewer/components/ContextMenu";
import { renderWithStore, resetStore } from "../helpers";
import type { FlatNode } from "@viewer/core/parser.types";

afterEach(resetStore);

const baseNode: FlatNode = {
	id: 1,
	key: "name",
	value: "John",
	type: "string",
	depth: 1,
	path: "$.name",
	parentId: 0,
	isExpandable: false,
	childCount: 0,
	childrenRange: null,
};

const expandableNode: FlatNode = {
	...baseNode,
	id: 2,
	key: "data",
	value: null,
	type: "object",
	isExpandable: true,
	childrenRange: [3, 5],
};

const defaultHandlers = {
	onCopyKey: vi.fn(),
	onCopyPath: vi.fn(),
	onCopyValue: vi.fn(),
	onCopyFormattedJson: vi.fn(),
	onExpandChildren: vi.fn(),
	onCollapseChildren: vi.fn(),
	onFocusNode: vi.fn(),
	onClose: vi.fn(),
};

function renderContextMenu(
	overrides: Partial<Parameters<typeof ContextMenu>[0]> = {},
) {
	const props = {
		position: { x: 100, y: 200 },
		node: baseNode,
		isExpanded: false,
		...defaultHandlers,
		...overrides,
	};
	return renderWithStore(<ContextMenu {...props} />);
}

describe("ContextMenu", () => {
	it("renders copy options for a node with a key", () => {
		renderContextMenu();

		expect(screen.getByRole("menuitem", { name: /copy key/i })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: /copy path/i })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: /copy value/i })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: /copy formatted/i })).toBeInTheDocument();
	});

	it("hides copy key for nodes without a key", () => {
		const noKeyNode = { ...baseNode, key: null };
		renderContextMenu({ node: noKeyNode });

		expect(screen.queryByRole("menuitem", { name: /copy key/i })).not.toBeInTheDocument();
		// Other copy options still present
		expect(screen.getByRole("menuitem", { name: /copy path/i })).toBeInTheDocument();
	});

	it("shows expand/collapse for expandable nodes", () => {
		renderContextMenu({ node: expandableNode, isExpanded: false });

		expect(screen.getByRole("menuitem", { name: /expand children/i })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: /filter to this/i })).toBeInTheDocument();
	});

	it("shows collapse when expanded", () => {
		renderContextMenu({ node: expandableNode, isExpanded: true });

		expect(screen.getByRole("menuitem", { name: /collapse children/i })).toBeInTheDocument();
	});

	it("does not show expand/collapse for non-expandable nodes", () => {
		renderContextMenu({ node: baseNode });

		expect(screen.queryByRole("menuitem", { name: /expand children/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: /collapse children/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: /filter/i })).not.toBeInTheDocument();
	});

	it("calls handler and closes on copy path click", () => {
		const handlers = { ...defaultHandlers, onCopyPath: vi.fn(), onClose: vi.fn() };
		renderContextMenu(handlers);

		fireEvent.click(screen.getByRole("menuitem", { name: /copy path/i }));

		expect(handlers.onCopyPath).toHaveBeenCalledOnce();
		expect(handlers.onClose).toHaveBeenCalledOnce();
	});

	it("calls handler and closes on copy value click", () => {
		const handlers = { ...defaultHandlers, onCopyValue: vi.fn(), onClose: vi.fn() };
		renderContextMenu(handlers);

		fireEvent.click(screen.getByRole("menuitem", { name: /copy value/i }));

		expect(handlers.onCopyValue).toHaveBeenCalledOnce();
		expect(handlers.onClose).toHaveBeenCalledOnce();
	});

	it("calls onClose when overlay is clicked", () => {
		const onClose = vi.fn();
		renderContextMenu({ onClose });

		// The overlay is the sibling div before the menu
		const overlay = document.querySelector("[class*='overlay']");
		expect(overlay).toBeTruthy();
		fireEvent.click(overlay!);

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("calls onClose on Escape key", () => {
		const onClose = vi.fn();
		renderContextMenu({ onClose });

		fireEvent.keyDown(window, { key: "Escape" });

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("has role=menu on the menu container", () => {
		renderContextMenu();

		expect(screen.getByRole("menu")).toBeInTheDocument();
	});
});
