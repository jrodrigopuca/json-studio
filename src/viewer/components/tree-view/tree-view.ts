/**
 * Tree View component — Renders JSON as a collapsible tree with virtualisation.
 *
 * Features:
 * - Expand/collapse with arrow icons
 * - Syntax-colored values
 * - Clickable URLs in strings
 * - Virtual scrolling for large files
 * - Keyboard navigation (↑↓←→, Enter, Space)
 * - Right-click context menu (copy value/path)
 */

import { BaseComponent } from "../../base-component.js";
import {
	createElement,
	escapeHtml,
	copyToClipboard,
} from "../../../shared/dom.js";
import {
	createVirtualScroll,
	type VirtualScrollInstance,
} from "../../core/virtual-scroll.js";
import type { AppState } from "../../core/store.types.js";
import type { FlatNode } from "../../core/parser.types.js";

export class TreeView extends BaseComponent {
	private virtualScroll: VirtualScrollInstance | null = null;
	private visibleNodes: FlatNode[] = [];
	private contextMenu: HTMLElement | null = null;

	render(container: HTMLElement): void {
		this.el = createElement("div", {
			className: "js-tree-view js-main",
			attributes: {
				role: "tree",
				tabindex: "0",
				"aria-label": "JSON tree view",
			},
		});

		container.appendChild(this.el);

		// Subscribe to relevant state changes
		this.watch(
			[
				"nodes",
				"expandedNodes",
				"selectedNodeId",
				"searchMatches",
				"searchCurrentIndex",
			],
			(state) => this.update(state),
		);

		// Keyboard navigation
		this.on(this.el, "keydown", (e) => this.handleKeyDown(e));

		// Context menu
		this.on(this.el, "contextmenu", (e) => this.handleContextMenu(e));

		// Close context menu on click outside
		this.on(document, "click", () => this.closeContextMenu());

		// Initial render
		this.update(this.store.getState());
	}

	update(state: Partial<AppState>): void {
		const fullState = this.store.getState();

		if (state.nodes !== undefined || state.expandedNodes !== undefined) {
			this.visibleNodes = this.computeVisibleNodes(
				fullState.nodes,
				fullState.expandedNodes,
			);
			this.renderTree();
		} else if (
			state.selectedNodeId !== undefined ||
			state.searchMatches !== undefined ||
			state.searchCurrentIndex !== undefined
		) {
			this.updateNodeStates();
		}
	}

	/**
	 * Computes which nodes are visible given the current expanded state.
	 * Only nodes whose entire ancestor chain is expanded are visible.
	 */
	private computeVisibleNodes(
		allNodes: FlatNode[],
		expandedNodes: Set<number>,
	): FlatNode[] {
		if (allNodes.length === 0) return [];

		const visible: FlatNode[] = [];
		const hiddenParents = new Set<number>();

		for (const node of allNodes) {
			// Root is always visible
			if (node.parentId === -1) {
				visible.push(node);
				continue;
			}

			// Skip if any ancestor is collapsed (hidden)
			if (hiddenParents.has(node.parentId)) {
				if (node.isExpandable) {
					hiddenParents.add(node.id);
				}
				continue;
			}

			// Check if parent is expanded
			if (expandedNodes.has(node.parentId)) {
				visible.push(node);
			} else {
				if (node.isExpandable) {
					hiddenParents.add(node.id);
				}
			}
		}

		return visible;
	}

	/**
	 * Renders the tree view using virtual scrolling.
	 */
	private renderTree(): void {
		// Dispose previous virtual scroll
		this.virtualScroll?.dispose();

		if (this.visibleNodes.length === 0) {
			this.el.innerHTML =
				'<div style="padding: 16px; color: var(--text-secondary);">Empty JSON</div>';
			return;
		}

		// Clear the element but keep it as scroll container
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		this.virtualScroll = createVirtualScroll({
			container: this.el,
			totalItems: this.visibleNodes.length,
			renderItem: (index) => this.renderNode(index),
		});

		this.addDisposable(() => this.virtualScroll?.dispose());
	}

	/**
	 * Renders a single tree node.
	 */
	private renderNode(index: number): HTMLElement {
		const node = this.visibleNodes[index]!;
		const state = this.store.getState();

		const row = createElement("div", {
			className: "js-tree-view__node",
			attributes: {
				role: "treeitem",
				"aria-level": String(node.depth + 1),
				"aria-expanded": node.isExpandable
					? String(state.expandedNodes.has(node.id))
					: "",
				"data-node-id": String(node.id),
			},
		});

		// Selected state
		if (state.selectedNodeId === node.id) {
			row.classList.add("js-tree-view__node--selected");
		}

		// Search match state
		if (state.searchMatches.includes(node.id)) {
			row.classList.add("js-tree-view__node--search-match");
		}
		if (
			state.searchMatches.length > 0 &&
			state.searchMatches[state.searchCurrentIndex] === node.id
		) {
			row.classList.add("js-tree-view__node--search-current");
		}

		// Indentation
		const indent = createElement("span", {
			className: "js-tree-view__indent",
		});
		indent.style.width = `${node.depth * parseInt(getComputedStyle(document.documentElement).getPropertyValue("--indent") || "20")}px`;
		row.appendChild(indent);

		// Toggle arrow (expand/collapse)
		if (node.isExpandable) {
			const toggle = createElement("button", {
				className: `js-tree-view__toggle ${state.expandedNodes.has(node.id) ? "js-tree-view__toggle--expanded" : ""}`,
				textContent: "▶",
				attributes: {
					"aria-label": state.expandedNodes.has(node.id)
						? "Collapse"
						: "Expand",
				},
			});
			toggle.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleNode(node.id);
			});
			row.appendChild(toggle);
		} else {
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__toggle js-tree-view__toggle--placeholder",
				}),
			);
		}

		// Key
		if (node.key !== null) {
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__key",
					textContent: `"${node.key}"`,
				}),
			);
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__colon",
					textContent: ":",
				}),
			);
		}

		// Value or container indicator
		if (node.type === "object") {
			const isExpanded = state.expandedNodes.has(node.id);
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__bracket",
					textContent: isExpanded ? "{" : "{…}",
				}),
			);
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__count",
					textContent: `${node.childCount}`,
				}),
			);
			if (isExpanded) {
				// Closing bracket will be implied by child structure
			}
		} else if (node.type === "array") {
			const isExpanded = state.expandedNodes.has(node.id);
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__bracket",
					textContent: isExpanded ? "[" : "[…]",
				}),
			);
			row.appendChild(
				createElement("span", {
					className: "js-tree-view__count",
					textContent: `${node.childCount}`,
				}),
			);
		} else {
			const valueStr = formatValue(node);
			row.appendChild(
				createElement("span", {
					className: `js-tree-view__value js-tree-view__value--${node.type}`,
					innerHTML:
						node.type === "string"
							? formatStringValue(String(node.value))
							: escapeHtml(valueStr),
				}),
			);
		}

		// Click to select
		row.addEventListener("click", () => {
			this.store.setState({ selectedNodeId: node.id });
		});

		// Double-click to copy value
		row.addEventListener("dblclick", () => {
			const value = node.isExpandable ? "" : formatValue(node);
			copyToClipboard(value);
		});

		return row;
	}

	/**
	 * Toggles expansion of a node.
	 */
	private toggleNode(nodeId: number): void {
		const expanded = new Set(this.store.getState().expandedNodes);
		if (expanded.has(nodeId)) {
			expanded.delete(nodeId);
		} else {
			expanded.add(nodeId);
		}
		this.store.setState({ expandedNodes: expanded });
	}

	/**
	 * Updates CSS classes on existing nodes (selected, search match).
	 */
	private updateNodeStates(): void {
		// Trigger a full re-render for simplicity; virtual scroll handles performance
		this.virtualScroll?.refresh();
	}

	/**
	 * Handles keyboard navigation within the tree.
	 */
	private handleKeyDown(e: KeyboardEvent): void {
		const state = this.store.getState();
		const currentIndex = this.visibleNodes.findIndex(
			(n) => n.id === state.selectedNodeId,
		);

		switch (e.key) {
			case "ArrowDown":
			case "j": {
				e.preventDefault();
				const nextIndex = Math.min(
					currentIndex + 1,
					this.visibleNodes.length - 1,
				);
				const nextNode = this.visibleNodes[nextIndex];
				if (nextNode) {
					this.store.setState({ selectedNodeId: nextNode.id });
					this.virtualScroll?.scrollToItem(nextIndex);
				}
				break;
			}
			case "ArrowUp":
			case "k": {
				e.preventDefault();
				const prevIndex = Math.max(currentIndex - 1, 0);
				const prevNode = this.visibleNodes[prevIndex];
				if (prevNode) {
					this.store.setState({ selectedNodeId: prevNode.id });
					this.virtualScroll?.scrollToItem(prevIndex);
				}
				break;
			}
			case "ArrowRight": {
				e.preventDefault();
				const currentNode = this.visibleNodes[currentIndex];
				if (
					currentNode?.isExpandable &&
					!state.expandedNodes.has(currentNode.id)
				) {
					this.toggleNode(currentNode.id);
				} else if (currentNode?.isExpandable) {
					// Move to first child
					const nextNode = this.visibleNodes[currentIndex + 1];
					if (nextNode) {
						this.store.setState({ selectedNodeId: nextNode.id });
					}
				}
				break;
			}
			case "ArrowLeft": {
				e.preventDefault();
				const currentNode = this.visibleNodes[currentIndex];
				if (
					currentNode?.isExpandable &&
					state.expandedNodes.has(currentNode.id)
				) {
					this.toggleNode(currentNode.id);
				} else if (currentNode) {
					// Move to parent
					const parentNode = this.visibleNodes.find(
						(n) => n.id === currentNode.parentId,
					);
					if (parentNode) {
						const parentIndex = this.visibleNodes.indexOf(parentNode);
						this.store.setState({ selectedNodeId: parentNode.id });
						this.virtualScroll?.scrollToItem(parentIndex);
					}
				}
				break;
			}
			case "Enter":
			case " ": {
				e.preventDefault();
				const currentNode = this.visibleNodes[currentIndex];
				if (currentNode?.isExpandable) {
					this.toggleNode(currentNode.id);
				}
				break;
			}
		}
	}

	/**
	 * Shows a context menu on right-click.
	 */
	private handleContextMenu(e: MouseEvent): void {
		e.preventDefault();
		const target = (e.target as HTMLElement).closest("[data-node-id]");
		if (!target) return;

		const nodeId = parseInt(target.getAttribute("data-node-id")!, 10);
		const node = this.store.getState().nodes.find((n) => n.id === nodeId);
		if (!node) return;

		this.closeContextMenu();

		const menu = createElement("div", {
			className: "js-tree-view__context-menu",
		});
		menu.style.left = `${e.clientX}px`;
		menu.style.top = `${e.clientY}px`;

		const actions = [
			{ label: "Copy Value", action: () => copyToClipboard(formatValue(node)) },
			{ label: "Copy Path", action: () => copyToClipboard(node.path) },
		];

		if (node.key !== null) {
			actions.push({
				label: "Copy Key",
				action: () => copyToClipboard(node.key!),
			});
		}

		for (const { label, action } of actions) {
			const btn = createElement("button", {
				className: "js-tree-view__context-item",
				textContent: label,
			});
			btn.addEventListener("click", () => {
				action();
				this.closeContextMenu();
			});
			menu.appendChild(btn);
		}

		document.body.appendChild(menu);
		this.contextMenu = menu;
	}

	private closeContextMenu(): void {
		this.contextMenu?.remove();
		this.contextMenu = null;
	}

	dispose(): void {
		this.closeContextMenu();
		this.virtualScroll?.dispose();
		super.dispose();
	}
}

/**
 * Formats a node's value for display.
 */
function formatValue(node: FlatNode): string {
	if (node.type === "null") return "null";
	if (node.type === "string") return `"${node.value}"`;
	return String(node.value);
}

/**
 * Formats a string value, making URLs clickable.
 */
function formatStringValue(value: string): string {
	const urlPattern = /https?:\/\/[^\s"]+/g;
	const escaped = escapeHtml(`"${value}"`);

	if (!urlPattern.test(value)) {
		return escaped;
	}

	urlPattern.lastIndex = 0;
	return `"${value.replace(urlPattern, (url) => {
		const escapedUrl = escapeHtml(url);
		return `<a class="js-url" href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
	})}"`;
}
