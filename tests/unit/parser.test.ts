import { describe, it, expect } from "vitest";
import { parseJSON } from "../../src/viewer/core/parser.js";

describe("parseJSON", () => {
	describe("successful parsing", () => {
		it("parses a simple object", () => {
			const result = parseJSON('{"name": "Alice", "age": 30}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.totalKeys).toBe(2);
			expect(result.maxDepth).toBe(1);
			expect(result.nodes.length).toBe(3); // root + 2 primitives
		});

		it("parses a simple array", () => {
			const result = parseJSON("[1, 2, 3]");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes.length).toBe(4); // root array + 3 items
			expect(result.nodes[0]!.type).toBe("array");
			expect(result.nodes[0]!.childCount).toBe(3);
		});

		it("parses nested objects", () => {
			const result = parseJSON(
				'{"user": {"name": "Alice", "address": {"city": "NYC"}}}',
			);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.maxDepth).toBe(3);
			expect(result.totalKeys).toBe(4); // user, name, address, city
		});

		it("parses an empty object", () => {
			const result = parseJSON("{}");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes.length).toBe(1);
			expect(result.nodes[0]!.type).toBe("object");
			expect(result.nodes[0]!.childCount).toBe(0);
		});

		it("parses an empty array", () => {
			const result = parseJSON("[]");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes.length).toBe(1);
			expect(result.nodes[0]!.type).toBe("array");
			expect(result.nodes[0]!.childCount).toBe(0);
		});

		it("parses primitive values at root", () => {
			const strResult = parseJSON('"hello"');
			expect(strResult.ok).toBe(true);
			if (strResult.ok) {
				expect(strResult.nodes[0]!.type).toBe("string");
				expect(strResult.nodes[0]!.value).toBe("hello");
			}

			const numResult = parseJSON("42");
			expect(numResult.ok).toBe(true);
			if (numResult.ok) {
				expect(numResult.nodes[0]!.type).toBe("number");
				expect(numResult.nodes[0]!.value).toBe(42);
			}

			const boolResult = parseJSON("true");
			expect(boolResult.ok).toBe(true);
			if (boolResult.ok) {
				expect(boolResult.nodes[0]!.type).toBe("boolean");
				expect(boolResult.nodes[0]!.value).toBe(true);
			}

			const nullResult = parseJSON("null");
			expect(nullResult.ok).toBe(true);
			if (nullResult.ok) {
				expect(nullResult.nodes[0]!.type).toBe("null");
				expect(nullResult.nodes[0]!.value).toBe(null);
			}
		});
	});

	describe("FlatNode structure", () => {
		it("assigns sequential IDs", () => {
			const result = parseJSON('{"a": 1, "b": 2}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.id).toBe(0);
			expect(result.nodes[1]!.id).toBe(1);
			expect(result.nodes[2]!.id).toBe(2);
		});

		it("sets correct depth levels", () => {
			const result = parseJSON('{"a": {"b": {"c": 1}}}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.depth).toBe(0); // root
			expect(result.nodes[1]!.depth).toBe(1); // a: {}
			expect(result.nodes[2]!.depth).toBe(2); // b: {}
			expect(result.nodes[3]!.depth).toBe(3); // c: 1
		});

		it("sets correct parentId", () => {
			const result = parseJSON('{"a": 1, "b": 2}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.parentId).toBe(-1); // root has no parent
			expect(result.nodes[1]!.parentId).toBe(0); // child of root
			expect(result.nodes[2]!.parentId).toBe(0); // child of root
		});

		it("sets correct childrenRange for objects", () => {
			const result = parseJSON('{"a": 1, "b": 2}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.childrenRange).toEqual([1, 3]);
		});

		it("sets correct childrenRange for arrays", () => {
			const result = parseJSON("[10, 20, 30]");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.childrenRange).toEqual([1, 4]);
		});

		it("marks objects and arrays as expandable", () => {
			const result = parseJSON('{"arr": [1], "str": "hello"}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			// root object
			expect(result.nodes[0]!.isExpandable).toBe(true);
			// arr (array)
			expect(result.nodes[1]!.isExpandable).toBe(true);
			// array element 1
			expect(result.nodes[2]!.isExpandable).toBe(false);
			// str "hello"
			expect(result.nodes[3]!.isExpandable).toBe(false);
		});

		it("sets keys correctly for object properties", () => {
			const result = parseJSON('{"name": "Alice", "age": 30}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.key).toBeNull(); // root
			expect(result.nodes[1]!.key).toBe("name");
			expect(result.nodes[2]!.key).toBe("age");
		});

		it("sets null key for array elements", () => {
			const result = parseJSON("[1, 2, 3]");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[1]!.key).toBeNull();
			expect(result.nodes[2]!.key).toBeNull();
			expect(result.nodes[3]!.key).toBeNull();
		});
	});

	describe("JSONPath generation", () => {
		it("sets root path to $", () => {
			const result = parseJSON("{}");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[0]!.path).toBe("$");
		});

		it("generates dot notation for simple keys", () => {
			const result = parseJSON('{"user": {"name": "Alice"}}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[1]!.path).toBe("$.user");
			expect(result.nodes[2]!.path).toBe("$.user.name");
		});

		it("generates bracket notation for array indices", () => {
			const result = parseJSON('{"items": [1, 2]}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[2]!.path).toBe("$.items[0]");
			expect(result.nodes[3]!.path).toBe("$.items[1]");
		});

		it("escapes keys with special characters", () => {
			const result = parseJSON('{"my key": 1, "with.dot": 2}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			// Parser prefixes with $. then uses bracket notation for special keys
			expect(result.nodes[1]!.path).toBe('$.["my key"]');
			expect(result.nodes[2]!.path).toBe('$.["with.dot"]');
		});
	});

	describe("maxDepth option", () => {
		it("limits parsing depth", () => {
			const result = parseJSON('{"a": {"b": {"c": 1}}}', { maxDepth: 1 });
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			// Should have root + "a" object only (depth 0 and 1)
			// Children deeper than maxDepth=1 are skipped
			const maxNodeDepth = Math.max(...result.nodes.map((n) => n.depth));
			expect(maxNodeDepth).toBeLessThanOrEqual(1);
		});

		it("returns all nodes when maxDepth is -1 (default)", () => {
			const result = parseJSON('{"a": {"b": {"c": 1}}}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes.length).toBe(4);
		});
	});

	describe("error handling", () => {
		it("returns error for invalid JSON", () => {
			const result = parseJSON("{invalid}");
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.message).toBeTruthy();
		});

		it("returns error with position info", () => {
			const result = parseJSON('{"a": }');
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.message).toBeTruthy();
			expect(result.error.line).toBeGreaterThanOrEqual(1);
			expect(result.error.column).toBeGreaterThanOrEqual(1);
		});

		it("returns error for trailing comma", () => {
			const result = parseJSON('{"a": 1,}');
			expect(result.ok).toBe(false);
		});

		it("returns error for empty input", () => {
			const result = parseJSON("");
			expect(result.ok).toBe(false);
		});

		it("returns error for single quotes", () => {
			const result = parseJSON("{'a': 1}");
			expect(result.ok).toBe(false);
		});
	});

	describe("complex structures", () => {
		it("handles deeply nested arrays", () => {
			const result = parseJSON("[[[1, 2], [3]], [[4]]]");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			// 10 nodes: root[] + [[1,2],[3]] + [[4]] + [1,2] + [3] + [4] + 1 + 2 + 3 + 4
			expect(result.nodes.length).toBe(10);
			expect(result.maxDepth).toBe(3);
		});

		it("handles mixed objects and arrays", () => {
			const json = JSON.stringify({
				users: [
					{ name: "Alice", tags: ["admin", "user"] },
					{ name: "Bob", tags: ["user"] },
				],
			});
			const result = parseJSON(json);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.totalKeys).toBe(5); // users(1) + name,tags(2) + name,tags(2) = 5 total keys across all objects
		});

		it("handles null values in objects", () => {
			const result = parseJSON('{"a": null, "b": null}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[1]!.type).toBe("null");
			expect(result.nodes[1]!.value).toBeNull();
			expect(result.nodes[2]!.type).toBe("null");
		});

		it("handles boolean values", () => {
			const result = parseJSON('{"active": true, "deleted": false}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[1]!.type).toBe("boolean");
			expect(result.nodes[1]!.value).toBe(true);
			expect(result.nodes[2]!.value).toBe(false);
		});

		it("handles unicode strings", () => {
			const result = parseJSON('{"emoji": "🎉", "japanese": "日本語"}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[1]!.value).toBe("🎉");
			expect(result.nodes[2]!.value).toBe("日本語");
		});

		it("handles large numbers", () => {
			const result = parseJSON('{"big": 9007199254740991}');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.nodes[1]!.type).toBe("number");
			expect(result.nodes[1]!.value).toBe(9007199254740991);
		});
	});
});
