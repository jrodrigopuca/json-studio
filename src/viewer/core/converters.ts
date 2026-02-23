/**
 * JSON conversion utilities — unified module.
 *
 * Supports: TypeScript interfaces, XML, YAML, CSV.
 * Zero external dependencies — all conversions are hand-written.
 *
 * @module converters
 */

// ─── TypeScript Interface Generator ──────────────────────────────────────────

interface TypeInfo {
	type: string;
	isArray: boolean;
	isOptional: boolean;
	nestedInterface?: string;
}

/**
 * Infer TypeScript type from a JavaScript value.
 */
function inferType(
	value: unknown,
	interfaceName: string,
	interfaces: Map<string, string>,
): TypeInfo {
	if (value === null) {
		return { type: "null", isArray: false, isOptional: false };
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return { type: "unknown[]", isArray: true, isOptional: false };
		}

		// Analyze all items to find common type
		const itemTypes = value.map((item) =>
			inferType(item, `${interfaceName}Item`, interfaces),
		);

		// If all items are the same primitive type
		const primitiveTypes = new Set(itemTypes.map((t) => t.type));
		const firstType = itemTypes[0];
		if (primitiveTypes.size === 1 && firstType && !firstType.nestedInterface) {
			return { type: `${firstType.type}[]`, isArray: true, isOptional: false };
		}

		// If items are objects, merge their interfaces
		if (
			typeof value[0] === "object" &&
			value[0] !== null &&
			!Array.isArray(value[0])
		) {
			mergeObjectTypes(
				value as Record<string, unknown>[],
				`${interfaceName}Item`,
				interfaces,
			);
			return {
				type: `${interfaceName}Item[]`,
				isArray: true,
				isOptional: false,
				nestedInterface: `${interfaceName}Item`,
			};
		}

		// Mixed types
		const uniqueTypes = [...new Set(itemTypes.map((t) => t.type))];
		return {
			type: `(${uniqueTypes.join(" | ")})[]`,
			isArray: true,
			isOptional: false,
		};
	}

	if (typeof value === "object") {
		generateInterface(
			value as Record<string, unknown>,
			interfaceName,
			interfaces,
		);
		return {
			type: interfaceName,
			isArray: false,
			isOptional: false,
			nestedInterface: interfaceName,
		};
	}

	switch (typeof value) {
		case "string":
			return { type: "string", isArray: false, isOptional: false };
		case "number":
			return {
				type: Number.isInteger(value) ? "number" : "number",
				isArray: false,
				isOptional: false,
			};
		case "boolean":
			return { type: "boolean", isArray: false, isOptional: false };
		default:
			return { type: "unknown", isArray: false, isOptional: false };
	}
}

/**
 * Merge types from multiple objects (for arrays of objects).
 */
function mergeObjectTypes(
	objects: Record<string, unknown>[],
	interfaceName: string,
	interfaces: Map<string, string>,
): void {
	const allKeys = new Set<string>();
	const keyPresence = new Map<string, number>();
	const keyTypes = new Map<string, Set<string>>();

	// Collect all keys and their types
	for (const obj of objects) {
		for (const key of Object.keys(obj)) {
			allKeys.add(key);
			keyPresence.set(key, (keyPresence.get(key) || 0) + 1);

			const typeInfo = inferType(
				obj[key],
				`${interfaceName}${pascalCase(key)}`,
				interfaces,
			);
			if (!keyTypes.has(key)) {
				keyTypes.set(key, new Set());
			}
			keyTypes.get(key)!.add(typeInfo.type);
		}
	}

	// Generate interface with optional markers
	const props: string[] = [];
	for (const key of allKeys) {
		const isOptional = keyPresence.get(key)! < objects.length;
		const types = [...keyTypes.get(key)!];
		const typeStr = types.length === 1 ? types[0] : types.join(" | ");
		const safeName = isValidIdentifier(key) ? key : `'${key}'`;
		props.push(`  ${safeName}${isOptional ? "?" : ""}: ${typeStr};`);
	}

	interfaces.set(
		interfaceName,
		`interface ${interfaceName} {\n${props.join("\n")}\n}`,
	);
}

/**
 * Generate a TypeScript interface from an object.
 */
function generateInterface(
	obj: Record<string, unknown>,
	interfaceName: string,
	interfaces: Map<string, string>,
): void {
	const props: string[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const nestedName = `${interfaceName}${pascalCase(key)}`;
		const typeInfo = inferType(value, nestedName, interfaces);
		const safeName = isValidIdentifier(key) ? key : `'${key}'`;
		props.push(`  ${safeName}: ${typeInfo.type};`);
	}

	interfaces.set(
		interfaceName,
		`interface ${interfaceName} {\n${props.join("\n")}\n}`,
	);
}

/**
 * Convert a string to PascalCase.
 */
function pascalCase(str: string): string {
	return str
		.replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
		.replace(/^[a-z]/, (char) => char.toUpperCase());
}

/**
 * Check if a string is a valid JS identifier.
 */
function isValidIdentifier(str: string): boolean {
	return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * Convert JSON to TypeScript interfaces.
 * Accepts either a parsed value or a raw JSON string.
 */
export function jsonToTypeScript(json: unknown, rootName = "Root"): string {
	let data = json;
	if (typeof json === "string") {
		try {
			data = JSON.parse(json);
		} catch {
			return `// Invalid JSON\n// ${json.substring(0, 200)}`;
		}
	}

	const interfaces = new Map<string, string>();

	if (Array.isArray(data)) {
		if (data.length === 0) {
			return `type ${rootName} = unknown[];`;
		}

		const firstItem = data[0];
		if (
			typeof firstItem === "object" &&
			firstItem !== null &&
			!Array.isArray(firstItem)
		) {
			mergeObjectTypes(
				data as Record<string, unknown>[],
				`${rootName}Item`,
				interfaces,
			);
			interfaces.set(rootName, `type ${rootName} = ${rootName}Item[];`);
		} else {
			const typeInfo = inferType(data, rootName, interfaces);
			return `type ${rootName} = ${typeInfo.type};`;
		}
	} else if (typeof data === "object" && data !== null) {
		generateInterface(data as Record<string, unknown>, rootName, interfaces);
	} else {
		const typeInfo = inferType(data, rootName, interfaces);
		return `type ${rootName} = ${typeInfo.type};`;
	}

	// Sort interfaces: nested first, then root
	const sortedInterfaces: string[] = [];
	const rootInterface = interfaces.get(rootName);

	for (const [name, def] of interfaces) {
		if (name !== rootName) {
			sortedInterfaces.push(def);
		}
	}

	if (rootInterface) {
		sortedInterfaces.push(rootInterface);
	}

	return sortedInterfaces.join("\n\n");
}

// ─── XML Converter ───────────────────────────────────────────────────────────

/**
 * Escape special XML characters.
 */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * Sanitize a key to be a valid XML tag name.
 */
function sanitizeTagName(key: string): string {
	// XML tag names can't start with numbers or contain certain characters
	let tag = key.replace(/[^a-zA-Z0-9_-]/g, "_");
	if (/^[0-9]/.test(tag)) {
		tag = "_" + tag;
	}
	return tag || "item";
}

/**
 * Convert a value to XML elements.
 */
function valueToXml(value: unknown, tagName: string, indent: string): string {
	const tag = sanitizeTagName(tagName);

	if (value === null) {
		return `${indent}<${tag} xsi:nil="true"/>`;
	}

	if (value === undefined) {
		return "";
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return `${indent}<${tag}/>`;
		}

		const items = value
			.map((item) => valueToXml(item, "item", indent + "  "))
			.filter(Boolean)
			.join("\n");

		return `${indent}<${tag}>\n${items}\n${indent}</${tag}>`;
	}

	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		if (entries.length === 0) {
			return `${indent}<${tag}/>`;
		}

		const children = entries
			.map(([key, val]) => valueToXml(val, key, indent + "  "))
			.filter(Boolean)
			.join("\n");

		return `${indent}<${tag}>\n${children}\n${indent}</${tag}>`;
	}

	if (typeof value === "boolean") {
		return `${indent}<${tag}>${value}</${tag}>`;
	}

	if (typeof value === "number") {
		return `${indent}<${tag}>${value}</${tag}>`;
	}

	// String
	return `${indent}<${tag}>${escapeXml(String(value))}</${tag}>`;
}

/**
 * Convert JSON to XML.
 */
export function jsonToXml(json: unknown, rootName = "root"): string {
	const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';

	if (Array.isArray(json)) {
		const items = json
			.map((item) => valueToXml(item, "item", "  "))
			.filter(Boolean)
			.join("\n");

		return `${xmlDeclaration}\n<${rootName}>\n${items}\n</${rootName}>`;
	}

	if (typeof json === "object" && json !== null) {
		const entries = Object.entries(json as Record<string, unknown>);
		const children = entries
			.map(([key, val]) => valueToXml(val, key, "  "))
			.filter(Boolean)
			.join("\n");

		return `${xmlDeclaration}\n<${rootName}>\n${children}\n</${rootName}>`;
	}

	// Primitive value
	return `${xmlDeclaration}\n<${rootName}>${escapeXml(String(json))}</${rootName}>`;
}

// ─── Format Types ────────────────────────────────────────────────────────────

export type ConvertFormat = "typescript" | "xml" | "yaml" | "csv";

export const CONVERT_FORMATS: { id: ConvertFormat; label: string }[] = [
	{ id: "typescript", label: "TypeScript" },
	{ id: "xml", label: "XML" },
	{ id: "yaml", label: "YAML" },
	{ id: "csv", label: "CSV" },
];

/**
 * Convert JSON to the specified format.
 */
export function convertJson(json: unknown, format: ConvertFormat): string {
	switch (format) {
		case "typescript":
			return jsonToTypeScript(json);
		case "xml":
			return jsonToXml(json);
		case "yaml":
			return jsonToYaml(JSON.stringify(json));
		case "csv":
			return jsonToCsv(JSON.stringify(json));
		default:
			return "";
	}
}

// ─── JSON → YAML ────────────────────────────────────────────────────────────

/**
 * Converts a JSON string to YAML format.
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
 */
export function jsonToCsv(raw: string): string {
	try {
		const parsed = JSON.parse(raw);
		const rows = Array.isArray(parsed) ? parsed : [parsed];

		if (rows.length === 0) return "";

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

// ─── YAML → JSON ─────────────────────────────────────────────────────────────

/**
 * Naively parses simple YAML to a JSON string.
 * Supports basic key-value, arrays, and nested objects.
 */
export function yamlToJson(yaml: string): string {
	try {
		const result = parseYaml(yaml);
		return JSON.stringify(result, null, 2);
	} catch {
		throw new Error("Unable to parse YAML");
	}
}

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

	if (trimmed === "" || trimmed.startsWith("#")) {
		return parseYamlLines(lines, startLine + 1, baseIndent);
	}

	if (trimmed.startsWith("- ")) {
		return parseYamlArray(lines, startLine, baseIndent);
	}

	if (trimmed.includes(":")) {
		return parseYamlObject(lines, startLine, baseIndent);
	}

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

	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	const num = Number(value);
	if (!isNaN(num) && value !== "") return num;

	return value;
}
