/**
 * Search Bar component — Full-text search within the JSON tree.
 *
 * Activated via Ctrl+F / Cmd+F. Matches keys and values.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import type { AppState } from "../../core/store.types.js";

export class SearchBar extends BaseComponent {
	private inputEl: HTMLInputElement | null = null;
	private countEl: HTMLElement | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	render(container: HTMLElement): void {
		this.el = createElement("div", {
			className: "js-search-bar",
			attributes: { role: "search", "aria-label": "Search JSON" },
		});

		// Search input
		this.inputEl = createElement("input", {
			className: "js-search-bar__input",
			attributes: {
				type: "text",
				placeholder: "Search keys and values…",
				"aria-label": "Search query",
			},
		}) as HTMLInputElement;

		this.on(this.inputEl, "input", () => this.onInput());
		this.on(this.inputEl, "keydown", (e) => this.onInputKeyDown(e));

		// Match count display
		this.countEl = createElement("span", {
			className: "js-search-bar__count",
			textContent: "0 results",
		});

		// Navigation buttons
		const nav = createElement("div", { className: "js-search-bar__nav" });

		const prevBtn = createElement("button", {
			className: "js-search-bar__btn",
			textContent: "↑",
			attributes: { title: "Previous match", "aria-label": "Previous match" },
		});
		this.on(prevBtn, "click", () => this.goToPrevMatch());

		const nextBtn = createElement("button", {
			className: "js-search-bar__btn",
			textContent: "↓",
			attributes: { title: "Next match", "aria-label": "Next match" },
		});
		this.on(nextBtn, "click", () => this.goToNextMatch());

		const closeBtn = createElement("button", {
			className: "js-search-bar__btn",
			textContent: "✕",
			attributes: {
				title: "Close search (Escape)",
				"aria-label": "Close search",
			},
		});
		this.on(closeBtn, "click", () => this.close());

		nav.appendChild(prevBtn);
		nav.appendChild(nextBtn);
		nav.appendChild(closeBtn);

		this.el.appendChild(this.inputEl);
		this.el.appendChild(this.countEl);
		this.el.appendChild(nav);
		container.appendChild(this.el);

		// Watch for search state changes
		this.watch(["searchQuery", "searchMatches", "searchCurrentIndex"], () =>
			this.update({}),
		);

		// Global keyboard shortcut: Ctrl+F / Cmd+F
		this.on(document, "keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				this.open();
			}
		});
	}

	update(_state: Partial<AppState>): void {
		const fullState = this.store.getState();

		// Toggle visibility
		const isVisible = fullState.searchQuery !== "";
		this.el.classList.toggle("js-search-bar--visible", isVisible);

		// Update count
		if (this.countEl) {
			const { searchMatches, searchCurrentIndex } = fullState;
			if (searchMatches.length === 0 && fullState.searchQuery) {
				this.countEl.textContent = "No results";
			} else if (searchMatches.length > 0) {
				this.countEl.textContent = `${searchCurrentIndex + 1} of ${searchMatches.length}`;
			} else {
				this.countEl.textContent = "";
			}
		}
	}

	private open(): void {
		this.el.classList.add("js-search-bar--visible");
		if (this.inputEl) {
			this.inputEl.value = this.store.getState().searchQuery.trim();
			this.inputEl.focus();
			this.inputEl.select();
		}
		if (!this.store.getState().searchQuery) {
			this.store.setState({ searchQuery: " " }); // Trigger visibility
		}
	}

	private close(): void {
		this.store.setState({
			searchQuery: "",
			searchMatches: [],
			searchCurrentIndex: 0,
		});
		this.el.classList.remove("js-search-bar--visible");
	}

	private onInput(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			const query = this.inputEl?.value.trim() ?? "";
			if (!query) {
				this.store.setState({
					searchQuery: "",
					searchMatches: [],
					searchCurrentIndex: 0,
				});
				return;
			}

			const matches = this.performSearch(query);
			this.store.setState({
				searchQuery: query,
				searchMatches: matches,
				searchCurrentIndex: matches.length > 0 ? 0 : 0,
			});
		}, 150);
	}

	private onInputKeyDown(e: KeyboardEvent): void {
		if (e.key === "Escape") {
			this.close();
		} else if (e.key === "Enter") {
			if (e.shiftKey) {
				this.goToPrevMatch();
			} else {
				this.goToNextMatch();
			}
		}
	}

	/**
	 * Searches all flat nodes for matching keys or values.
	 */
	private performSearch(query: string): number[] {
		const { nodes } = this.store.getState();
		const lowerQuery = query.toLowerCase();
		const matches: number[] = [];

		for (const node of nodes) {
			// Search in key
			if (node.key?.toLowerCase().includes(lowerQuery)) {
				matches.push(node.id);
				continue;
			}

			// Search in value (primitives only)
			if (!node.isExpandable && node.value !== null) {
				const valueStr = String(node.value).toLowerCase();
				if (valueStr.includes(lowerQuery)) {
					matches.push(node.id);
				}
			}
		}

		return matches;
	}

	private goToNextMatch(): void {
		const { searchMatches, searchCurrentIndex } = this.store.getState();
		if (searchMatches.length === 0) return;
		const next = (searchCurrentIndex + 1) % searchMatches.length;
		this.store.setState({ searchCurrentIndex: next });
	}

	private goToPrevMatch(): void {
		const { searchMatches, searchCurrentIndex } = this.store.getState();
		if (searchMatches.length === 0) return;
		const prev =
			(searchCurrentIndex - 1 + searchMatches.length) % searchMatches.length;
		this.store.setState({ searchCurrentIndex: prev });
	}
}
