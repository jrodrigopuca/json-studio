/**
 * JSON conversion utilities for TypeScript interfaces and XML.
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
 */
export function jsonToTypeScript(json: unknown, rootName = "Root"): string {
	const interfaces = new Map<string, string>();

	if (Array.isArray(json)) {
		if (json.length === 0) {
			return `type ${rootName} = unknown[];`;
		}

		const firstItem = json[0];
		if (
			typeof firstItem === "object" &&
			firstItem !== null &&
			!Array.isArray(firstItem)
		) {
			mergeObjectTypes(
				json as Record<string, unknown>[],
				`${rootName}Item`,
				interfaces,
			);
			interfaces.set(rootName, `type ${rootName} = ${rootName}Item[];`);
		} else {
			const typeInfo = inferType(json, rootName, interfaces);
			return `type ${rootName} = ${typeInfo.type};`;
		}
	} else if (typeof json === "object" && json !== null) {
		generateInterface(json as Record<string, unknown>, rootName, interfaces);
	} else {
		const typeInfo = inferType(json, rootName, interfaces);
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
		return `${indent}<${tag}>${value}</tag>`;
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

export type ConvertFormat = "typescript" | "xml";

export const CONVERT_FORMATS: { id: ConvertFormat; label: string }[] = [
	{ id: "typescript", label: "TypeScript" },
	{ id: "xml", label: "XML" },
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
		default:
			return "";
	}
}
