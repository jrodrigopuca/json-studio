/**
 * TreeViewHeader component tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { TreeViewHeader } from "@viewer/components/TreeView/TreeViewHeader";
import { renderWithStore, resetStore } from "../helpers";
import { useStore } from "@viewer/store";
import type { FlatNode } from "@viewer/core/parser.types";

afterEach(resetStore);

const makeNode = (overrides: Partial<FlatNode> & { id: number }): FlatNode => ({
	key: null,
	value: null,
	type: "object",
	depth: 0,
	path: "$",
	parentId: -1,
	isExpandable: false,
	childCount: 0,
	childrenRange: null,
	...overrides,
});

describe("TreeViewHeader", () => {
	it("renders expand and collapse buttons", () => {
		renderWithStore(<TreeViewHeader />, {
			nodes: [makeNode({ id: 0 })],
			maxDepth: 2,
		});

		expect(screen.getByTitle(/expand all/i)).toBeInTheDocument();
		expect(screen.getByTitle(/collapse all/i)).toBeInTheDocument();
	});

	it("displays node count", () => {
		const nodes = [
			makeNode({ id: 0 }),
			makeNode({ id: 1, depth: 1 }),
			makeNode({ id: 2, depth: 1 }),
		];

		renderWithStore(<TreeViewHeader />, { nodes, maxDepth: 2 });

		expect(screen.getByText(/3/)).toBeInTheDocument();
	});

	it("shows level select when maxDepth > 1", () => {
		renderWithStore(<TreeViewHeader />, {
			nodes: [makeNode({ id: 0 })],
			maxDepth: 3,
		});

		const select = screen.getByTitle(/expand to.*level/i);
		expect(select).toBeInTheDocument();
		expect(select.tagName).toBe("SELECT");
	});

	it("hides level select when maxDepth <= 1", () => {
		renderWithStore(<TreeViewHeader />, {
			nodes: [makeNode({ id: 0 })],
			maxDepth: 1,
		});

		expect(screen.queryByTitle(/expand to.*level/i)).not.toBeInTheDocument();
	});

	it("calls expandAll on expand button click", () => {
		renderWithStore(<TreeViewHeader />, {
			nodes: [makeNode({ id: 0, isExpandable: true, childrenRange: [1, 2] })],
			maxDepth: 2,
		});

		fireEvent.click(screen.getByTitle(/expand all/i));

		// After expandAll, expandedNodes should have the expandable node
		expect(useStore.getState().expandedNodes.size).toBeGreaterThan(0);
	});

	it("calls collapseAll on collapse button click", () => {
		const node = makeNode({ id: 0, isExpandable: true, childrenRange: [1, 2] });
		renderWithStore(<TreeViewHeader />, {
			nodes: [node],
			maxDepth: 2,
			expandedNodes: new Set([0]),
		});

		fireEvent.click(screen.getByTitle(/collapse all/i));

		// collapseAll keeps root (id=0) expanded
		expect(useStore.getState().expandedNodes.size).toBe(1);
		expect(useStore.getState().expandedNodes.has(0)).toBe(true);
	});

	it("shows clear filter when a node is focused", () => {
		const nodes = [
			makeNode({ id: 0, path: "$", isExpandable: true, childrenRange: [1, 2] }),
			makeNode({ id: 1, key: "data", path: "$.data", parentId: 0, depth: 1 }),
		];

		renderWithStore(<TreeViewHeader />, {
			nodes,
			maxDepth: 2,
			focusedNodeId: 1,
		});

		expect(screen.getByTitle(/clear filter/i)).toBeInTheDocument();
		expect(screen.getByText("$.data")).toBeInTheDocument();
	});

	it("clears focus on clear filter click", () => {
		const nodes = [
			makeNode({ id: 0, path: "$" }),
			makeNode({ id: 1, key: "data", path: "$.data", parentId: 0, depth: 1 }),
		];

		renderWithStore(<TreeViewHeader />, {
			nodes,
			maxDepth: 2,
			focusedNodeId: 1,
		});

		fireEvent.click(screen.getByTitle(/clear filter/i));

		expect(useStore.getState().focusedNodeId).toBeNull();
	});

	it("level select has 'All' option", () => {
		renderWithStore(<TreeViewHeader />, {
			nodes: [makeNode({ id: 0 })],
			maxDepth: 3,
		});

		const options = screen.getAllByRole("option");
		const allOption = options.find((o) => o.textContent?.match(/all/i));
		expect(allOption).toBeTruthy();
	});
});
