/**
 * Clipboard utilities for copying JSON paths and values.
 */

import type { FlatNode } from "./parser.types";

/**
 * Reconstructs the JSON value for a node (including all children).
 * Returns the value as a formatted JSON string.
 */
export function getNodeValue(nodes: FlatNode[], nodeId: number): string {
	const node = nodes.find((n) => n.id === nodeId);
	if (!node) return "";

	// Primitive values
	if (!node.isExpandable) {
		if (node.type === "string") {
			return JSON.stringify(node.value);
		}
		return String(node.value);
	}

	// Reconstruct object or array
	const value = reconstructValue(nodes, node);
	return JSON.stringify(value, null, 2);
}

/**
 * Recursively reconstructs the JavaScript value from flat nodes.
 */
function reconstructValue(nodes: FlatNode[], node: FlatNode): unknown {
	// Primitive
	if (!node.isExpandable) {
		return node.value;
	}

	// Get children
	const children = getDirectChildren(nodes, node);

	if (node.type === "array") {
		return children.map((child) => reconstructValue(nodes, child));
	}

	// Object
	const obj: Record<string, unknown> = {};
	for (const child of children) {
		if (child.key !== null) {
			obj[child.key] = reconstructValue(nodes, child);
		}
	}
	return obj;
}

/**
 * Gets the direct children of a node.
 */
function getDirectChildren(nodes: FlatNode[], parent: FlatNode): FlatNode[] {
	if (!parent.childrenRange) return [];

	const [start, end] = parent.childrenRange;
	const children: FlatNode[] = [];

	// Children are nodes within range with parentId === parent.id
	for (let i = start; i < end; i++) {
		const node = nodes[i];
		if (node && node.parentId === parent.id) {
			children.push(node);
		}
	}

	return children;
}

/**
 * Copies text to clipboard and returns success status.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fallback for older browsers or restricted contexts
		try {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			return true;
		} catch {
			return false;
		}
	}
}
