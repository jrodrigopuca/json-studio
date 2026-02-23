/**
 * Breadcrumb component — Clickable navigation path showing the selected node's ancestry.
 *
 * Displays: root > users > [0] > address > city
 * Clicking any segment selects that node and scrolls to it.
 */

import { BaseComponent } from "../../base-component.js";
import { createElement } from "../../../shared/dom.js";
import type { AppState } from "../../core/store.types.js";
import type { FlatNode } from "../../core/parser.types.js";
import type { BreadcrumbSegment } from "./breadcrumb.types.js";

export class Breadcrumb extends BaseComponent {
	render(container: HTMLElement): void {
		this.el = createElement("nav", {
			className: "js-breadcrumb",
			attributes: {
				"aria-label": "JSON path breadcrumb",
			},
		});

		container.appendChild(this.el);

		this.watch(["selectedNodeId", "nodes"], () =>
			this.update(this.store.getState()),
		);
		this.update(this.store.getState());
	}

	update(_state: Partial<AppState>): void {
		const { selectedNodeId, nodes } = this.store.getState();

		// Clear existing breadcrumbs
		this.el.innerHTML = "";

		// Always show at least root segment
		if (nodes.length === 0) {
			const rootBtn = createElement("button", {
				className: "js-breadcrumb__segment js-breadcrumb__segment--active",
				textContent: "root",
				attributes: { title: "root" },
			});
			this.el.appendChild(rootBtn);
			return;
		}

		// If no node selected, show root only
		if (selectedNodeId === null) {
			const rootNode = nodes[0];
			const rootBtn = createElement("button", {
				className: "js-breadcrumb__segment js-breadcrumb__segment--active",
				textContent: rootNode ? this.getSegmentLabel(rootNode) : "root",
				attributes: { title: "root" },
			});
			rootBtn.addEventListener("click", () => {
				if (rootNode) this.store.setState({ selectedNodeId: rootNode.id });
			});
			this.el.appendChild(rootBtn);
			return;
		}

		const segments = this.buildSegments(selectedNodeId, nodes);

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i]!;

			if (i > 0) {
				this.el.appendChild(
					createElement("span", {
						className: "js-breadcrumb__separator",
						textContent: "›",
					}),
				);
			}

			const isLast = i === segments.length - 1;
			const btn = createElement("button", {
				className: `js-breadcrumb__segment${isLast ? " js-breadcrumb__segment--active" : ""}`,
				textContent: segment.label,
				attributes: {
					title: segment.label,
					"aria-current": isLast ? "location" : "",
				},
			});

			btn.addEventListener("click", () => {
				this.store.setState({ selectedNodeId: segment.nodeId });
			});

			this.el.appendChild(btn);
		}
	}

	/**
	 * Builds the list of breadcrumb segments from root to the given node.
	 */
	private buildSegments(
		nodeId: number,
		nodes: FlatNode[],
	): BreadcrumbSegment[] {
		const segments: BreadcrumbSegment[] = [];
		let current = nodes.find((n) => n.id === nodeId);

		while (current) {
			const label = this.getSegmentLabel(current);
			segments.unshift({ label, nodeId: current.id });

			if (current.parentId === -1) break;
			current = nodes.find((n) => n.id === current!.parentId);
		}

		return segments;
	}

	/**
	 * Returns a human-readable label for a breadcrumb segment.
	 */
	private getSegmentLabel(node: FlatNode): string {
		if (node.parentId === -1) return "root";
		if (node.key !== null) return node.key;

		// Array item — find parent and determine index
		const parent = this.store
			.getState()
			.nodes.find((n) => n.id === node.parentId);
		if (parent?.childrenRange) {
			const index = node.id - parent.childrenRange[0];
			return `[${index}]`;
		}
		return `[?]`;
	}
}
