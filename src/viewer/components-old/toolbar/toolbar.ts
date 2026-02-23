/**
 * Toolbar component — brand, view tabs, and context-aware action buttons.
 *
 * Each button is tagged with the view modes where it's relevant.
 * Switching views automatically shows/hides buttons for that context.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { prettyPrint, minify } from "../../core/formatter.js";
import {
	jsonToYaml,
	jsonToCsv,
	jsonToTypeScript,
	yamlToJson,
} from "../../core/converter.js";
import type { AppState, Bookmark } from "../../core/store.types.js";
import type { ViewMode } from "../../../shared/types.js";
import type { ToolbarTab } from "./toolbar.types.js";

const TABS: ToolbarTab[] = [
	{ id: "tree", label: "Tree", shortcut: "⌘1" },
	{ id: "raw", label: "Raw", shortcut: "⌘2" },
	{ id: "table", label: "Table", shortcut: "⌘3" },
	{ id: "diff", label: "Diff", shortcut: "⌘4" },
	{ id: "edit", label: "Edit", shortcut: "⌘5" },
];

/** Maps an element to the set of view modes where it should be visible. */
type ViewScoped = { el: HTMLElement; views: ViewMode[] };

export class Toolbar extends BaseComponent {
	private tabButtons: Map<ViewMode, HTMLButtonElement> = new Map();
	private isAllExpanded = false;
	/** Elements scoped to specific view modes. */
	private scopedElements: ViewScoped[] = [];
	/** Bookmarks panel element. */
	private bookmarksPanel: HTMLElement | null = null;
	/** Export dropdown element. */
	private exportDropdown: HTMLElement | null = null;

	render(container: HTMLElement): void {
		this.el = createElement("header", { className: "js-toolbar" });

		// Brand
		const brand = createElement("div", {
			className: "js-toolbar__brand",
			children: [
				createElement("span", {
					className: "js-toolbar__brand-icon",
					textContent: "⚡",
				}),
				createElement("span", { textContent: "JSON Spark" }),
			],
		});
		this.el.appendChild(brand);

		// View tabs
		const tabs = createElement("div", { className: "js-toolbar__tabs" });
		for (const tab of TABS) {
			const btn = createElement("button", {
				className: "js-toolbar__tab",
				textContent: tab.label,
				attributes: {
					"data-view": tab.id,
					title: `${tab.label} (${tab.shortcut})`,
					"aria-label": `Switch to ${tab.label} view`,
				},
			});
			this.on(btn, "click", () => {
				this.changeViewModeWithConfirmation(tab.id);
			});
			tabs.appendChild(btn);
			this.tabButtons.set(tab.id, btn);
		}
		this.el.appendChild(tabs);

		// Spacer
		this.el.appendChild(
			createElement("div", { className: "js-toolbar__spacer" }),
		);

		// Helper: add a button scoped to specific views
		const scoped = (el: HTMLElement, views: ViewMode[]): HTMLElement => {
			this.scopedElements.push({ el, views });
			return el;
		};

		// Action buttons
		const actions = createElement("div", { className: "js-toolbar__actions" });

		// ── Tree/Raw/Edit: Search toggle ──
		const searchBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "🔍",
			attributes: {
				title: "Search — Find text in JSON (Ctrl+F)",
				"aria-label": "Toggle search",
			},
		});
		this.on(searchBtn, "click", () => {
			const current = this.store.getState().searchQuery;
			this.store.setState({ searchQuery: current ? "" : " " });
			document
				.querySelector<HTMLInputElement>(".js-search-bar__input")
				?.focus();
		});
		actions.appendChild(scoped(searchBtn, ["tree", "raw", "edit"]));

		// ── Tree-only: Expand/Collapse toggle ──
		const expandToggleBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__expand-toggle",
			textContent: "⊞",
			attributes: {
				title: "Expand All — Open every node in the tree",
				"aria-label": "Toggle expand/collapse all nodes",
			},
		});
		this.on(expandToggleBtn, "click", () => {
			if (this.isAllExpanded) {
				this.store.setState({ expandedNodes: new Set<number>() });
			} else {
				const { nodes } = this.store.getState();
				const allExpandable = new Set(
					nodes.filter((n) => n.isExpandable).map((n) => n.id),
				);
				this.store.setState({ expandedNodes: allExpandable });
			}
		});
		actions.appendChild(scoped(expandToggleBtn, ["tree"]));

		// ── Edit full JSON (tree + raw) ──
		const editBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__edit-btn",
			textContent: "✏️",
			attributes: {
				title: "Edit JSON — Switch to full editor (⌘5)",
				"aria-label": "Edit full JSON",
			},
		});
		this.on(editBtn, "click", () =>
			this.changeViewModeWithConfirmation("edit"),
		);
		actions.appendChild(scoped(editBtn, ["tree", "raw", "table"]));

		// ── Undo (tree + edit) ──
		const undoBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__undo-btn",
			textContent: "↩",
			attributes: {
				title: "Undo — Revert last edit (Ctrl+Z)",
				"aria-label": "Undo last edit",
			},
		});
		this.on(undoBtn, "click", () => this.performUndo());
		actions.appendChild(scoped(undoBtn, ["tree", "edit"]));

		// ── Redo (tree + edit) ──
		const redoBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__redo-btn",
			textContent: "↪",
			attributes: {
				title: "Redo — Re-apply undone edit (Ctrl+Shift+Z)",
				"aria-label": "Redo last undone edit",
			},
		});
		this.on(redoBtn, "click", () => this.performRedo());
		actions.appendChild(scoped(redoBtn, ["tree", "edit"]));

		// ── Separator (tree + raw only) ──
		actions.appendChild(
			scoped(createElement("span", { className: "js-toolbar__separator" }), [
				"tree",
				"raw",
			]),
		);

		// ── Copy — all views ──
		const copyBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "📋",
			attributes: {
				title: "Copy — Copy entire JSON to clipboard",
				"aria-label": "Copy entire JSON",
			},
		});
		this.on(copyBtn, "click", async () => {
			const { rawJson } = this.store.getState();
			await navigator.clipboard.writeText(rawJson);
		});
		actions.appendChild(copyBtn);

		// ── Raw-only: Prettify & Minify ──
		const prettifyBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "{ }",
			attributes: {
				title: "Prettify — Format JSON with indentation",
				"aria-label": "Prettify JSON",
			},
		});
		this.on(prettifyBtn, "click", () => {
			const { rawJson } = this.store.getState();
			const formatted = prettyPrint(rawJson);
			this.store.setState({ rawJson: formatted });
		});
		actions.appendChild(scoped(prettifyBtn, ["raw"]));

		const minifyBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "{}",
			attributes: {
				title: "Minify — Compress JSON removing whitespace",
				"aria-label": "Minify JSON",
			},
		});
		this.on(minifyBtn, "click", () => {
			const { rawJson } = this.store.getState();
			const minified = minify(rawJson);
			this.store.setState({ rawJson: minified });
		});
		actions.appendChild(scoped(minifyBtn, ["raw"]));

		// ── Edit-only: Save & Discard ──
		const saveBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__save-btn",
			textContent: "💾",
			attributes: {
				title: "Save — Apply changes and sync with other views (Ctrl+S)",
				"aria-label": "Save changes",
			},
		});
		this.on(saveBtn, "click", () => this.dispatchEditAction("save"));
		actions.appendChild(scoped(saveBtn, ["edit"]));

		const discardBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__discard-btn",
			textContent: "↩️",
			attributes: {
				title: "Discard — Revert to last saved state",
				"aria-label": "Discard changes",
			},
		});
		this.on(discardBtn, "click", () => this.dispatchEditAction("discard"));
		actions.appendChild(scoped(discardBtn, ["edit"]));

		// ── Tree + Raw: Sort by keys ──
		const sortBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__sort-btn",
			textContent: "A↓",
			attributes: {
				title: "Sort Keys — Reorder all object keys alphabetically",
				"aria-label": "Sort keys alphabetically",
			},
		});
		this.on(sortBtn, "click", () => {
			const { sortedByKeys } = this.store.getState();
			this.store.setState({ sortedByKeys: !sortedByKeys });
		});
		actions.appendChild(scoped(sortBtn, ["tree", "raw"]));

		// ── Separator before utility group ──
		actions.appendChild(
			createElement("span", { className: "js-toolbar__separator" }),
		);

		// ── Import file — all views ──
		const importBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "📂",
			attributes: {
				title: "Import — Open a local JSON, YAML, or XML file",
				"aria-label": "Import file",
			},
		});
		this.on(importBtn, "click", () => this.importFile());
		actions.appendChild(importBtn);

		// ── Export dropdown — all views except diff ──
		const exportWrapper = createElement("div", {
			className: "js-toolbar__dropdown-wrapper",
		});

		const exportBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "⤓",
			attributes: {
				title: "Export — Download as JSON, YAML, CSV, or TypeScript",
				"aria-label": "Export JSON to other formats",
			},
		});
		this.on(exportBtn, "click", () => this.toggleExportDropdown());

		this.exportDropdown = createElement("div", {
			className: "js-toolbar__dropdown",
		});
		this.exportDropdown.style.display = "none";

		const exportOptions = [
			{
				label: "JSON (.json)",
				action: () => this.downloadAs("json"),
			},
			{
				label: "YAML (.yaml)",
				action: () => this.downloadAs("yaml"),
			},
			{
				label: "CSV (.csv)",
				action: () => this.downloadAs("csv"),
			},
			{
				label: "TypeScript (.ts)",
				action: () => this.downloadAs("ts"),
			},
		];

		for (const opt of exportOptions) {
			const item = createElement("button", {
				className: "js-toolbar__dropdown-item",
				textContent: opt.label,
			});
			this.on(item, "click", () => {
				opt.action();
				if (this.exportDropdown) this.exportDropdown.style.display = "none";
			});
			this.exportDropdown.appendChild(item);
		}

		exportWrapper.appendChild(exportBtn);
		exportWrapper.appendChild(this.exportDropdown);
		actions.appendChild(scoped(exportWrapper, ["tree", "raw", "table"]));

		// ── Bookmarks — tree only ──
		const bookmarkWrapper = createElement("div", {
			className: "js-toolbar__dropdown-wrapper",
		});

		const bookmarkBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__bookmark-btn",
			textContent: "★",
			attributes: {
				title: "Bookmarks — Save and jump to favorite paths",
				"aria-label": "Bookmarks",
			},
		});
		this.on(bookmarkBtn, "click", () => this.toggleBookmarksPanel());

		this.bookmarksPanel = createElement("div", {
			className: "js-toolbar__dropdown js-toolbar__bookmarks-panel",
		});
		this.bookmarksPanel.style.display = "none";

		bookmarkWrapper.appendChild(bookmarkBtn);
		bookmarkWrapper.appendChild(this.bookmarksPanel);
		actions.appendChild(scoped(bookmarkWrapper, ["tree"]));

		// ── Separator ──
		actions.appendChild(
			createElement("span", { className: "js-toolbar__separator" }),
		);

		// ── Always visible: Theme ──
		const themeBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__theme-btn",
			textContent: "🌙",
			attributes: {
				title: "Theme — Toggle between dark and light mode",
				"aria-label": "Toggle dark/light theme",
			},
		});
		this.on(themeBtn, "click", () => {
			const { theme } = this.store.getState();
			this.store.setState({ theme: theme === "dark" ? "light" : "dark" });
		});
		actions.appendChild(themeBtn);

		// Hamburger menu (responsive)
		const menuBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__menu-btn",
			textContent: "≡",
			attributes: { title: "Menu", "aria-label": "Open menu" },
		});
		actions.appendChild(menuBtn);

		this.el.appendChild(actions);
		container.appendChild(this.el);

		// Close dropdowns on click outside
		this.on(document, "click", (e) => {
			const target = e.target as HTMLElement;
			if (
				this.exportDropdown?.style.display !== "none" &&
				!target.closest(".js-toolbar__dropdown-wrapper")
			) {
				this.exportDropdown!.style.display = "none";
			}
			if (
				this.bookmarksPanel?.style.display !== "none" &&
				!target.closest(".js-toolbar__dropdown-wrapper")
			) {
				this.bookmarksPanel!.style.display = "none";
			}
		});

		// Global keyboard shortcuts for undo/redo (always active)
		this.on(document, "keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				this.performUndo();
			}
			if (
				(e.ctrlKey || e.metaKey) &&
				((e.key === "z" && e.shiftKey) || e.key === "y")
			) {
				e.preventDefault();
				this.performRedo();
			}
		});

		// Subscribe to state
		this.watch(
			[
				"viewMode",
				"theme",
				"sortedByKeys",
				"expandedNodes",
				"nodes",
				"undoStack",
				"redoStack",
				"bookmarks",
			],
			(state) => this.update(state),
		);

		// Initial update
		this.update(this.store.getState());
	}

	update(state: Partial<AppState>): void {
		const fullState = this.store.getState();

		// Update active tab
		if (state.viewMode !== undefined) {
			for (const [mode, btn] of this.tabButtons) {
				btn.classList.toggle(
					"js-toolbar__tab--active",
					mode === state.viewMode,
				);
			}

			// Show/hide scoped buttons based on current view mode
			const currentView = fullState.viewMode;
			for (const { el, views } of this.scopedElements) {
				el.style.display = views.includes(currentView) ? "" : "none";
			}
		}

		// Update theme button
		if (state.theme !== undefined) {
			const themeBtn = this.el.querySelector(".js-toolbar__theme-btn");
			if (themeBtn) {
				themeBtn.textContent = fullState.theme === "dark" ? "☀️" : "🌙";
			}
		}

		// Update sort button
		if (state.sortedByKeys !== undefined) {
			const sortBtn = this.el.querySelector(".js-toolbar__sort-btn");
			if (sortBtn) {
				sortBtn.classList.toggle(
					"js-toolbar__button--active",
					fullState.sortedByKeys,
				);
			}
		}

		// Update expand/collapse toggle
		if (state.expandedNodes !== undefined || state.nodes !== undefined) {
			const expandToggle = this.el.querySelector(".js-toolbar__expand-toggle");
			if (expandToggle) {
				const expandableCount = fullState.nodes.filter(
					(n) => n.isExpandable,
				).length;
				this.isAllExpanded =
					expandableCount > 0 &&
					fullState.expandedNodes.size >= expandableCount;

				expandToggle.textContent = this.isAllExpanded ? "⊟" : "⊞";
				expandToggle.setAttribute(
					"title",
					this.isAllExpanded
						? "Collapse All — Close every node in the tree"
						: "Expand All — Open every node in the tree",
				);
			}
		}

		// Update undo/redo buttons disabled state
		if (state.undoStack !== undefined || state.redoStack !== undefined) {
			const undoBtn = this.el.querySelector(
				".js-toolbar__undo-btn",
			) as HTMLButtonElement | null;
			const redoBtn = this.el.querySelector(
				".js-toolbar__redo-btn",
			) as HTMLButtonElement | null;

			if (undoBtn) {
				const canUndo = fullState.undoStack.length > 0;
				undoBtn.disabled = !canUndo;
				undoBtn.style.opacity = canUndo ? "" : "0.3";
			}
			if (redoBtn) {
				const canRedo = fullState.redoStack.length > 0;
				redoBtn.disabled = !canRedo;
				redoBtn.style.opacity = canRedo ? "" : "0.3";
			}
		}

		// Update bookmarks panel content
		if (state.bookmarks !== undefined) {
			this.renderBookmarksPanel(fullState.bookmarks);
		}
	}

	/**
	 * Opens a file picker to import a local file.
	 */
	private importFile(): void {
		const input = document.createElement("input");
		input.type = "file";
		input.accept =
			".json,.yaml,.yml,.xml,.csv,application/json,text/yaml,text/xml,text/csv";

		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = () => {
				let rawJson = reader.result as string;
				const ext = file.name.split(".").pop()?.toLowerCase();

				// Convert non-JSON formats to JSON
				if (ext === "yaml" || ext === "yml") {
					try {
						rawJson = yamlToJson(rawJson);
					} catch {
						// Leave as-is — will show parse error
					}
				}

				// Dispatch a custom event so app.ts can re-initialise
				const event = new CustomEvent("json-spark:import", {
					detail: { rawJson, filename: file.name },
				});
				document.dispatchEvent(event);
			};
			reader.readAsText(file);
		});

		input.click();
	}

	/**
	 * Toggles the export dropdown.
	 */
	private toggleExportDropdown(): void {
		if (!this.exportDropdown) return;
		const isVisible = this.exportDropdown.style.display !== "none";
		this.exportDropdown.style.display = isVisible ? "none" : "flex";
	}

	/**
	 * Downloads the JSON in the specified format.
	 */
	private downloadAs(format: "json" | "yaml" | "csv" | "ts"): void {
		const { rawJson } = this.store.getState();
		let content: string;
		let filename: string;
		let mimeType: string;

		switch (format) {
			case "yaml":
				content = jsonToYaml(rawJson);
				filename = "data.yaml";
				mimeType = "text/yaml";
				break;
			case "csv":
				content = jsonToCsv(rawJson);
				filename = "data.csv";
				mimeType = "text/csv";
				break;
			case "ts":
				content = jsonToTypeScript(rawJson);
				filename = "types.ts";
				mimeType = "text/typescript";
				break;
			default:
				content = prettyPrint(rawJson);
				filename = "data.json";
				mimeType = "application/json";
		}

		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Toggles the bookmarks panel.
	 */
	private toggleBookmarksPanel(): void {
		if (!this.bookmarksPanel) return;
		const isVisible = this.bookmarksPanel.style.display !== "none";
		this.bookmarksPanel.style.display = isVisible ? "none" : "flex";
		if (!isVisible) {
			this.renderBookmarksPanel(this.store.getState().bookmarks);
		}
	}

	/**
	 * Renders bookmarks panel content.
	 */
	private renderBookmarksPanel(bookmarks: Bookmark[]): void {
		if (!this.bookmarksPanel) return;
		this.bookmarksPanel.innerHTML = "";

		// Add current selection button
		const addBtn = createElement("button", {
			className: "js-toolbar__dropdown-item js-toolbar__bookmark-add",
			textContent: "+ Bookmark current path",
		});
		this.on(addBtn, "click", () => {
			const {
				selectedNodeId,
				nodes,
				bookmarks: existing,
			} = this.store.getState();
			if (selectedNodeId === null) return;
			const node = nodes.find((n) => n.id === selectedNodeId);
			if (!node) return;

			// Don't add duplicates
			if (existing.some((b) => b.path === node.path)) return;

			const bookmark: Bookmark = {
				id: `bm_${Date.now()}`,
				path: node.path,
				label: node.key ?? node.path,
				nodeId: node.id,
			};
			this.store.setState({ bookmarks: [...existing, bookmark] });
		});
		this.bookmarksPanel.appendChild(addBtn);

		if (bookmarks.length === 0) {
			this.bookmarksPanel.appendChild(
				createElement("div", {
					className: "js-toolbar__dropdown-empty",
					textContent: "No bookmarks yet. Select a node first.",
				}),
			);
			return;
		}

		for (const bm of bookmarks) {
			const row = createElement("div", {
				className: "js-toolbar__bookmark-row",
			});

			const label = createElement("button", {
				className: "js-toolbar__dropdown-item",
				textContent: `★ ${bm.label}`,
				attributes: {
					title: bm.path,
				},
			});
			this.on(label, "click", () => {
				// Find node by path in current nodes
				const { nodes } = this.store.getState();
				const targetNode = nodes.find((n) => n.path === bm.path);
				if (targetNode) {
					// Expand parents
					const expanded = new Set(this.store.getState().expandedNodes);
					let current = nodes.find((n) => n.id === targetNode.parentId);
					while (current) {
						expanded.add(current.id);
						current = nodes.find((n) => n.id === current!.parentId);
					}
					this.store.setState({
						expandedNodes: expanded,
						selectedNodeId: targetNode.id,
					});
				}
				if (this.bookmarksPanel) this.bookmarksPanel.style.display = "none";
			});

			const removeBtn = createElement("button", {
				className: "js-toolbar__bookmark-remove",
				textContent: "✕",
				attributes: {
					title: "Remove bookmark",
					"aria-label": `Remove bookmark ${bm.label}`,
				},
			});
			this.on(removeBtn, "click", (e) => {
				e.stopPropagation();
				const { bookmarks: existing } = this.store.getState();
				this.store.setState({
					bookmarks: existing.filter((b) => b.id !== bm.id),
				});
			});

			row.appendChild(label);
			row.appendChild(removeBtn);
			this.bookmarksPanel.appendChild(row);
		}
	}

	/**
	 * Performs undo operation.
	 */
	private performUndo(): void {
		const { undoStack, redoStack, rawJson } = this.store.getState();
		if (undoStack.length === 0) return;

		const previousJson = undoStack[undoStack.length - 1]!;
		this.store.setState({
			rawJson: previousJson,
			undoStack: undoStack.slice(0, -1),
			redoStack: [...redoStack, rawJson],
		});
	}

	/**
	 * Performs redo operation.
	 */
	private performRedo(): void {
		const { undoStack, redoStack, rawJson } = this.store.getState();
		if (redoStack.length === 0) return;

		const nextJson = redoStack[redoStack.length - 1]!;
		this.store.setState({
			rawJson: nextJson,
			undoStack: [...undoStack, rawJson],
			redoStack: redoStack.slice(0, -1),
		});
	}

	/**
	 * Dispatches an action to the EditView component via custom event.
	 */
	private dispatchEditAction(action: "save" | "discard"): void {
		document.dispatchEvent(
			new CustomEvent("json-spark:edit-action", { detail: { action } }),
		);
	}

	/**
	 * Changes view mode with confirmation if there are unsaved edits.
	 */
	private changeViewModeWithConfirmation(newMode: ViewMode): void {
		const { viewMode, hasUnsavedEdits } = this.store.getState();
		if (viewMode === "edit" && hasUnsavedEdits && newMode !== "edit") {
			const response = confirm(
				"You have unsaved changes. Do you want to save before leaving?\n\n" +
					"Click OK to save and switch, or Cancel to discard changes.",
			);
			if (response) {
				this.dispatchEditAction("save");
			}
			this.store.setState({ hasUnsavedEdits: false });
		}
		this.store.setState({ viewMode: newMode });
	}
}
