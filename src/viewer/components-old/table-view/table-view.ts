/**
 * Table View component — Renders arrays of objects as a sortable table.
 *
 * Only activates when the root JSON (or selected sub-tree) is an array of objects.
 * Falls back to a message when data is not tabular.
 */

import { BaseComponent } from "../../base-component.js";
import {
	createElement,
	escapeHtml,
	copyToClipboard,
} from "../../../shared/dom.js";
import type { AppState } from "../../core/store.types.js";
import type { SortDirection } from "./table-view.types.js";

export class TableView extends BaseComponent {
	private sortColumn: string | null = null;
	private sortDirection: SortDirection = "none";

	render(container: HTMLElement): void {
		this.el = createElement("div", {
			className: "js-table-view js-main",
			attributes: {
				role: "region",
				"aria-label": "Table view",
				tabindex: "0",
			},
		});

		container.appendChild(this.el);

		this.watch(["nodes", "rawJson"], () => this.update(this.store.getState()));
		this.update(this.store.getState());
	}

	update(_state: Partial<AppState>): void {
		const { rawJson, isValid } = this.store.getState();
		this.el.innerHTML = "";

		if (!isValid) {
			this.el.appendChild(
				createElement("div", {
					className: "js-table-view__message",
					textContent: "Invalid JSON — cannot render as table.",
				}),
			);
			return;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(rawJson);
		} catch {
			return;
		}

		// Check if data is tabular (array of objects)
		const rows = this.extractTabularData(parsed);
		if (!rows) {
			this.el.appendChild(
				createElement("div", {
					className: "js-table-view__message",
					textContent:
						"Table view requires an array of objects. Switch to Tree or Raw view.",
				}),
			);
			return;
		}

		const { columns, data } = rows;

		// Sort data if needed
		const sortedData = this.sortData(data, columns);

		// Build table
		const wrapper = createElement("div", {
			className: "js-table-view__wrapper",
		});

		const table = document.createElement("table");
		table.className = "js-table-view__table";

		// Header
		const thead = document.createElement("thead");
		const headerRow = document.createElement("tr");
		headerRow.className = "js-table-view__header-row";

		// Row number column
		const indexTh = document.createElement("th");
		indexTh.className = "js-table-view__header-cell js-table-view__index-cell";
		indexTh.textContent = "#";
		headerRow.appendChild(indexTh);

		for (const col of columns) {
			const th = document.createElement("th");
			th.className = "js-table-view__header-cell";

			const label = createElement("span", { textContent: col });
			th.appendChild(label);

			// Sort indicator
			const sortIcon = createElement("span", {
				className: "js-table-view__sort-icon",
				textContent: this.getSortIcon(col),
			});
			th.appendChild(sortIcon);

			th.addEventListener("click", () => {
				if (this.sortColumn === col) {
					this.sortDirection =
						this.sortDirection === "asc"
							? "desc"
							: this.sortDirection === "desc"
								? "none"
								: "asc";
				} else {
					this.sortColumn = col;
					this.sortDirection = "asc";
				}
				if (this.sortDirection === "none") {
					this.sortColumn = null;
				}
				this.update(this.store.getState());
			});

			headerRow.appendChild(th);
		}

		thead.appendChild(headerRow);
		table.appendChild(thead);

		// Body
		const tbody = document.createElement("tbody");

		for (let i = 0; i < sortedData.length; i++) {
			const rowData = sortedData[i]!;
			const tr = document.createElement("tr");
			tr.className = "js-table-view__row";

			// Index cell
			const indexTd = document.createElement("td");
			indexTd.className = "js-table-view__cell js-table-view__index-cell";
			indexTd.textContent = String(i);
			tr.appendChild(indexTd);

			for (const col of columns) {
				const td = document.createElement("td");
				td.className = "js-table-view__cell";

				const value = rowData[col];
				const { text, typeClass } = this.formatCellValue(value);
				td.innerHTML = `<span class="${typeClass}">${escapeHtml(text)}</span>`;

				td.addEventListener("dblclick", () => {
					copyToClipboard(text);
				});

				tr.appendChild(td);
			}

			tbody.appendChild(tr);
		}

		table.appendChild(tbody);
		wrapper.appendChild(table);
		this.el.appendChild(wrapper);
	}

	/**
	 * Attempts to extract tabular data from parsed JSON.
	 * Returns null if data is not an array of objects.
	 */
	private extractTabularData(
		parsed: unknown,
	): { columns: string[]; data: Record<string, unknown>[] } | null {
		if (!Array.isArray(parsed) || parsed.length === 0) return null;

		// Check that most items are objects
		const objects = parsed.filter(
			(item) =>
				item !== null && typeof item === "object" && !Array.isArray(item),
		) as Record<string, unknown>[];

		if (objects.length < parsed.length * 0.5) return null;

		// Collect all unique columns across all objects
		const columnSet = new Set<string>();
		for (const obj of objects) {
			for (const key of Object.keys(obj)) {
				columnSet.add(key);
			}
		}

		return {
			columns: Array.from(columnSet),
			data: objects,
		};
	}

	/**
	 * Sorts the data based on current sort column and direction.
	 */
	private sortData(
		data: Record<string, unknown>[],
		_columns: string[],
	): Record<string, unknown>[] {
		if (!this.sortColumn || this.sortDirection === "none") {
			return data;
		}

		const col = this.sortColumn;
		const dir = this.sortDirection === "asc" ? 1 : -1;

		return [...data].sort((a, b) => {
			const va = a[col];
			const vb = b[col];

			if (va === vb) return 0;
			if (va === undefined || va === null) return 1;
			if (vb === undefined || vb === null) return -1;

			if (typeof va === "number" && typeof vb === "number") {
				return (va - vb) * dir;
			}

			return String(va).localeCompare(String(vb)) * dir;
		});
	}

	/**
	 * Returns the sort arrow icon for a column.
	 */
	private getSortIcon(column: string): string {
		if (this.sortColumn !== column) return " ↕";
		if (this.sortDirection === "asc") return " ↑";
		if (this.sortDirection === "desc") return " ↓";
		return " ↕";
	}

	/**
	 * Formats a cell value for display.
	 */
	private formatCellValue(value: unknown): {
		text: string;
		typeClass: string;
	} {
		if (value === null) return { text: "null", typeClass: "js-syn-null" };
		if (value === undefined) return { text: "—", typeClass: "" };
		if (typeof value === "string")
			return { text: `"${value}"`, typeClass: "js-syn-string" };
		if (typeof value === "number")
			return { text: String(value), typeClass: "js-syn-number" };
		if (typeof value === "boolean")
			return { text: String(value), typeClass: "js-syn-boolean" };
		if (Array.isArray(value))
			return { text: `[${value.length}]`, typeClass: "js-syn-bracket" };
		if (typeof value === "object")
			return {
				text: `{${Object.keys(value as Record<string, unknown>).length}}`,
				typeClass: "js-syn-bracket",
			};
		return { text: String(value), typeClass: "" };
	}
}
