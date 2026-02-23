/**
 * JSON formatter: pretty-print and minify.
 *
 * @module formatter
 */

/**
 * Pretty-prints a JSON string with configurable indentation.
 *
 * @param raw - Raw JSON string
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
export function prettyPrint(raw: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, indent);
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
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Formats a number with thousands separators.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}
