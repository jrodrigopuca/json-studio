/**
 * Reusable DOM helper utilities.
 * Minimises boilerplate for creating elements and managing events.
 */

/** Options for createElement helper. */
interface CreateElementOptions {
	className?: string;
	textContent?: string;
	innerHTML?: string;
	attributes?: Record<string, string>;
	children?: (HTMLElement | string)[];
	dataset?: Record<string, string>;
	onClick?: EventListener;
}

/**
 * Creates an HTML element with declarative options.
 *
 * @param tag - HTML tag name
 * @param options - Element configuration
 * @returns The created element
 *
 * @example
 * ```ts
 * const btn = createElement('button', {
 *   className: 'js-toolbar__button',
 *   textContent: 'Copy',
 *   onClick: () => navigator.clipboard.writeText('hello'),
 * });
 * ```
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	options: CreateElementOptions = {},
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);

	if (options.className) {
		el.className = options.className;
	}
	if (options.textContent) {
		el.textContent = options.textContent;
	}
	if (options.innerHTML !== undefined) {
		el.innerHTML = options.innerHTML;
	}
	if (options.attributes) {
		for (const [key, value] of Object.entries(options.attributes)) {
			el.setAttribute(key, value);
		}
	}
	if (options.dataset) {
		for (const [key, value] of Object.entries(options.dataset)) {
			el.dataset[key] = value;
		}
	}
	if (options.children) {
		for (const child of options.children) {
			if (typeof child === "string") {
				el.appendChild(document.createTextNode(child));
			} else {
				el.appendChild(child);
			}
		}
	}
	if (options.onClick) {
		el.addEventListener("click", options.onClick);
	}

	return el;
}

/**
 * Queries a single element and throws if not found.
 *
 * @param selector - CSS selector
 * @param parent - Parent element to query within
 * @returns The matched element
 */
export function querySelector<T extends HTMLElement>(
	selector: string,
	parent: ParentNode = document,
): T {
	const el = parent.querySelector<T>(selector);
	if (!el) {
		throw new Error(`Element not found: ${selector}`);
	}
	return el;
}

/**
 * Removes all child nodes from an element.
 */
export function clearElement(el: HTMLElement): void {
	while (el.firstChild) {
		el.removeChild(el.firstChild);
	}
}

/**
 * Copies text to clipboard with fallback.
 *
 * @param text - Text to copy
 * @returns Whether the copy succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fallback for older browsers
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		const success = document.execCommand("copy");
		document.body.removeChild(textarea);
		return success;
	}
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
	const map: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};
	return str.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
