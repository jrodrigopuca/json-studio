import { describe, it, expect } from "vitest";
import {
	prettyPrint,
	minify,
	formatSize,
	formatNumber,
	sortJsonByKeys,
} from "../../src/viewer/core/formatter.js";

describe("prettyPrint", () => {
	it("formats a compact JSON with default 2-space indent", () => {
		const input = '{"name":"Alice","age":30}';
		const result = prettyPrint(input);
		expect(result).toBe(JSON.stringify(JSON.parse(input), null, 2));
		expect(result).toContain("\n");
		expect(result).toContain("  ");
	});

	it("formats with custom indent", () => {
		const input = '{"a":1}';
		const result = prettyPrint(input, 4);
		expect(result).toContain("    ");
	});

	it("formats nested objects", () => {
		const input = '{"user":{"name":"Alice","address":{"city":"NYC"}}}';
		const result = prettyPrint(input);
		const lines = result.split("\n");
		expect(lines.length).toBeGreaterThan(3);
	});

	it("formats arrays", () => {
		const input = "[1,2,3]";
		const result = prettyPrint(input);
		expect(result).toBe("[\n  1,\n  2,\n  3\n]");
	});

	it("returns raw string for invalid JSON", () => {
		const input = "{invalid}";
		const result = prettyPrint(input);
		expect(result).toBe(input);
	});

	it("handles empty object", () => {
		expect(prettyPrint("{}")).toBe("{}");
	});

	it("handles empty array", () => {
		expect(prettyPrint("[]")).toBe("[]");
	});

	it("handles primitive values", () => {
		expect(prettyPrint('"hello"')).toBe('"hello"');
		expect(prettyPrint("42")).toBe("42");
		expect(prettyPrint("true")).toBe("true");
		expect(prettyPrint("null")).toBe("null");
	});

	it("is idempotent on already-pretty JSON", () => {
		const pretty = '{\n  "a": 1\n}';
		expect(prettyPrint(pretty)).toBe(pretty);
	});
});

describe("minify", () => {
	it("removes whitespace from formatted JSON", () => {
		const input = '{\n  "name": "Alice",\n  "age": 30\n}';
		const result = minify(input);
		expect(result).toBe('{"name":"Alice","age":30}');
	});

	it("is a no-op on already-minified JSON", () => {
		const input = '{"a":1}';
		expect(minify(input)).toBe(input);
	});

	it("handles arrays", () => {
		const input = "[\n  1,\n  2,\n  3\n]";
		expect(minify(input)).toBe("[1,2,3]");
	});

	it("returns raw string for invalid JSON", () => {
		const input = "{invalid}";
		expect(minify(input)).toBe(input);
	});

	it("handles nested structures", () => {
		const input = JSON.stringify({ a: { b: { c: [1, 2, 3] } } }, null, 2);
		const result = minify(input);
		expect(result).not.toContain("\n");
		expect(result).not.toContain("  ");
	});

	it("handles empty containers", () => {
		expect(minify("{}")).toBe("{}");
		expect(minify("[]")).toBe("[]");
	});
});

describe("prettyPrint + minify roundtrip", () => {
	it("minify(prettyPrint(x)) equals minify(x)", () => {
		const input = '{"users":[{"name":"Alice"},{"name":"Bob"}]}';
		expect(minify(prettyPrint(input))).toBe(minify(input));
	});

	it("prettyPrint(minify(x)) equals prettyPrint(x)", () => {
		const input = '{\n  "a": 1,\n  "b": 2\n}';
		expect(prettyPrint(minify(input))).toBe(prettyPrint(input));
	});
});

describe("formatSize", () => {
	it("formats bytes", () => {
		expect(formatSize(0)).toBe("0 B");
		expect(formatSize(100)).toBe("100 B");
		expect(formatSize(1023)).toBe("1023 B");
	});

	it("formats kilobytes", () => {
		expect(formatSize(1024)).toBe("1.0 KB");
		expect(formatSize(1536)).toBe("1.5 KB");
		expect(formatSize(10240)).toBe("10.0 KB");
	});

	it("formats megabytes", () => {
		expect(formatSize(1024 * 1024)).toBe("1.0 MB");
		expect(formatSize(5 * 1024 * 1024)).toBe("5.0 MB");
		expect(formatSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
	});

	it("formats gigabytes", () => {
		expect(formatSize(1024 * 1024 * 1024)).toBe("1.0 GB");
		expect(formatSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
	});

	it("formats boundary values correctly", () => {
		// Just under 1 KB
		expect(formatSize(1023)).toBe("1023 B");
		// Exactly 1 KB
		expect(formatSize(1024)).toBe("1.0 KB");
		// Just under 1 MB
		expect(formatSize(1024 * 1024 - 1)).toBe("1024.0 KB");
		// Exactly 1 MB
		expect(formatSize(1024 * 1024)).toBe("1.0 MB");
	});
});

describe("formatNumber", () => {
	it("formats small numbers without separators", () => {
		expect(formatNumber(0)).toBe("0");
		expect(formatNumber(999)).toBe("999");
	});

	it("formats thousands with separators", () => {
		expect(formatNumber(1000)).toBe("1,000");
		expect(formatNumber(1000000)).toBe("1,000,000");
	});

	it("formats large numbers", () => {
		expect(formatNumber(1234567)).toBe("1,234,567");
	});

	it("handles negative numbers", () => {
		const result = formatNumber(-1000);
		expect(result).toContain("1,000");
	});
});

describe("sortJsonByKeys", () => {
	it("sorts top-level object keys alphabetically", () => {
		const input = '{"zebra":1,"apple":2,"mango":3}';
		const result = sortJsonByKeys(input);
		const parsed = JSON.parse(result);
		expect(Object.keys(parsed)).toEqual(["apple", "mango", "zebra"]);
	});

	it("sorts nested object keys recursively", () => {
		const input = '{"b":{"z":1,"a":2},"a":{"y":3,"x":4}}';
		const result = sortJsonByKeys(input);
		const parsed = JSON.parse(result);
		expect(Object.keys(parsed)).toEqual(["a", "b"]);
		expect(Object.keys(parsed.a)).toEqual(["x", "y"]);
		expect(Object.keys(parsed.b)).toEqual(["a", "z"]);
	});

	it("preserves array order while sorting objects inside arrays", () => {
		const input = '[{"c":1,"a":2},{"b":3,"a":4}]';
		const result = sortJsonByKeys(input);
		const parsed = JSON.parse(result);
		expect(parsed[0]).toEqual({ a: 2, c: 1 });
		expect(Object.keys(parsed[0])).toEqual(["a", "c"]);
		expect(Object.keys(parsed[1])).toEqual(["a", "b"]);
	});

	it("handles primitive root values", () => {
		expect(sortJsonByKeys('"hello"')).toBe('"hello"');
		expect(sortJsonByKeys("42")).toBe("42");
		expect(sortJsonByKeys("true")).toBe("true");
		expect(sortJsonByKeys("null")).toBe("null");
	});

	it("handles empty objects and arrays", () => {
		expect(sortJsonByKeys("{}")).toBe("{}");
		expect(sortJsonByKeys("[]")).toBe("[]");
	});

	it("returns original string for invalid JSON", () => {
		const invalid = "{not valid json}";
		expect(sortJsonByKeys(invalid)).toBe(invalid);
	});

	it("outputs pretty-printed result with 2-space indent", () => {
		const input = '{"b":1,"a":2}';
		const result = sortJsonByKeys(input);
		expect(result).toBe('{\n  "a": 2,\n  "b": 1\n}');
	});

	it("handles deeply nested mixed structures", () => {
		const input = '{"z":{"items":[{"c":1,"a":2}],"count":5},"a":true}';
		const result = sortJsonByKeys(input);
		const parsed = JSON.parse(result);
		expect(Object.keys(parsed)).toEqual(["a", "z"]);
		expect(Object.keys(parsed.z)).toEqual(["count", "items"]);
		expect(Object.keys(parsed.z.items[0])).toEqual(["a", "c"]);
	});
});
