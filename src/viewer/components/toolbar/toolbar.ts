/**
 * Toolbar component — brand, view tabs, and context-aware action buttons.
 *
 * Each button is tagged with the view modes where it's relevant.
 * Switching views automatically shows/hides buttons for that context.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { prettyPrint, minify } from "../../core/formatter.js";
import type { AppState } from "../../core/store.types.js";
import type { ViewMode } from "../../../shared/types.js";
import type { ToolbarTab } from "./toolbar.types.js";

const TABS: ToolbarTab[] = [
	{ id: "tree", label: "Tree", shortcut: "1" },
	{ id: "raw", label: "Raw", shortcut: "2" },
	{ id: "table", label: "Table", shortcut: "3" },
];

/** Maps an element to the set of view modes where it should be visible. */
type ViewScoped = { el: HTMLElement; views: ViewMode[] };

export class Toolbar extends BaseComponent {
	private tabButtons: Map<ViewMode, HTMLButtonElement> = new Map();
	private isAllExpanded = false;
	/** Elements scoped to specific view modes. */
	private scopedElements: ViewScoped[] = [];

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
				this.store.setState({ viewMode: tab.id });
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

		// ── Always visible ──

		// Search toggle
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
		actions.appendChild(searchBtn);

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

		// ── Always visible: Download & Theme ──
		const downloadBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "⬇",
			attributes: {
				title: "Download — Save JSON as file",
				"aria-label": "Download JSON file",
			},
		});
		this.on(downloadBtn, "click", () => {
			const { rawJson } = this.store.getState();
			const blob = new Blob([rawJson], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "data.json";
			a.click();
			URL.revokeObjectURL(url);
		});
		actions.appendChild(downloadBtn);

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

		// Subscribe to state
		this.watch(
			["viewMode", "theme", "sortedByKeys", "expandedNodes", "nodes"],
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
	}
}
