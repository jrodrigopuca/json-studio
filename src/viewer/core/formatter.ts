/**
 * JSON formatter: pretty-print and minify.
 *
 * @module formatter
 */

/**
 * Pretty-prints a JSON string with configurable indentation.
 *
 * @param raw - Raw JSON string
 * @param indent - Number of spaces or "tab" for tab indentation (default: 2)
 * @returns Formatted JSON string
 */
export function prettyPrint(raw: string, indent: number | "tab" = 2): string {
	try {
		const parsed = JSON.parse(raw);
		const indentArg = indent === "tab" ? "\t" : indent;
		return JSON.stringify(parsed, null, indentArg);
	} catch {
		return raw;
	}
}

/**
 * Minifies a JSON string by removing all unnecessary whitespace.
 *
 * @param raw - Raw JSON string
 * @returns Minified JSON string
 */
export function minify(raw: string): string {
	try {
		const parsed = JSON.parse(raw);
		return JSON.stringify(parsed);
	} catch {
		return raw;
	}
}

/**
 * Formats a byte size into a human-readable string.
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "3.2 MB")
 */
export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Formats a number with thousands separators.
 */
export function formatNumber(num: number): string {
	return num.toLocaleString("en-US");
}

/**
 * Formats a timestamp to a localized date/time string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}

/**
 * Sorts all object keys in a JSON string alphabetically (recursive).
 *
 * @param raw - Raw JSON string
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns JSON string with keys sorted, or original if invalid
 */
export function sortJsonByKeys(
	raw: string,
	direction: "asc" | "desc" = "asc",
): string {
	try {
		const parsed = JSON.parse(raw);
		const sorted = deepSortKeys(parsed, direction);
		return JSON.stringify(sorted, null, 2);
	} catch {
		return raw;
	}
}

/**
 * Recursively sorts object keys alphabetically.
 */
function deepSortKeys(value: unknown, direction: "asc" | "desc"): unknown {
	if (value === null || typeof value !== "object") {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((v) => deepSortKeys(v, direction));
	}

	const sorted: Record<string, unknown> = {};
	const keys = Object.keys(value as Record<string, unknown>).sort();
	if (direction === "desc") keys.reverse();

	for (const key of keys) {
		sorted[key] = deepSortKeys(
			(value as Record<string, unknown>)[key],
			direction,
		);
	}
	return sorted;
}
