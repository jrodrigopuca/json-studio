/**
 * Raw View component — Displays JSON as syntax-highlighted text with optional line numbers.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { highlightJson } from "../../core/highlighter.js";
import type { AppState } from "../../core/store.types.js";

export class RawView extends BaseComponent {
	private codeEl: HTMLElement | null = null;
	private gutterEl: HTMLElement | null = null;
	private wrapperEl: HTMLElement | null = null;

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

		this.watch(["rawJson", "isValid", "parseError", "showLineNumbers"], () =>
			this.update({}),
		);
		this.update(this.store.getState());
	}

	update(_state: Partial<AppState>): void {
		if (!this.codeEl || !this.gutterEl) return;

		const fullState = this.store.getState();

		if (fullState.isValid) {
			this.codeEl.innerHTML = highlightJson(fullState.rawJson);
			this.renderLineNumbers(fullState.rawJson, fullState.showLineNumbers);
		} else {
			this.codeEl.textContent = fullState.rawJson;
			this.renderLineNumbers(fullState.rawJson, fullState.showLineNumbers);
		}
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
}
