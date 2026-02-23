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
import { prettyPrint } from "../../core/formatter.js";
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

		// Indentation with indent guides
		const indent = createElement("span", {
			className: "js-tree-view__indent",
		});
		const indentPx = parseInt(
			getComputedStyle(document.documentElement).getPropertyValue("--indent") ||
				"20",
		);
		indent.style.width = `${node.depth * indentPx}px`;

		// Add indent guide lines
		for (let d = 1; d <= node.depth; d++) {
			const guide = createElement("span", {
				className: "js-tree-view__indent-guide",
			});
			guide.style.left = `${(d - 1) * indentPx + indentPx / 2 + parseInt(getComputedStyle(document.documentElement).getPropertyValue("--gap-md") || "12")}px`;
			row.appendChild(guide);
		}

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

		// Click on key to copy path
		const keyEl = row.querySelector(".js-tree-view__key") as HTMLElement | null;
		if (keyEl) {
			keyEl.style.cursor = "pointer";
			keyEl.title = `Click to copy path: ${node.path}`;
			keyEl.addEventListener("click", (e) => {
				e.stopPropagation();
				copyToClipboard(node.path);
				// Brief visual feedback
				keyEl.classList.add("js-tree-view__key--copied");
				setTimeout(
					() => keyEl.classList.remove("js-tree-view__key--copied"),
					600,
				);
			});
		}

		// Double-click to edit value (always enabled for leaf nodes)
		row.addEventListener("dblclick", (e) => {
			if (!node.isExpandable) {
				e.preventDefault();
				e.stopPropagation();
				this.startInlineEdit(row, node);
			} else {
				// Copy value for expandable nodes
				const value = formatValue(node);
				if (value) copyToClipboard(value);
			}
		});

		// Show edit cursor for editable values
		if (!node.isExpandable) {
			const valueEl = row.querySelector(".js-tree-view__value") as HTMLElement;
			if (valueEl) {
				valueEl.style.cursor = "text";
				valueEl.title = "Double-click to edit";
			}
		}

		return row;
	}

	/**
	 * Starts inline editing for a node value.
	 */
	private startInlineEdit(row: HTMLElement, node: FlatNode): void {
		const valueEl = row.querySelector(".js-tree-view__value") as HTMLElement;
		if (!valueEl) return;

		// Get current display value (without quotes for strings)
		const currentValue =
			node.type === "string" ? String(node.value) : formatValue(node);

		// Create textarea for more editing space
		const textarea = document.createElement("textarea");
		textarea.className = "js-tree-view__edit-input";
		textarea.value = currentValue;
		textarea.rows = 1;
		// Auto-expand based on content, min 200px, max 500px width
		const estimatedWidth = Math.min(
			Math.max(currentValue.length * 8 + 40, 200),
			500,
		);
		textarea.style.width = `${estimatedWidth}px`;

		// Auto-resize height based on content
		const autoResize = (): void => {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
		};

		// Replace value with textarea
		valueEl.style.display = "none";
		row.insertBefore(textarea, valueEl.nextSibling);
		textarea.focus();
		textarea.select();
		autoResize();

		const commit = (): void => {
			const newValue = textarea.value;
			textarea.remove();
			valueEl.style.display = "";

			this.commitEdit(node, newValue);
		};

		const cancel = (): void => {
			textarea.remove();
			valueEl.style.display = "";
		};

		textarea.addEventListener("input", autoResize);

		textarea.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				commit();
			} else if (e.key === "Escape") {
				e.preventDefault();
				cancel();
			}
		});

		textarea.addEventListener("blur", () => {
			// Small delay to allow Enter to fire first
			setTimeout(() => {
				if (textarea.parentElement) {
					commit();
				}
			}, 50);
		});
	}

	/**
	 * Commits an inline edit, updating the JSON and re-parsing.
	 */
	private commitEdit(node: FlatNode, newValueStr: string): void {
		const { rawJson, undoStack } = this.store.getState();

		try {
			const parsed = JSON.parse(rawJson);

			// Navigate to the node using its path and set the new value
			const newValue = parseEditValue(newValueStr);
			setValueAtPath(parsed, node.path, newValue);

			const updated = prettyPrint(JSON.stringify(parsed));

			this.store.setState({
				rawJson: updated,
				undoStack: [...undoStack, rawJson],
				redoStack: [],
				fileSize: new Blob([updated]).size,
			});
		} catch {
			// If edit fails, silently revert
		}
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

/**
 * Parses a user-entered edit value into the correct JS type.
 */
function parseEditValue(str: string): unknown {
	const trimmed = str.trim();
	if (trimmed === "null") return null;
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed === "") return "";

	// Try as number
	const num = Number(trimmed);
	if (!isNaN(num) && trimmed !== "") return num;

	// Default to string
	return trimmed;
}

/**
 * Sets a value at a JSONPath in a parsed JSON object.
 * Supports paths like $.key, $.arr[0], $.nested.deep.value
 */
function setValueAtPath(obj: unknown, path: string, value: unknown): void {
	// Parse JSONPath: $ > key > [0] > nested
	const segments = parsePath(path);
	if (segments.length === 0) return;

	let current: unknown = obj;
	for (let i = 0; i < segments.length - 1; i++) {
		const seg = segments[i]!;
		if (typeof seg === "number") {
			current = (current as unknown[])[seg];
		} else {
			current = (current as Record<string, unknown>)[seg];
		}
		if (current === null || current === undefined) return;
	}

	const lastSeg = segments[segments.length - 1]!;
	if (typeof lastSeg === "number") {
		(current as unknown[])[lastSeg] = value;
	} else {
		(current as Record<string, unknown>)[lastSeg] = value;
	}
}

/**
 * Parses a JSONPath string into path segments.
 * "$" → []
 * "$.name" → ["name"]
 * "$.users[0].name" → ["users", 0, "name"]
 */
function parsePath(path: string): (string | number)[] {
	const segments: (string | number)[] = [];
	// Remove leading $
	let remaining = path.startsWith("$") ? path.substring(1) : path;

	while (remaining.length > 0) {
		if (remaining.startsWith(".")) {
			remaining = remaining.substring(1);
		}

		if (remaining.startsWith("[")) {
			const end = remaining.indexOf("]");
			if (end === -1) break;
			const indexStr = remaining.substring(1, end);
			segments.push(parseInt(indexStr, 10));
			remaining = remaining.substring(end + 1);
		} else {
			const dotIndex = remaining.indexOf(".");
			const bracketIndex = remaining.indexOf("[");
			let endIndex: number;

			if (dotIndex === -1 && bracketIndex === -1) {
				endIndex = remaining.length;
			} else if (dotIndex === -1) {
				endIndex = bracketIndex;
			} else if (bracketIndex === -1) {
				endIndex = dotIndex;
			} else {
				endIndex = Math.min(dotIndex, bracketIndex);
			}

			segments.push(remaining.substring(0, endIndex));
			remaining = remaining.substring(endIndex);
		}
	}

	return segments;
}
