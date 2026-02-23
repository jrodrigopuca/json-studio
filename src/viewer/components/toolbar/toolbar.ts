/**
 * Toolbar component — brand, view tabs, and action buttons.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import type { AppState } from "../../core/store.types.js";
import type { ViewMode } from "../../../shared/types.js";
import type { ToolbarTab } from "./toolbar.types.js";

const TABS: ToolbarTab[] = [
	{ id: "tree", label: "Tree", shortcut: "1" },
	{ id: "raw", label: "Raw", shortcut: "2" },
];

export class Toolbar extends BaseComponent {
	private tabButtons: Map<ViewMode, HTMLButtonElement> = new Map();

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

		// Action buttons
		const actions = createElement("div", { className: "js-toolbar__actions" });

		// Search toggle
		const searchBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "🔍",
			attributes: { title: "Search (Ctrl+F)", "aria-label": "Toggle search" },
		});
		this.on(searchBtn, "click", () => {
			const current = this.store.getState().searchQuery;
			this.store.setState({ searchQuery: current ? "" : " " });
			document
				.querySelector<HTMLInputElement>(".js-search-bar__input")
				?.focus();
		});
		actions.appendChild(searchBtn);

		// Expand all
		const expandBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "⊞",
			attributes: {
				title: "Expand all (Ctrl+Shift+F)",
				"aria-label": "Expand all nodes",
			},
		});
		this.on(expandBtn, "click", () => {
			const { nodes } = this.store.getState();
			const allExpandable = new Set(
				nodes.filter((n) => n.isExpandable).map((n) => n.id),
			);
			this.store.setState({ expandedNodes: allExpandable });
		});
		actions.appendChild(expandBtn);

		// Collapse all
		const collapseBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "⊟",
			attributes: {
				title: "Collapse all (Ctrl+Shift+C)",
				"aria-label": "Collapse all nodes",
			},
		});
		this.on(collapseBtn, "click", () => {
			this.store.setState({ expandedNodes: new Set<number>() });
		});
		actions.appendChild(collapseBtn);

		// Copy all
		const copyBtn = createElement("button", {
			className: "js-toolbar__button",
			textContent: "📋",
			attributes: {
				title: "Copy JSON (Ctrl+C)",
				"aria-label": "Copy entire JSON",
			},
		});
		this.on(copyBtn, "click", async () => {
			const { rawJson } = this.store.getState();
			await navigator.clipboard.writeText(rawJson);
		});
		actions.appendChild(copyBtn);

		// Theme toggle
		const themeBtn = createElement("button", {
			className: "js-toolbar__button js-toolbar__theme-btn",
			textContent: "🌙",
			attributes: {
				title: "Toggle theme",
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
		this.watch(["viewMode", "theme"], (state) => this.update(state));

		// Initial update
		this.update(this.store.getState());
	}

	update(state: Partial<AppState>): void {
		// Update active tab
		if (state.viewMode !== undefined) {
			for (const [mode, btn] of this.tabButtons) {
				btn.classList.toggle(
					"js-toolbar__tab--active",
					mode === state.viewMode,
				);
			}
		}

		// Update theme button
		if (state.theme !== undefined) {
			const themeBtn = this.el.querySelector(".js-toolbar__theme-btn");
			if (themeBtn) {
				themeBtn.textContent = state.theme === "dark" ? "☀️" : "🌙";
			}
		}
	}
}
