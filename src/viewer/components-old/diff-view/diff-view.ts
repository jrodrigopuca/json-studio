/**
 * Diff View component — Side-by-side JSON comparison with highlighted differences.
 *
 * Users can paste or load a second JSON to compare against the current one.
 * Differences are highlighted in-line: added (green), removed (red), changed (yellow).
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { prettyPrint } from "../../core/formatter.js";
import { highlightJson } from "../../core/highlighter.js";
import type { AppState } from "../../core/store.types.js";
import type { DiffEntry } from "./diff-view.types.js";

export class DiffView extends BaseComponent {
	private leftPanel: HTMLElement | null = null;
	private rightPanel: HTMLElement | null = null;
	private diffSummary: HTMLElement | null = null;
	private textareaEl: HTMLTextAreaElement | null = null;

	render(container: HTMLElement): void {
		this.el = createElement("div", {
			className: "js-diff-view js-main",
			attributes: {
				role: "region",
				"aria-label": "JSON diff view",
			},
		});

		// Header with input area
		const header = createElement("div", {
			className: "js-diff-view__header",
		});

		const inputGroup = createElement("div", {
			className: "js-diff-view__input-group",
		});

		this.textareaEl = createElement("textarea", {
			className: "js-diff-view__textarea",
			attributes: {
				placeholder:
					"Paste a second JSON here to compare, or use the file picker...",
				rows: "3",
				spellcheck: "false",
			},
		});

		const btnGroup = createElement("div", {
			className: "js-diff-view__btn-group",
		});

		const compareBtn = createElement("button", {
			className: "js-diff-view__compare-btn",
			textContent: "Compare",
			attributes: { title: "Compare the two JSONs" },
		});
		this.on(compareBtn, "click", () => this.runComparison());

		const loadFileBtn = createElement("button", {
			className:
				"js-diff-view__compare-btn js-diff-view__compare-btn--secondary",
			textContent: "📂 Load File",
			attributes: { title: "Load a JSON file to compare" },
		});
		this.on(loadFileBtn, "click", () => this.loadFileForDiff());

		const clearBtn = createElement("button", {
			className:
				"js-diff-view__compare-btn js-diff-view__compare-btn--secondary",
			textContent: "✕ Clear",
			attributes: { title: "Clear the comparison" },
		});
		this.on(clearBtn, "click", () => {
			if (this.textareaEl) this.textareaEl.value = "";
			this.store.setState({ diffJson: null });
		});

		btnGroup.appendChild(compareBtn);
		btnGroup.appendChild(loadFileBtn);
		btnGroup.appendChild(clearBtn);
		inputGroup.appendChild(this.textareaEl);
		inputGroup.appendChild(btnGroup);
		header.appendChild(inputGroup);

		this.diffSummary = createElement("div", {
			className: "js-diff-view__summary",
		});
		header.appendChild(this.diffSummary);

		this.el.appendChild(header);

		// Side-by-side panels
		const panels = createElement("div", {
			className: "js-diff-view__panels",
		});

		const leftWrapper = createElement("div", {
			className: "js-diff-view__panel-wrapper",
		});
		leftWrapper.appendChild(
			createElement("div", {
				className: "js-diff-view__panel-label",
				textContent: "Original",
			}),
		);
		this.leftPanel = createElement("pre", {
			className: "js-diff-view__panel js-diff-view__panel--left",
		});
		leftWrapper.appendChild(this.leftPanel);

		const rightWrapper = createElement("div", {
			className: "js-diff-view__panel-wrapper",
		});
		rightWrapper.appendChild(
			createElement("div", {
				className: "js-diff-view__panel-label",
				textContent: "Comparison",
			}),
		);
		this.rightPanel = createElement("pre", {
			className: "js-diff-view__panel js-diff-view__panel--right",
		});
		rightWrapper.appendChild(this.rightPanel);

		panels.appendChild(leftWrapper);
		panels.appendChild(rightWrapper);
		this.el.appendChild(panels);

		container.appendChild(this.el);

		this.watch(["rawJson", "diffJson"], () => this.update({}));
		this.update(this.store.getState());
	}

	update(_state: Partial<AppState>): void {
		const fullState = this.store.getState();
		if (!this.leftPanel || !this.rightPanel) return;

		const leftJson = prettyPrint(fullState.rawJson);
		this.leftPanel.innerHTML = highlightJson(leftJson);

		if (fullState.diffJson) {
			const rightJson = prettyPrint(fullState.diffJson);
			this.rightPanel.innerHTML = highlightJson(rightJson);
			this.renderDiffHighlights(leftJson, rightJson);
		} else {
			this.rightPanel.innerHTML =
				'<span style="color: var(--text-secondary); font-style: italic;">Paste or load a second JSON to compare</span>';
			if (this.diffSummary) this.diffSummary.innerHTML = "";
		}
	}

	/**
	 * Computes and renders line-level diff highlights.
	 */
	private renderDiffHighlights(leftJson: string, rightJson: string): void {
		if (!this.leftPanel || !this.rightPanel || !this.diffSummary) return;

		// Compute structural diff
		let leftParsed: unknown;
		let rightParsed: unknown;
		try {
			leftParsed = JSON.parse(leftJson);
			rightParsed = JSON.parse(rightJson);
		} catch {
			this.diffSummary.textContent = "⚠ One or both JSONs are invalid";
			return;
		}

		const diffs = computeDiff(leftParsed, rightParsed, "$");

		// Line-level diff highlighting
		const leftLines = leftJson.split("\n");
		const rightLines = rightJson.split("\n");

		this.leftPanel.innerHTML = leftLines
			.map((line, i) => {
				const rLine = rightLines[i];
				const isDiff = rLine === undefined || line !== rLine;
				const cls = isDiff ? "js-diff-view__line--removed" : "";
				return `<div class="js-diff-view__line ${cls}">${highlightJson(line) || " "}</div>`;
			})
			.join("");

		this.rightPanel.innerHTML = rightLines
			.map((line, i) => {
				const lLine = leftLines[i];
				const isDiff = lLine === undefined || line !== lLine;
				const cls = isDiff ? "js-diff-view__line--added" : "";
				return `<div class="js-diff-view__line ${cls}">${highlightJson(line) || " "}</div>`;
			})
			.join("");

		// Summary
		const added = diffs.filter((d) => d.type === "added").length;
		const removed = diffs.filter((d) => d.type === "removed").length;
		const changed = diffs.filter((d) => d.type === "changed").length;

		const parts: string[] = [];
		if (added > 0)
			parts.push(
				`<span class="js-diff-view__badge--added">+${added} added</span>`,
			);
		if (removed > 0)
			parts.push(
				`<span class="js-diff-view__badge--removed">-${removed} removed</span>`,
			);
		if (changed > 0)
			parts.push(
				`<span class="js-diff-view__badge--changed">~${changed} changed</span>`,
			);

		this.diffSummary.innerHTML =
			parts.length > 0
				? parts.join(" ")
				: '<span style="color: var(--text-secondary);">No differences found</span>';
	}

	/**
	 * Runs comparison using textarea content.
	 */
	private runComparison(): void {
		if (!this.textareaEl) return;
		const value = this.textareaEl.value.trim();
		if (!value) return;

		try {
			JSON.parse(value);
			this.store.setState({ diffJson: value });
		} catch {
			this.store.setState({ diffJson: value });
		}
	}

	/**
	 * Opens a file picker to load a JSON file for comparison.
	 */
	private loadFileForDiff(): void {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";

		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				if (this.textareaEl) this.textareaEl.value = text;
				this.store.setState({ diffJson: text });
			};
			reader.readAsText(file);
		});

		input.click();
	}
}

/**
 * Computes structural differences between two JSON values.
 */
function computeDiff(left: unknown, right: unknown, path: string): DiffEntry[] {
	const diffs: DiffEntry[] = [];

	if (left === right) return diffs;

	if (left === null || right === null || typeof left !== typeof right) {
		if (left !== right) {
			diffs.push({ path, type: "changed", oldValue: left, newValue: right });
		}
		return diffs;
	}

	if (Array.isArray(left) && Array.isArray(right)) {
		const maxLen = Math.max(left.length, right.length);
		for (let i = 0; i < maxLen; i++) {
			if (i >= left.length) {
				diffs.push({
					path: `${path}[${i}]`,
					type: "added",
					newValue: right[i],
				});
			} else if (i >= right.length) {
				diffs.push({
					path: `${path}[${i}]`,
					type: "removed",
					oldValue: left[i],
				});
			} else {
				diffs.push(...computeDiff(left[i], right[i], `${path}[${i}]`));
			}
		}
		return diffs;
	}

	if (typeof left === "object" && typeof right === "object") {
		const leftObj = left as Record<string, unknown>;
		const rightObj = right as Record<string, unknown>;
		const allKeys = new Set([
			...Object.keys(leftObj),
			...Object.keys(rightObj),
		]);

		for (const key of allKeys) {
			const subPath = `${path}.${key}`;
			if (!(key in leftObj)) {
				diffs.push({ path: subPath, type: "added", newValue: rightObj[key] });
			} else if (!(key in rightObj)) {
				diffs.push({ path: subPath, type: "removed", oldValue: leftObj[key] });
			} else {
				diffs.push(...computeDiff(leftObj[key], rightObj[key], subPath));
			}
		}
		return diffs;
	}

	if (left !== right) {
		diffs.push({ path, type: "changed", oldValue: left, newValue: right });
	}

	return diffs;
}
