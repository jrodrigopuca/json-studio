import { describe, it, expect } from "vitest";
import {
	highlightJson,
	getTypeClass,
} from "../../src/viewer/core/highlighter.js";

describe("highlightJson", () => {
	describe("keys", () => {
		it("wraps object keys with key class", () => {
			const result = highlightJson('{"name": "Alice"}');
			expect(result).toContain('class="js-syn-key"');
			expect(result).toContain("&quot;name&quot;");
		});

		it("handles keys with special HTML characters", () => {
			const result = highlightJson('{"<script>": 1}');
			expect(result).toContain("&lt;script&gt;");
			expect(result).not.toContain("<script>");
		});
	});

	describe("strings", () => {
		it("wraps string values with string class", () => {
			const result = highlightJson('{"key": "value"}');
			expect(result).toContain('class="js-syn-string"');
		});

		it("handles strings with escaped characters", () => {
			const result = highlightJson('{"msg": "hello\\nworld"}');
			expect(result).toContain('class="js-syn-string"');
		});

		it("handles empty strings", () => {
			const result = highlightJson('{"key": ""}');
			expect(result).toContain('class="js-syn-string"');
		});
	});

	describe("numbers", () => {
		it("wraps integers with number class", () => {
			const result = highlightJson('{"age": 30}');
			expect(result).toContain('class="js-syn-number"');
			expect(result).toContain("30");
		});

		it("wraps negative numbers", () => {
			const result = highlightJson('{"temp": -5}');
			expect(result).toContain('class="js-syn-number"');
			expect(result).toContain("-5");
		});

		it("wraps floating point numbers", () => {
			const result = highlightJson('{"pi": 3.14}');
			expect(result).toContain('class="js-syn-number"');
			expect(result).toContain("3.14");
		});

		it("wraps scientific notation numbers", () => {
			const result = highlightJson('{"sci": 1.5e10}');
			expect(result).toContain('class="js-syn-number"');
			expect(result).toContain("1.5e10");
		});
	});

	describe("booleans", () => {
		it("wraps true with boolean class", () => {
			const result = highlightJson('{"active": true}');
			expect(result).toContain('class="js-syn-boolean"');
			expect(result).toContain("true");
		});

		it("wraps false with boolean class", () => {
			const result = highlightJson('{"deleted": false}');
			expect(result).toContain('class="js-syn-boolean"');
			expect(result).toContain("false");
		});
	});

	describe("null", () => {
		it("wraps null with null class", () => {
			const result = highlightJson('{"value": null}');
			expect(result).toContain('class="js-syn-null"');
			expect(result).toContain("null");
		});
	});

	describe("structural characters", () => {
		it("wraps brackets with bracket class", () => {
			const result = highlightJson("{}");
			expect(result).toContain('class="js-syn-bracket"');
		});

		it("wraps array brackets", () => {
			const result = highlightJson("[]");
			expect(result).toContain('class="js-syn-bracket"');
		});

		it("wraps commas with comma class", () => {
			const result = highlightJson("[1, 2]");
			expect(result).toContain('class="js-syn-comma"');
		});
	});

	describe("URL detection", () => {
		it("wraps URLs in anchor tags", () => {
			const result = highlightJson('{"url": "https://example.com"}');
			expect(result).toContain("<a");
			expect(result).toContain('class="js-url"');
			expect(result).toContain('href="https://example.com"');
			expect(result).toContain('target="_blank"');
			expect(result).toContain('rel="noopener noreferrer"');
		});

		it("handles http URLs", () => {
			const result = highlightJson('{"url": "http://example.com/path"}');
			expect(result).toContain('href="http://example.com/path"');
		});

		it("does not create links for non-URL strings", () => {
			const result = highlightJson('{"name": "Alice"}');
			expect(result).not.toContain("<a");
		});
	});

	describe("complex JSON", () => {
		it("highlights formatted multi-line JSON", () => {
			const json = JSON.stringify(
				{ name: "Alice", age: 30, active: true, email: null },
				null,
				2,
			);
			const result = highlightJson(json);

			expect(result).toContain('class="js-syn-key"');
			expect(result).toContain('class="js-syn-string"');
			expect(result).toContain('class="js-syn-number"');
			expect(result).toContain('class="js-syn-boolean"');
			expect(result).toContain('class="js-syn-null"');
		});

		it("handles arrays of objects", () => {
			const json = JSON.stringify([{ a: 1 }, { b: 2 }], null, 2);
			const result = highlightJson(json);

			expect(result).toContain('class="js-syn-bracket"');
			expect(result).toContain('class="js-syn-key"');
			expect(result).toContain('class="js-syn-number"');
		});
	});

	describe("XSS prevention", () => {
		it("escapes HTML in keys", () => {
			const result = highlightJson('{"<img onerror=alert(1)>": 1}');
			expect(result).not.toContain("<img");
			expect(result).toContain("&lt;img");
		});

		it("escapes HTML in string values", () => {
			const result = highlightJson('{"key": "<script>alert(1)</script>"}');
			expect(result).not.toContain("<script>alert");
		});

		it("escapes ampersands", () => {
			const result = highlightJson('{"key": "a&b"}');
			expect(result).toContain("a&amp;b");
		});
	});
});

describe("getTypeClass", () => {
	it("returns correct class for string", () => {
		expect(getTypeClass("string")).toBe("js-syn-string");
	});

	it("returns correct class for number", () => {
		expect(getTypeClass("number")).toBe("js-syn-number");
	});

	it("returns correct class for boolean", () => {
		expect(getTypeClass("boolean")).toBe("js-syn-boolean");
	});

	it("returns correct class for null", () => {
		expect(getTypeClass("null")).toBe("js-syn-null");
	});

	it("returns empty string for unknown types", () => {
		expect(getTypeClass("object")).toBe("");
		expect(getTypeClass("array")).toBe("");
		expect(getTypeClass("unknown")).toBe("");
	});
});
