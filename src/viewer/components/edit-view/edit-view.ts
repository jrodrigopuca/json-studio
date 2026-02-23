/**
 * Edit View component — Full-screen JSON text editor with syntax highlighting.
 *
 * Features:
 * - Line numbers gutter
 * - Syntax highlighting (overlay technique)
 * - Real-time JSON validation
 * - Prettify/Minify via toolbar events
 * - Save/Discard via toolbar events
 * - Search highlighting with line-based matches
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { prettyPrint, minify } from "../../core/formatter.js";
import { highlightJson } from "../../core/highlighter.js";
import { toast } from "../toast/index.js";
import type { AppState } from "../../core/store.types.js";

export class EditView extends BaseComponent {
	private textarea: HTMLTextAreaElement | null = null;
	private highlightEl: HTMLElement | null = null;
	private gutterEl: HTMLElement | null = null;
	private errorEl: HTMLElement | null = null;
	private wrapperEl: HTMLElement | null = null;
	private lineElements: HTMLElement[] = [];

	render(container: HTMLElement): void {
		this.el = createElement("div", {
			className: "js-edit-view js-main",
			attributes: {
				role: "region",
				"aria-label": "JSON editor",
			},
		});

		// Error message area (at top)
		this.errorEl = createElement("div", {
			className: "js-edit-view__error",
		});

		// Editor wrapper (gutter + overlay container)
		this.wrapperEl = createElement("div", {
			className: "js-edit-view__wrapper",
		});

		// Line numbers gutter
		this.gutterEl = createElement("div", {
			className: "js-edit-view__gutter",
		});

		// Editor container (overlay technique: highlight layer + textarea)
		const editorContainer = createElement("div", {
			className: "js-edit-view__editor",
		});

		// Highlight layer (shows syntax-colored code)
		this.highlightEl = createElement("pre", {
			className: "js-edit-view__highlight",
		});

		// Textarea (transparent text, captures input)
		this.textarea = createElement("textarea", {
			className: "js-edit-view__textarea",
			attributes: {
				spellcheck: "false",
				autocomplete: "off",
				autocorrect: "off",
				autocapitalize: "off",
				"aria-label": "JSON content editor",
			},
		}) as HTMLTextAreaElement;

		editorContainer.appendChild(this.highlightEl);
		editorContainer.appendChild(this.textarea);

		this.wrapperEl.appendChild(this.gutterEl);
		this.wrapperEl.appendChild(editorContainer);

		this.el.appendChild(this.errorEl);
		this.el.appendChild(this.wrapperEl);
		container.appendChild(this.el);

		// Load initial content
		this.loadContent();

		// Subscribe to state changes
		this.watch(
			[
				"rawJson",
				"viewMode",
				"showLineNumbers",
				"searchLineMatches",
				"searchCurrentIndex",
			],
			() => this.onStateChange(),
		);

		// Input handler: update highlighting and validate
		this.on(this.textarea, "input", () => {
			this.updateHighlighting();
			this.validate();
			this.updateUnsavedState();
		});

		// Sync scroll between textarea and highlight layer
		this.on(this.textarea, "scroll", () => {
			if (this.highlightEl && this.gutterEl && this.textarea) {
				this.highlightEl.scrollTop = this.textarea.scrollTop;
				this.highlightEl.scrollLeft = this.textarea.scrollLeft;
				this.gutterEl.scrollTop = this.textarea.scrollTop;
			}
		});

		// Ctrl+S to save
		this.on(this.textarea, "keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				this.saveChanges();
			}
		});

		// Listen for toolbar actions (save, discard)
		const editActionHandler = ((e: CustomEvent) => {
			const action = e.detail?.action;
			if (action === "save") this.saveChanges();
			else if (action === "discard") this.loadContent();
		}) as EventListener;
		document.addEventListener("json-spark:edit-action", editActionHandler);
		this.addDisposable(() =>
			document.removeEventListener("json-spark:edit-action", editActionHandler),
		);

		// Listen for toolbar raw actions (prettify, minify) when in edit view
		const rawActionHandler = ((e: CustomEvent) => {
			const { viewMode } = this.store.getState();
			if (viewMode !== "edit") return;

			const action = e.detail?.action;
			if (action === "prettify") this.prettify();
			else if (action === "minify") this.minifyContent();
		}) as EventListener;
		document.addEventListener("json-spark:raw-action", rawActionHandler);
		this.addDisposable(() =>
			document.removeEventListener("json-spark:raw-action", rawActionHandler),
		);

		// Listen for scroll-to-line events from search
		const scrollHandler = ((e: CustomEvent) => {
			const { viewMode } = this.store.getState();
			if (viewMode === "edit") {
				this.scrollToLine(e.detail.line);
			}
		}) as EventListener;
		document.addEventListener("json-spark:scroll-to-line", scrollHandler);
		this.addDisposable(() =>
			document.removeEventListener("json-spark:scroll-to-line", scrollHandler),
		);

		// Initial validation and highlighting
		this.updateHighlighting();
		this.validate();
	}

	update(_state: Partial<AppState>): void {
		// State updates handled by onStateChange via watch
	}

	/**
	 * Loads current rawJson into the editor.
	 */
	private loadContent(): void {
		if (!this.textarea) return;
		const { rawJson } = this.store.getState();
		this.textarea.value = rawJson;
		this.updateHighlighting();
		this.validate();
		this.store.setState({ hasUnsavedEdits: false });
	}

	/**
	 * Updates the syntax highlighting layer and line numbers.
	 */
	private updateHighlighting(): void {
		if (!this.textarea || !this.highlightEl || !this.gutterEl) return;

		const text = this.textarea.value;
		const { showLineNumbers, searchLineMatches, searchCurrentIndex } =
			this.store.getState();

		// Update highlight layer with line wrapping for search highlighting
		const lines = text.split("\n");
		this.lineElements = [];

		const lineSpans = lines.map((line, index) => {
			const lineNum = index + 1;
			const highlightedLine = highlightJson(line);
			return `<span class="js-edit-view__line" data-line="${lineNum}">${highlightedLine || " "}</span>`;
		});

		this.highlightEl.innerHTML = lineSpans.join("\n") + "\n";

		// Cache line elements
		this.lineElements = Array.from(
			this.highlightEl.querySelectorAll(".js-edit-view__line"),
		) as HTMLElement[];

		// Apply search highlighting
		this.highlightSearchMatches(searchLineMatches, searchCurrentIndex);

		// Update line numbers
		this.renderLineNumbers(text, showLineNumbers);
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
			lines.push(`<span class="js-edit-view__line-number">${i}</span>`);
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
				"js-edit-view__line--match",
				"js-edit-view__line--current",
			);
		}

		if (lineMatches.length === 0) return;

		// Apply match highlighting
		for (const lineNum of lineMatches) {
			const el = this.lineElements[lineNum - 1]; // Convert 1-indexed to 0-indexed
			if (el) {
				el.classList.add("js-edit-view__line--match");
			}
		}

		// Highlight current match
		const currentLine = lineMatches[currentIndex];
		if (currentLine !== undefined) {
			const currentEl = this.lineElements[currentLine - 1];
			if (currentEl) {
				currentEl.classList.add("js-edit-view__line--current");
			}
		}
	}

	/**
	 * Scrolls to a specific line number.
	 */
	private scrollToLine(lineNumber: number): void {
		if (!this.textarea) return;

		const text = this.textarea.value;
		const lines = text.split("\n");

		// Calculate character position at start of target line
		let charPos = 0;
		for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
			charPos += lines[i]!.length + 1; // +1 for newline
		}

		// Set cursor position and scroll
		this.textarea.focus();
		this.textarea.setSelectionRange(charPos, charPos);

		// Scroll the line into view
		const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight);
		const scrollTop =
			(lineNumber - 1) * lineHeight - this.textarea.clientHeight / 2;
		this.textarea.scrollTop = Math.max(0, scrollTop);
	}

	/**
	 * Called when relevant state changes.
	 */
	private onStateChange(): void {
		const {
			viewMode,
			rawJson,
			showLineNumbers,
			searchLineMatches,
			searchCurrentIndex,
		} = this.store.getState();

		// Update line numbers visibility
		if (this.gutterEl) {
			this.gutterEl.style.display = showLineNumbers ? "block" : "none";
		}

		// Update search highlighting
		this.highlightSearchMatches(searchLineMatches, searchCurrentIndex);

		// When switching to edit view, reload content if it differs
		if (viewMode === "edit" && this.textarea) {
			const currentValue = this.textarea.value;
			try {
				const currentParsed = JSON.parse(currentValue);
				const stateParsed = JSON.parse(rawJson);
				if (JSON.stringify(currentParsed) !== JSON.stringify(stateParsed)) {
					this.loadContent();
				}
			} catch {
				if (currentValue !== rawJson) {
					this.loadContent();
				}
			}
		}
	}

	/**
	 * Validates the current textarea content.
	 */
	private validate(): boolean {
		if (!this.textarea || !this.errorEl) return false;

		try {
			JSON.parse(this.textarea.value);
			this.errorEl.textContent = "";
			this.errorEl.style.display = "none";
			return true;
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Invalid JSON";
			this.errorEl.textContent = `⚠ ${msg}`;
			this.errorEl.style.display = "block";
			return false;
		}
	}

	/**
	 * Prettifies the current content.
	 */
	private prettify(): void {
		if (!this.textarea) return;
		try {
			const parsed = JSON.parse(this.textarea.value);
			this.textarea.value = prettyPrint(JSON.stringify(parsed));
			this.updateHighlighting();
			this.validate();
		} catch {
			// Can't prettify invalid JSON
		}
	}

	/**
	 * Minifies the current content.
	 */
	private minifyContent(): void {
		if (!this.textarea) return;
		try {
			const parsed = JSON.parse(this.textarea.value);
			this.textarea.value = minify(JSON.stringify(parsed));
			this.updateHighlighting();
			this.validate();
		} catch {
			// Can't minify invalid JSON
		}
	}

	/**
	 * Saves the current textarea content to state.
	 */
	private saveChanges(): void {
		if (!this.textarea || !this.validate()) return;

		const { rawJson, undoStack } = this.store.getState();
		const newJson = prettyPrint(this.textarea.value);

		// Only save if content actually changed
		if (newJson !== rawJson) {
			this.store.setState({
				rawJson: newJson,
				undoStack: [...undoStack, rawJson],
				redoStack: [],
				fileSize: new Blob([newJson]).size,
				hasUnsavedEdits: false,
			});
			toast.show({
				message: "Changes saved successfully",
				type: "success",
				duration: 2500,
			});
		} else {
			this.store.setState({ hasUnsavedEdits: false });
			toast.show({
				message: "No changes to save",
				type: "info",
				duration: 2000,
			});
		}
	}

	/**
	 * Updates the hasUnsavedEdits state by comparing textarea with rawJson.
	 */
	private updateUnsavedState(): void {
		if (!this.textarea) return;

		const { rawJson } = this.store.getState();
		const currentValue = this.textarea.value;

		// Compare parsed values to ignore formatting differences
		let hasChanges = false;
		try {
			const currentParsed = JSON.parse(currentValue);
			const stateParsed = JSON.parse(rawJson);
			hasChanges =
				JSON.stringify(currentParsed) !== JSON.stringify(stateParsed);
		} catch {
			// If current value is invalid JSON, compare raw strings
			hasChanges = currentValue !== rawJson;
		}

		this.store.setState({ hasUnsavedEdits: hasChanges });
	}
}
