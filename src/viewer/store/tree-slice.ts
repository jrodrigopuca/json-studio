/**
 * Tree navigation slice — expand/collapse, select, focus nodes.
 */

import type { StateCreator } from "zustand";
import type { StoreState } from "./store.types";

export interface TreeSlice {
	// State
	expandedNodes: Set<number>;
	selectedNodeId: number | null;
	focusedNodeId: number | null;

	// Actions
	toggleNode: (nodeId: number) => void;
	expandNode: (nodeId: number) => void;
	collapseNode: (nodeId: number) => void;
	expandAll: () => void;
	collapseAll: () => void;
	expandToLevel: (level: number) => void;
	expandChildren: (nodeId: number) => void;
	collapseChildren: (nodeId: number) => void;
	selectNode: (nodeId: number | null) => void;
	setFocusedNode: (nodeId: number | null) => void;
	expandToNode: (nodeId: number) => void;
}

export const createTreeSlice: StateCreator<StoreState, [], [], TreeSlice> = (
	set,
	get,
) => ({
	expandedNodes: new Set([0]),
	selectedNodeId: null,
	focusedNodeId: null,

	toggleNode: (nodeId) => {
		const { expandedNodes } = get();
		const next = new Set(expandedNodes);
		if (next.has(nodeId)) {
			next.delete(nodeId);
		} else {
			next.add(nodeId);
		}
		set({ expandedNodes: next });
	},

	expandNode: (nodeId) => {
		const { expandedNodes } = get();
		if (!expandedNodes.has(nodeId)) {
			const next = new Set(expandedNodes);
			next.add(nodeId);
			set({ expandedNodes: next });
		}
	},

	collapseNode: (nodeId) => {
		const { expandedNodes } = get();
		if (expandedNodes.has(nodeId)) {
			const next = new Set(expandedNodes);
			next.delete(nodeId);
			set({ expandedNodes: next });
		}
	},

	expandAll: () => {
		const { nodes } = get();
		const all = new Set(nodes.filter((n) => n.isExpandable).map((n) => n.id));
		set({ expandedNodes: all });
	},

	collapseAll: () => set({ expandedNodes: new Set([0]) }),

	expandToLevel: (level) => {
		const { nodes } = get();
		const expanded = new Set<number>();
		nodes.forEach((n) => {
			if (n.isExpandable && n.depth < level) {
				expanded.add(n.id);
			}
		});
		set({ expandedNodes: expanded });
	},

	expandChildren: (nodeId) => {
		const { nodes, expandedNodes } = get();
		const node = nodes.find((n) => n.id === nodeId);
		if (!node || !node.isExpandable || !node.childrenRange) return;

		const next = new Set(expandedNodes);
		next.add(nodeId);

		const expandDescendants = (parentId: number) => {
			for (const n of nodes) {
				if (n.parentId === parentId && n.isExpandable) {
					next.add(n.id);
					expandDescendants(n.id);
				}
			}
		};
		expandDescendants(nodeId);
		set({ expandedNodes: next });
	},

	collapseChildren: (nodeId) => {
		const { nodes, expandedNodes } = get();
		const node = nodes.find((n) => n.id === nodeId);
		if (!node || !node.isExpandable) return;

		const next = new Set(expandedNodes);
		next.delete(nodeId);

		const collapseDescendants = (parentId: number) => {
			for (const n of nodes) {
				if (n.parentId === parentId && n.isExpandable) {
					next.delete(n.id);
					collapseDescendants(n.id);
				}
			}
		};
		collapseDescendants(nodeId);
		set({ expandedNodes: next });
	},

	selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

	setFocusedNode: (nodeId) => set({ focusedNodeId: nodeId }),

	expandToNode: (nodeId) => {
		const { nodes, expandedNodes } = get();
		const node = nodes.find((n) => n.id === nodeId);
		if (!node) return;

		const toExpand = new Set(expandedNodes);
		let current = node;
		while (current.parentId !== -1) {
			const parent = nodes.find((n) => n.id === current.parentId);
			if (!parent) break;
			if (parent.isExpandable) {
				toExpand.add(parent.id);
			}
			current = parent;
		}

		set({ expandedNodes: toExpand });
	},
});
