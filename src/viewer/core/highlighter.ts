/**
 * Syntax highlighter for JSON.
 * Zero dependencies — produces HTML spans with CSS classes.
 *
 * @module highlighter
 */

import { escapeHtml } from "../../shared/dom.js";

/** CSS class names for each token type. */
const TOKEN_CLASSES = {
	string: "js-syn-string",
	number: "js-syn-number",
	boolean: "js-syn-boolean",
	null: "js-syn-null",
	key: "js-syn-key",
	bracket: "js-syn-bracket",
	colon: "js-syn-colon",
	comma: "js-syn-comma",
} as const;

/**
 * Produces syntax-highlighted HTML from a JSON string.
 *
 * @param json - Formatted JSON string
 * @returns HTML string with syntax highlighting spans
 *
 * @example
 * ```ts
 * const html = highlightJson('{"name": "Alice", "age": 30}');
 * container.innerHTML = html;
 * ```
 */
export function highlightJson(json: string): string {
	return json.replace(
		/("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\]])|(:)|(,)/g,
		(
			match,
			key?: string,
			str?: string,
			num?: string,
			bool?: string,
			nul?: string,
			bracket?: string,
			colon?: string,
			comma?: string,
		) => {
			if (key) {
				return `<span class="${TOKEN_CLASSES.key}">${escapeHtml(key)}</span>:`;
			}
			if (str) {
				return wrapUrlsInString(str);
			}
			if (num) {
				return `<span class="${TOKEN_CLASSES.number}">${escapeHtml(num)}</span>`;
			}
			if (bool) {
				return `<span class="${TOKEN_CLASSES.boolean}">${escapeHtml(bool)}</span>`;
			}
			if (nul) {
				return `<span class="${TOKEN_CLASSES.null}">${escapeHtml(nul)}</span>`;
			}
			if (bracket) {
				return `<span class="${TOKEN_CLASSES.bracket}">${escapeHtml(bracket)}</span>`;
			}
			if (colon) {
				return `<span class="${TOKEN_CLASSES.colon}">:</span>`;
			}
			if (comma) {
				return `<span class="${TOKEN_CLASSES.comma}">,</span>`;
			}
			return escapeHtml(match);
		},
	);
}

/**
 * Wraps URLs found inside JSON string values in clickable anchor tags.
 */
function wrapUrlsInString(str: string): string {
	// Remove surrounding quotes for processing
	const inner = str.slice(1, -1);
	const urlPattern = /https?:\/\/[^\s"\\]+/g;

	if (!urlPattern.test(inner)) {
		return `<span class="${TOKEN_CLASSES.string}">${escapeHtml(str)}</span>`;
	}

	// Reset regex lastIndex after test
	urlPattern.lastIndex = 0;

	const highlighted = inner.replace(urlPattern, (url) => {
		const escaped = escapeHtml(url);
		return `</span><a class="js-url" href="${escaped}" target="_blank" rel="noopener noreferrer">${escaped}</a><span class="${TOKEN_CLASSES.string}">`;
	});

	return `<span class="${TOKEN_CLASSES.string}">"${highlighted}"</span>`;
}

/**
 * Returns the CSS class name for a given JSON value type.
 */
export function getTypeClass(type: string): string {
	switch (type) {
		case "string":
			return TOKEN_CLASSES.string;
		case "number":
			return TOKEN_CLASSES.number;
		case "boolean":
			return TOKEN_CLASSES.boolean;
		case "null":
			return TOKEN_CLASSES.null;
		default:
			return "";
	}
}
