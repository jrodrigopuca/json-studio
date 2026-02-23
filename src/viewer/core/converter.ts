/**
 * JSON converter — transforms JSON to/from various formats.
 *
 * Supports: YAML, CSV, TypeScript interfaces.
 * Zero external dependencies — all conversions are hand-written.
 *
 * @module converter
 */

// ─── JSON → YAML ────────────────────────────────────────────────────────────

/**
 * Converts a JSON string to YAML format.
 *
 * @param raw - Valid JSON string
 * @returns YAML string
 */
export function jsonToYaml(raw: string): string {
	try {
		const parsed = JSON.parse(raw);
		return toYaml(parsed, 0);
	} catch {
		return `# Invalid JSON\n${raw}`;
	}
}

/**
 * Recursively converts a JS value to YAML lines.
 */
function toYaml(value: unknown, depth: number): string {
	const indent = "  ".repeat(depth);

	if (value === null) return "null";
	if (value === undefined) return "null";
	if (typeof value === "boolean") return String(value);
	if (typeof value === "number") return String(value);

	if (typeof value === "string") {
		// Use quoted style for strings that might be ambiguous
		if (
			value === "" ||
			value === "true" ||
			value === "false" ||
			value === "null" ||
			value === "~" ||
			/^\d/.test(value) ||
			/[:#\[\]{}&*!|>'"%@`]/.test(value) ||
			value.includes("\n")
		) {
			if (value.includes("\n")) {
				const lines = value.split("\n");
				return `|\n${lines.map((l) => `${indent}  ${l}`).join("\n")}`;
			}
			return JSON.stringify(value);
		}
		return value;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) return "[]";
		const lines: string[] = [];
		for (const item of value) {
			const yaml = toYaml(item, depth + 1);
			if (typeof item === "object" && item !== null && !Array.isArray(item)) {
				// Object items: first key on same line as dash
				const firstNewline = yaml.indexOf("\n");
				if (firstNewline === -1) {
					lines.push(`${indent}- ${yaml}`);
				} else {
					const firstLine = yaml.substring(0, firstNewline);
					const rest = yaml.substring(firstNewline);
					lines.push(`${indent}- ${firstLine.trimStart()}${rest}`);
				}
			} else {
				lines.push(`${indent}- ${yaml}`);
			}
		}
		return "\n" + lines.join("\n");
	}

	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		if (entries.length === 0) return "{}";
		const lines: string[] = [];
		for (const [key, val] of entries) {
			const safeKey = /^[\w.-]+$/.test(key) ? key : JSON.stringify(key);
			const yaml = toYaml(val, depth + 1);
			if (
				typeof val === "object" &&
				val !== null &&
				((Array.isArray(val) && val.length > 0) ||
					(!Array.isArray(val) &&
						Object.keys(val as Record<string, unknown>).length > 0))
			) {
				lines.push(`${indent}${safeKey}:${yaml}`);
			} else {
				lines.push(`${indent}${safeKey}: ${yaml}`);
			}
		}
		return (depth === 0 ? "" : "\n") + lines.join("\n");
	}

	return String(value);
}

// ─── JSON → CSV ──────────────────────────────────────────────────────────────

/**
 * Converts a JSON array-of-objects to CSV format.
 * If the JSON is not an array of objects, wraps it in a single-row table.
 *
 * @param raw - Valid JSON string
 * @returns CSV string
 */
export function jsonToCsv(raw: string): string {
	try {
		const parsed = JSON.parse(raw);
		const rows = Array.isArray(parsed) ? parsed : [parsed];

		if (rows.length === 0) return "";

		// Collect all unique keys across all objects
		const keySet = new Set<string>();
		for (const row of rows) {
			if (typeof row === "object" && row !== null && !Array.isArray(row)) {
				for (const key of Object.keys(row)) {
					keySet.add(key);
				}
			}
		}

		const headers = Array.from(keySet);
		if (headers.length === 0) {
			// Fallback for arrays of primitives
			return rows.map((v) => csvEscape(String(v))).join("\n");
		}

		const headerRow = headers.map(csvEscape).join(",");
		const dataRows = rows.map((row) => {
			if (typeof row !== "object" || row === null || Array.isArray(row)) {
				return headers.map(() => "").join(",");
			}
			return headers
				.map((h) => {
					const val = (row as Record<string, unknown>)[h];
					if (val === null || val === undefined) return "";
					if (typeof val === "object") return csvEscape(JSON.stringify(val));
					return csvEscape(String(val));
				})
				.join(",");
		});

		return [headerRow, ...dataRows].join("\n");
	} catch {
		return `# Invalid JSON\n${raw}`;
	}
}

/**
 * Escapes a CSV field value.
 */
function csvEscape(value: string): string {
	if (
		value.includes(",") ||
		value.includes('"') ||
		value.includes("\n") ||
		value.includes("\r")
	) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

// ─── JSON → TypeScript ───────────────────────────────────────────────────────

/**
 * Converts a JSON string to TypeScript interface definitions.
 *
 * @param raw - Valid JSON string
 * @param rootName - Name for the root interface (default: "RootObject")
 * @returns TypeScript interface string
 */
export function jsonToTypeScript(
	raw: string,
	rootName: string = "RootObject",
): string {
	try {
		const parsed = JSON.parse(raw);
		const interfaces: Map<string, string> = new Map();
		inferType(parsed, rootName, interfaces);

		return Array.from(interfaces.values()).join("\n\n") + "\n";
	} catch {
		return `// Invalid JSON\n// ${raw.substring(0, 200)}`;
	}
}

/**
 * Recursively infers TypeScript types and generates interfaces.
 */
function inferType(
	value: unknown,
	name: string,
	interfaces: Map<string, string>,
): string {
	if (value === null) return "null";
	if (typeof value === "boolean") return "boolean";
	if (typeof value === "number") return "number";
	if (typeof value === "string") return "string";

	if (Array.isArray(value)) {
		if (value.length === 0) return "unknown[]";

		// Infer element type from all items
		const types = new Set<string>();
		for (let i = 0; i < value.length; i++) {
			const itemType = inferType(value[i], `${name}Item`, interfaces);
			types.add(itemType);
		}

		const union = Array.from(types).join(" | ");
		return types.size === 1 ? `${union}[]` : `(${union})[]`;
	}

	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		const interfaceName = pascalCase(name);

		const fields = entries
			.map(([key, val]) => {
				const fieldName = isValidIdentifier(key) ? key : `"${key}"`;
				const fieldType = inferType(val, `${name}_${key}`, interfaces);
				return `  ${fieldName}: ${fieldType};`;
			})
			.join("\n");

		const iface = `export interface ${interfaceName} {\n${fields}\n}`;
		interfaces.set(interfaceName, iface);

		return interfaceName;
	}

	return "unknown";
}

/**
 * Converts a string to PascalCase.
 */
function pascalCase(str: string): string {
	return str
		.replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
		.replace(/^[a-z]/, (char) => char.toUpperCase());
}

/**
 * Checks if a string is a valid JS identifier.
 */
function isValidIdentifier(str: string): boolean {
	return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

// ─── YAML → JSON ─────────────────────────────────────────────────────────────

/**
 * Naively parses simple YAML to a JSON string.
 * Supports basic key-value, arrays, and nested objects.
 * Not a full YAML parser — covers common cases for file import.
 *
 * @param yaml - YAML string
 * @returns JSON string
 */
export function yamlToJson(yaml: string): string {
	try {
		const result = parseYaml(yaml);
		return JSON.stringify(result, null, 2);
	} catch {
		throw new Error("Unable to parse YAML");
	}
}

/**
 * Simple YAML parser for common structures.
 */
function parseYaml(yaml: string): unknown {
	const lines = yaml.split("\n");
	const result = parseYamlLines(lines, 0, 0);
	return result.value;
}

interface YamlParseResult {
	value: unknown;
	nextLine: number;
}

function parseYamlLines(
	lines: string[],
	startLine: number,
	baseIndent: number,
): YamlParseResult {
	if (startLine >= lines.length) return { value: null, nextLine: startLine };

	const firstLine = lines[startLine]!;
	const trimmed = firstLine.trim();

	// Empty or comment
	if (trimmed === "" || trimmed.startsWith("#")) {
		return parseYamlLines(lines, startLine + 1, baseIndent);
	}

	// Array item
	if (trimmed.startsWith("- ")) {
		return parseYamlArray(lines, startLine, baseIndent);
	}

	// Object
	if (trimmed.includes(":")) {
		return parseYamlObject(lines, startLine, baseIndent);
	}

	// Scalar
	return { value: parseYamlScalar(trimmed), nextLine: startLine + 1 };
}

function getIndent(line: string): number {
	const match = line.match(/^(\s*)/);
	return match ? match[1]!.length : 0;
}

function parseYamlObject(
	lines: string[],
	startLine: number,
	baseIndent: number,
): YamlParseResult {
	const obj: Record<string, unknown> = {};
	let i = startLine;

	while (i < lines.length) {
		const line = lines[i]!;
		const trimmed = line.trim();

		if (trimmed === "" || trimmed.startsWith("#")) {
			i++;
			continue;
		}

		const indent = getIndent(line);
		if (indent < baseIndent) break;
		if (indent > baseIndent && i > startLine) break;

		const colonIndex = trimmed.indexOf(":");
		if (colonIndex === -1) break;

		const key = trimmed
			.substring(0, colonIndex)
			.trim()
			.replace(/^["']|["']$/g, "");
		const valueStr = trimmed.substring(colonIndex + 1).trim();

		if (valueStr === "" || valueStr === "|" || valueStr === ">") {
			// Value is on next lines (nested)
			i++;
			if (i < lines.length) {
				const nextIndent = getIndent(lines[i]!);
				if (nextIndent > indent) {
					const nested = parseYamlLines(lines, i, nextIndent);
					obj[key] = nested.value;
					i = nested.nextLine;
				} else {
					obj[key] = null;
				}
			}
		} else {
			obj[key] = parseYamlScalar(valueStr);
			i++;
		}
	}

	return { value: obj, nextLine: i };
}

function parseYamlArray(
	lines: string[],
	startLine: number,
	_baseIndent: number,
): YamlParseResult {
	const arr: unknown[] = [];
	let i = startLine;
	const itemIndent = getIndent(lines[startLine]!);

	while (i < lines.length) {
		const line = lines[i]!;
		const trimmed = line.trim();

		if (trimmed === "" || trimmed.startsWith("#")) {
			i++;
			continue;
		}

		const indent = getIndent(line);
		if (indent < itemIndent) break;
		if (indent > itemIndent) {
			i++;
			continue;
		}

		if (!trimmed.startsWith("- ")) break;

		const valueStr = trimmed.substring(2).trim();
		if (
			valueStr.includes(":") &&
			!valueStr.startsWith('"') &&
			!valueStr.startsWith("'")
		) {
			// Inline object in array
			const nestedLines = [
				valueStr,
				...collectNestedLines(lines, i + 1, indent + 2),
			];
			const nested = parseYamlLines(nestedLines, 0, 0);
			arr.push(nested.value);
			i += 1 + collectNestedLines(lines, i + 1, indent + 2).length;
		} else {
			arr.push(parseYamlScalar(valueStr));
			i++;
		}
	}

	return { value: arr, nextLine: i };
}

function collectNestedLines(
	lines: string[],
	startLine: number,
	minIndent: number,
): string[] {
	const result: string[] = [];
	for (let i = startLine; i < lines.length; i++) {
		const line = lines[i]!;
		if (line.trim() === "" || getIndent(line) >= minIndent) {
			result.push(line.substring(minIndent));
		} else {
			break;
		}
	}
	return result;
}

function parseYamlScalar(value: string): unknown {
	if (value === "null" || value === "~") return null;
	if (value === "true") return true;
	if (value === "false") return false;
	if (value === "[]") return [];
	if (value === "{}") return {};

	// Quoted string
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	// Number
	const num = Number(value);
	if (!isNaN(num) && value !== "") return num;

	return value;
}
