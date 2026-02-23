/**
 * Raw View component — Displays JSON as syntax-highlighted text with optional line numbers.
 * Supports search highlighting with line-based matches.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { highlightJson } from "../../core/highlighter.js";
import type { AppState } from "../../core/store.types.js";

export class RawView extends BaseComponent {
	private codeEl: HTMLElement | null = null;
	private gutterEl: HTMLElement | null = null;
	private wrapperEl: HTMLElement | null = null;
	private lineElements: HTMLElement[] = [];

	render(container: HTMLElement): void {
		this.el = createElement("div", {
			className: "js-raw-view js-main",
			attributes: {
				role: "region",
				"aria-label": "Raw JSON view",
				tabindex: "0",
			},
		});

		this.wrapperEl = createElement("div", {
			className: "js-raw-view__wrapper",
		});

		this.gutterEl = createElement("div", {
			className: "js-raw-view__gutter",
		});

		this.codeEl = createElement("pre", { className: "js-raw-view__code" });

		this.wrapperEl.appendChild(this.gutterEl);
		this.wrapperEl.appendChild(this.codeEl);
		this.el.appendChild(this.wrapperEl);
		container.appendChild(this.el);

		this.watch(
			[
				"rawJson",
				"isValid",
				"parseError",
				"showLineNumbers",
				"searchLineMatches",
				"searchCurrentIndex",
				"viewMode",
			],
			() => this.update({}),
		);

		// Listen for scroll-to-line events from search
		const scrollHandler = ((e: CustomEvent) => {
			const { viewMode } = this.store.getState();
			if (viewMode === "raw") {
				this.scrollToLine(e.detail.line);
			}
		}) as EventListener;
		document.addEventListener("json-spark:scroll-to-line", scrollHandler);
		this.addDisposable(() =>
			document.removeEventListener("json-spark:scroll-to-line", scrollHandler),
		);

		this.update(this.store.getState());
	}

	update(_state: Partial<AppState>): void {
		if (!this.codeEl || !this.gutterEl) return;

		const fullState = this.store.getState();

		if (fullState.isValid) {
			this.renderWithLineWrapping(fullState.rawJson);
			this.renderLineNumbers(fullState.rawJson, fullState.showLineNumbers);
		} else {
			this.renderWithLineWrapping(fullState.rawJson);
			this.renderLineNumbers(fullState.rawJson, fullState.showLineNumbers);
		}

		// Apply search highlighting
		this.highlightSearchMatches(
			fullState.searchLineMatches,
			fullState.searchCurrentIndex,
		);
	}

	/**
	 * Renders JSON with each line wrapped in a span for highlighting.
	 */
	private renderWithLineWrapping(text: string): void {
		if (!this.codeEl) return;

		const lines = text.split("\n");
		this.lineElements = [];

		// Build HTML with line wrapping
		const lineSpans = lines.map((line, index) => {
			const lineNum = index + 1;
			// Highlight JSON syntax within each line
			const highlightedLine = highlightJson(line);
			return `<span class="js-raw-view__line" data-line="${lineNum}">${highlightedLine || " "}</span>`;
		});

		this.codeEl.innerHTML = lineSpans.join("\n");

		// Cache line elements for faster highlighting
		this.lineElements = Array.from(
			this.codeEl.querySelectorAll(".js-raw-view__line"),
		) as HTMLElement[];
	}

	/**
	 * Renders line numbers in the gutter.
	 */
	private renderLineNumbers(text: string, show: boolean): void {
		if (!this.gutterEl) return;

		if (!show) {
			this.gutterEl.style.display = "none";
			return;
		}

		this.gutterEl.style.display = "block";
		const lineCount = text.split("\n").length;
		const lines: string[] = [];

		for (let i = 1; i <= lineCount; i++) {
			lines.push(`<span class="js-raw-view__line-number">${i}</span>`);
		}

		this.gutterEl.innerHTML = lines.join("\n");
	}

	/**
	 * Highlights lines that match the search query.
	 */
	private highlightSearchMatches(
		lineMatches: number[],
		currentIndex: number,
	): void {
		// Clear all highlights first
		for (const el of this.lineElements) {
			el.classList.remove(
				"js-raw-view__line--match",
				"js-raw-view__line--current",
			);
		}

		if (lineMatches.length === 0) return;

		// Apply match highlighting
		for (const lineNum of lineMatches) {
			const el = this.lineElements[lineNum - 1]; // Convert 1-indexed to 0-indexed
			if (el) {
				el.classList.add("js-raw-view__line--match");
			}
		}

		// Highlight current match
		const currentLine = lineMatches[currentIndex];
		if (currentLine !== undefined) {
			const currentEl = this.lineElements[currentLine - 1];
			if (currentEl) {
				currentEl.classList.add("js-raw-view__line--current");
			}
		}
	}

	/**
	 * Scrolls to a specific line number.
	 */
	private scrollToLine(lineNumber: number): void {
		const el = this.lineElements[lineNumber - 1];
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}
}
