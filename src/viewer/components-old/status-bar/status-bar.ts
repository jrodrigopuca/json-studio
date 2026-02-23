/**
 * Status Bar component — Shows file metadata at the bottom of the viewer.
 *
 * Displays: total keys, depth, file size, valid/invalid status.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import { formatSize, formatNumber } from "../../core/formatter.js";
import type { AppState } from "../../core/store.types.js";

export class StatusBar extends BaseComponent {
	private keysEl: HTMLElement | null = null;
	private depthEl: HTMLElement | null = null;
	private sizeEl: HTMLElement | null = null;
	private validEl: HTMLElement | null = null;

	render(container: HTMLElement): void {
		this.el = createElement("footer", {
			className: "js-status-bar",
			attributes: { role: "status", "aria-label": "JSON file information" },
		});

		// Primary items
		this.keysEl = createElement("span", { className: "js-status-bar__item" });
		this.depthEl = createElement("span", {
			className: "js-status-bar__item js-status-bar__secondary",
		});
		this.sizeEl = createElement("span", { className: "js-status-bar__item" });

		const spacer = createElement("span", {
			className: "js-status-bar__spacer",
		});

		this.validEl = createElement("span", { className: "js-status-bar__item" });

		this.el.appendChild(this.keysEl);
		this.el.appendChild(
			createElement("span", {
				className: "js-status-bar__separator",
				textContent: "·",
			}),
		);
		this.el.appendChild(this.depthEl);
		this.el.appendChild(
			createElement("span", {
				className: "js-status-bar__separator",
				textContent: "·",
			}),
		);
		this.el.appendChild(this.sizeEl);
		this.el.appendChild(spacer);
		this.el.appendChild(this.validEl);

		container.appendChild(this.el);

		this.watch(["totalKeys", "maxDepth", "fileSize", "isValid"], () =>
			this.update({}),
		);
		this.update(this.store.getState());
	}

	update(_state: Partial<AppState>): void {
		const fullState = this.store.getState();

		if (this.keysEl) {
			this.keysEl.textContent = `${formatNumber(fullState.totalKeys)} keys`;
		}
		if (this.depthEl) {
			this.depthEl.textContent = `${fullState.maxDepth} levels`;
		}
		if (this.sizeEl) {
			this.sizeEl.textContent = formatSize(fullState.fileSize);
		}
		if (this.validEl) {
			if (fullState.isValid) {
				this.validEl.className = "js-status-bar__item js-status-bar__valid";
				this.validEl.textContent = "✓ Valid JSON";
			} else {
				this.validEl.className = "js-status-bar__item js-status-bar__invalid";
				this.validEl.textContent = "✗ Invalid JSON";
			}
		}
	}
}
