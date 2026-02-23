/**
 * Robust JSON parser that produces a flat node array optimised for virtualised rendering.
 *
 * Uses native JSON.parse for speed, then flattens the resulting tree
 * into a linear array with depth/parent references.
 *
 * @module parser
 */

import type { FlatNode, JsonNodeType, ParseError, ParseOptions, ParseResult } from './parser.types.js';

/**
 * Parsea un string JSON y devuelve un árbol aplanado para virtualización.
 *
 * @param raw - El string JSON sin procesar
 * @param options - Opciones de parseo
 * @returns Resultado del parseo con nodos aplanados o error detallado
 *
 * @example
 * ```ts
 * const result = parseJSON('{"name": "Alice"}');
 * if (result.ok) {
 *   console.log(result.nodes); // FlatNode[]
 * } else {
 *   console.error(result.error); // ParseError con línea y columna
 * }
 * ```
 */
export function parseJSON(raw: string, options?: ParseOptions): ParseResult {
  const maxDepth = options?.maxDepth ?? -1;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: extractParseError(raw, err) };
  }

  const nodes: FlatNode[] = [];
  let totalKeys = 0;
  let currentMaxDepth = 0;

  function flatten(
    value: unknown,
    key: string | null,
    depth: number,
    parentId: number,
    path: string,
  ): number {
    if (maxDepth !== -1 && depth > maxDepth) return -1;

    const id = nodes.length;
    const type = getNodeType(value);

    if (depth > currentMaxDepth) {
      currentMaxDepth = depth;
    }

    if (type === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);
      totalKeys += keys.length;

      const node: FlatNode = {
        id,
        key,
        value: null,
        type: 'object',
        depth,
        parentId,
        isExpandable: true,
        childCount: keys.length,
        childrenRange: null,
        path,
      };
      nodes.push(node);

      const childStart = nodes.length;
      for (const childKey of keys) {
        const childPath = path ? `${path}.${escapePathKey(childKey)}` : escapePathKey(childKey);
        flatten(obj[childKey], childKey, depth + 1, id, childPath);
      }
      node.childrenRange = [childStart, nodes.length];

      return id;
    }

    if (type === 'array') {
      const arr = value as unknown[];

      const node: FlatNode = {
        id,
        key,
        value: null,
        type: 'array',
        depth,
        parentId,
        isExpandable: true,
        childCount: arr.length,
        childrenRange: null,
        path,
      };
      nodes.push(node);

      const childStart = nodes.length;
      for (let i = 0; i < arr.length; i++) {
        flatten(arr[i], null, depth + 1, id, `${path}[${i}]`);
      }
      node.childrenRange = [childStart, nodes.length];

      return id;
    }

    // Primitive
    const node: FlatNode = {
      id,
      key,
      value: value as string | number | boolean | null,
      type,
      depth,
      parentId,
      isExpandable: false,
      childCount: 0,
      childrenRange: null,
      path,
    };
    nodes.push(node);

    return id;
  }

  flatten(parsed, null, 0, -1, '$');

  return { ok: true, nodes, totalKeys, maxDepth: currentMaxDepth };
}

/**
 * Determines the JSON node type of a value.
 */
function getNodeType(value: unknown): JsonNodeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'object': return 'object';
    default: return 'string';
  }
}

/**
 * Escapes a key for use in JSONPath.
 */
function escapePathKey(key: string): string {
  if (/^[a-zA-Z_$][\w$]*$/.test(key)) {
    return key;
  }
  return `["${key.replace(/"/g, '\\"')}"]`;
}

/**
 * Extracts line and column information from a JSON parse error.
 */
function extractParseError(raw: string, err: unknown): ParseError {
  const message = err instanceof Error ? err.message : String(err);

  // Try to extract position from error message
  // Chrome: "... at position 42"
  // Firefox: "... at line 3 column 5"
  const posMatch = message.match(/position\s+(\d+)/i);
  const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (lineColMatch) {
    return {
      message,
      line: parseInt(lineColMatch[1]!, 10),
      column: parseInt(lineColMatch[2]!, 10),
      position: -1,
    };
  }

  if (posMatch) {
    const position = parseInt(posMatch[1]!, 10);
    const { line, column } = positionToLineCol(raw, position);
    return { message, line, column, position };
  }

  return { message, line: 1, column: 1, position: 0 };
}

/**
 * Converts a character position to line and column numbers.
 */
function positionToLineCol(
  str: string,
  position: number,
): { line: number; column: number } {
  let line = 1;
  let column = 1;

  for (let i = 0; i < position && i < str.length; i++) {
    if (str[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}
