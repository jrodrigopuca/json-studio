/**
 * Search Bar component — Full-text search within the JSON.
 *
 * In Tree view: searches nodes (keys and values)
 * In Raw/Edit view: searches text lines
 *
 * Activated via Ctrl+F / Cmd+F.
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
				placeholder: "Search…",
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
		this.watch(
			[
				"searchQuery",
				"searchMatches",
				"searchCurrentIndex",
				"searchLineMatches",
				"viewMode",
			],
			() => this.update({}),
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

		// Update count based on view mode
		if (this.countEl) {
			const isTextView =
				fullState.viewMode === "raw" || fullState.viewMode === "edit";
			const matches = isTextView
				? fullState.searchLineMatches
				: fullState.searchMatches;
			const currentIndex = fullState.searchCurrentIndex;

			if (matches.length === 0 && fullState.searchQuery.trim()) {
				this.countEl.textContent = "No results";
			} else if (matches.length > 0) {
				this.countEl.textContent = `${currentIndex + 1} of ${matches.length}`;
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
			searchLineMatches: [],
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
					searchLineMatches: [],
					searchCurrentIndex: 0,
				});
				return;
			}

			const { viewMode } = this.store.getState();
			const isTextView = viewMode === "raw" || viewMode === "edit";

			if (isTextView) {
				const lineMatches = this.performLineSearch(query);
				this.store.setState({
					searchQuery: query,
					searchMatches: [],
					searchLineMatches: lineMatches,
					searchCurrentIndex: lineMatches.length > 0 ? 0 : 0,
				});
				// Scroll to first match
				if (lineMatches.length > 0) {
					this.scrollToLine(lineMatches[0]!);
				}
			} else {
				const matches = this.performNodeSearch(query);
				this.store.setState({
					searchQuery: query,
					searchMatches: matches,
					searchLineMatches: [],
					searchCurrentIndex: matches.length > 0 ? 0 : 0,
				});
			}
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
	private performNodeSearch(query: string): number[] {
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

	/**
	 * Searches raw JSON text for matching lines.
	 * Returns array of 1-indexed line numbers.
	 */
	private performLineSearch(query: string): number[] {
		const { rawJson } = this.store.getState();
		const lowerQuery = query.toLowerCase();
		const lines = rawJson.split("\n");
		const matches: number[] = [];

		for (let i = 0; i < lines.length; i++) {
			if (lines[i]!.toLowerCase().includes(lowerQuery)) {
				matches.push(i + 1); // 1-indexed line numbers
			}
		}

		return matches;
	}

	/**
	 * Scrolls to a specific line in raw/edit view.
	 */
	private scrollToLine(lineNumber: number): void {
		// Dispatch a custom event for raw-view and edit-view to handle
		document.dispatchEvent(
			new CustomEvent("json-spark:scroll-to-line", {
				detail: { line: lineNumber },
			}),
		);
	}

	private goToNextMatch(): void {
		const { viewMode, searchMatches, searchLineMatches, searchCurrentIndex } =
			this.store.getState();
		const isTextView = viewMode === "raw" || viewMode === "edit";
		const matches = isTextView ? searchLineMatches : searchMatches;

		if (matches.length === 0) return;
		const next = (searchCurrentIndex + 1) % matches.length;
		this.store.setState({ searchCurrentIndex: next });

		if (isTextView) {
			this.scrollToLine(matches[next]!);
		}
	}

	private goToPrevMatch(): void {
		const { viewMode, searchMatches, searchLineMatches, searchCurrentIndex } =
			this.store.getState();
		const isTextView = viewMode === "raw" || viewMode === "edit";
		const matches = isTextView ? searchLineMatches : searchMatches;

		if (matches.length === 0) return;
		const prev = (searchCurrentIndex - 1 + matches.length) % matches.length;
		this.store.setState({ searchCurrentIndex: prev });

		if (isTextView) {
			this.scrollToLine(matches[prev]!);
		}
	}
}
