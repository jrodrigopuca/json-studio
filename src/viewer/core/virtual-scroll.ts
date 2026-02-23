/**
 * Custom virtual scroll implementation using IntersectionObserver.
 * Renders only visible nodes in the viewport for performance.
 *
 * @module virtual-scroll
 */

import { NODE_HEIGHT } from "../../shared/constants.js";

export interface VirtualScrollOptions {
	/** Container element that scrolls. */
	container: HTMLElement;
	/** Total number of items. */
	totalItems: number;
	/** Height of each item in pixels. */
	itemHeight?: number;
	/** Number of extra items to render above/below viewport. */
	overscan?: number;
	/** Callback to render a single item. */
	renderItem: (index: number) => HTMLElement;
}

export interface VirtualScrollInstance {
	/** Update total item count (e.g., after filtering). */
	setTotalItems(count: number): void;
	/** Force re-render of visible items. */
	refresh(): void;
	/** Scroll to make a specific item visible. */
	scrollToItem(index: number): void;
	/** Clean up observers and listeners. */
	dispose(): void;
}

/**
 * Creates a virtual scroll instance.
 * Only renders items visible in the viewport plus overscan buffer.
 *
 * @param options - Virtual scroll configuration
 * @returns Control interface for the virtual scroll
 */
export function createVirtualScroll(
	options: VirtualScrollOptions,
): VirtualScrollInstance {
	const {
		container,
		itemHeight = NODE_HEIGHT,
		overscan = 10,
		renderItem,
	} = options;

	let totalItems = options.totalItems;

	// Create inner content element for scrollbar sizing
	const content = document.createElement("div");
	content.className = "js-virtual-scroll__content";
	content.style.position = "relative";
	content.style.width = "100%";
	updateContentHeight();
	container.appendChild(content);

	// Track rendered range
	let renderedStart = 0;
	let renderedEnd = 0;

	function updateContentHeight(): void {
		content.style.height = `${totalItems * itemHeight}px`;
	}

	function getVisibleRange(): { start: number; end: number } {
		const scrollTop = container.scrollTop;
		const viewportHeight = container.clientHeight;

		const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const end = Math.min(
			totalItems,
			Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
		);

		return { start, end };
	}

	function renderVisibleItems(): void {
		const { start, end } = getVisibleRange();

		if (start === renderedStart && end === renderedEnd) return;

		// Clear existing items
		while (content.firstChild) {
			content.removeChild(content.firstChild);
		}

		// Render visible items
		for (let i = start; i < end; i++) {
			const item = renderItem(i);
			item.style.position = "absolute";
			item.style.top = `${i * itemHeight}px`;
			item.style.width = "100%";
			item.style.height = `${itemHeight}px`;
			content.appendChild(item);
		}

		renderedStart = start;
		renderedEnd = end;
	}

	// Scroll handler
	function onScroll(): void {
		requestAnimationFrame(renderVisibleItems);
	}

	container.addEventListener("scroll", onScroll, { passive: true });

	// Initial render
	renderVisibleItems();

	return {
		setTotalItems(count: number): void {
			totalItems = count;
			updateContentHeight();
			renderVisibleItems();
		},

		refresh(): void {
			renderedStart = -1;
			renderedEnd = -1;
			renderVisibleItems();
		},

		scrollToItem(index: number): void {
			const top = index * itemHeight;
			container.scrollTo({ top, behavior: "smooth" });
		},

		dispose(): void {
			container.removeEventListener("scroll", onScroll);
			content.remove();
		},
	};
}
