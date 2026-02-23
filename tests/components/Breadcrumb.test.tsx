/**
 * Breadcrumb component tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Breadcrumb } from "@viewer/components/Breadcrumb";
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

describe("Breadcrumb", () => {
	it("shows root ($) when no node is selected", () => {
		renderWithStore(<Breadcrumb />, { nodes: [], selectedNodeId: null });

		expect(screen.getByText("$")).toBeInTheDocument();
	});

	it("renders path segments for a selected node", () => {
		const nodes: FlatNode[] = [
			makeNode({ id: 0, key: null, path: "$", parentId: -1, isExpandable: true }),
			makeNode({ id: 1, key: "data", path: "$.data", parentId: 0, depth: 1, isExpandable: true }),
			makeNode({ id: 2, key: "name", path: "$.data.name", parentId: 1, depth: 2, value: "test" }),
		];

		renderWithStore(<Breadcrumb />, { nodes, selectedNodeId: 2 });

		expect(screen.getByText("$")).toBeInTheDocument();
		expect(screen.getByText("data")).toBeInTheDocument();
		expect(screen.getByText("name")).toBeInTheDocument();
	});

	it("renders separator between segments", () => {
		const nodes: FlatNode[] = [
			makeNode({ id: 0, path: "$", parentId: -1, isExpandable: true }),
			makeNode({ id: 1, key: "a", path: "$.a", parentId: 0, depth: 1 }),
		];

		renderWithStore(<Breadcrumb />, { nodes, selectedNodeId: 1 });

		expect(screen.getAllByText("/")).toHaveLength(1);
	});

	it("handles array index segments", () => {
		const nodes: FlatNode[] = [
			makeNode({ id: 0, path: "$", parentId: -1, isExpandable: true }),
			makeNode({ id: 1, key: "items", path: "$.items", parentId: 0, depth: 1, isExpandable: true }),
			makeNode({ id: 2, key: null, path: "$.items[0]", parentId: 1, depth: 2 }),
		];

		renderWithStore(<Breadcrumb />, { nodes, selectedNodeId: 2 });

		expect(screen.getByText("[0]")).toBeInTheDocument();
	});

	it("navigates on segment click", () => {
		const nodes: FlatNode[] = [
			makeNode({ id: 0, path: "$", parentId: -1, isExpandable: true }),
			makeNode({ id: 1, key: "data", path: "$.data", parentId: 0, depth: 1, isExpandable: true }),
			makeNode({ id: 2, key: "name", path: "$.data.name", parentId: 1, depth: 2 }),
		];

		renderWithStore(<Breadcrumb />, { nodes, selectedNodeId: 2 });

		fireEvent.click(screen.getByText("data"));
		// After clicking "data", the store should update selectedNodeId
		expect(useStore.getState().selectedNodeId).toBe(1);
	});

	it("has correct aria-label", () => {
		renderWithStore(<Breadcrumb />, { nodes: [], selectedNodeId: null });

		expect(screen.getByRole("navigation")).toHaveAttribute("aria-label");
	});

	it("marks last segment as aria-current=location", () => {
		const nodes: FlatNode[] = [
			makeNode({ id: 0, path: "$", parentId: -1, isExpandable: true }),
			makeNode({ id: 1, key: "x", path: "$.x", parentId: 0, depth: 1 }),
		];

		renderWithStore(<Breadcrumb />, { nodes, selectedNodeId: 1 });

		const buttons = screen.getAllByRole("button");
		const lastButton = buttons[buttons.length - 1]!;
		expect(lastButton).toHaveAttribute("aria-current", "location");
	});
});
