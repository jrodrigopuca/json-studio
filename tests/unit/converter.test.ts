import { describe, it, expect } from "vitest";
import {
	jsonToYaml,
	jsonToCsv,
	jsonToTypeScript,
	yamlToJson,
} from "../../src/viewer/core/converter.js";

describe("jsonToYaml", () => {
	it("converts simple object to YAML", () => {
		const json = '{"name": "Alice", "age": 30}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("name: Alice");
		expect(yaml).toContain("age: 30");
	});

	it("handles nested objects", () => {
		const json = '{"user": {"name": "Bob", "active": true}}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("user:");
		expect(yaml).toContain("name: Bob");
		expect(yaml).toContain("active: true");
	});

	it("handles arrays", () => {
		const json = '{"items": [1, 2, 3]}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("items:");
		expect(yaml).toContain("- 1");
		expect(yaml).toContain("- 2");
		expect(yaml).toContain("- 3");
	});

	it("handles null values", () => {
		const json = '{"value": null}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("value: null");
	});

	it("handles boolean values", () => {
		const json = '{"active": true, "deleted": false}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("active: true");
		expect(yaml).toContain("deleted: false");
	});

	it("handles empty objects", () => {
		const json = '{"empty": {}}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("empty: {}");
	});

	it("handles empty arrays", () => {
		const json = '{"items": []}';
		const yaml = jsonToYaml(json);
		expect(yaml).toContain("items: []");
	});

	it("quotes strings that could be ambiguous", () => {
		const json = '{"val": "true"}';
		const yaml = jsonToYaml(json);
		// "true" as a string should be quoted to distinguish from boolean
		expect(yaml).toContain('"true"');
	});

	it("returns error comment for invalid JSON", () => {
		const yaml = jsonToYaml("{invalid}");
		expect(yaml).toContain("# Invalid JSON");
	});
});

describe("jsonToCsv", () => {
	it("converts array of objects to CSV", () => {
		const json = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]';
		const csv = jsonToCsv(json);
		const lines = csv.split("\n");
		expect(lines[0]).toBe("name,age");
		expect(lines[1]).toBe("Alice,30");
		expect(lines[2]).toBe("Bob,25");
	});

	it("handles missing values", () => {
		const json =
			'[{"name": "Alice", "age": 30}, {"name": "Bob", "email": "bob@test.com"}]';
		const csv = jsonToCsv(json);
		const lines = csv.split("\n");
		expect(lines[0]).toContain("name");
		expect(lines[0]).toContain("age");
		expect(lines[0]).toContain("email");
	});

	it("escapes values with commas", () => {
		const json = '[{"note": "hello, world"}]';
		const csv = jsonToCsv(json);
		expect(csv).toContain('"hello, world"');
	});

	it("escapes values with quotes", () => {
		const json = '[{"note": "say \\"hi\\""}]';
		const csv = jsonToCsv(json);
		expect(csv).toContain('""hi""');
	});

	it("handles single object (wraps in array)", () => {
		const json = '{"name": "Alice", "age": 30}';
		const csv = jsonToCsv(json);
		expect(csv).toContain("name,age");
		expect(csv).toContain("Alice,30");
	});

	it("handles nested objects as JSON strings", () => {
		const json = '[{"name": "Alice", "address": {"city": "NYC"}}]';
		const csv = jsonToCsv(json);
		expect(csv).toContain("Alice");
		// Address should be serialized as JSON string
		expect(csv).toContain("city");
	});

	it("handles empty array", () => {
		expect(jsonToCsv("[]")).toBe("");
	});

	it("returns error comment for invalid JSON", () => {
		const csv = jsonToCsv("{invalid}");
		expect(csv).toContain("# Invalid JSON");
	});
});

describe("jsonToTypeScript", () => {
	it("generates interface for simple object", () => {
		const json = '{"name": "Alice", "age": 30, "active": true}';
		const ts = jsonToTypeScript(json);
		expect(ts).toContain("export interface RootObject");
		expect(ts).toContain("name: string;");
		expect(ts).toContain("age: number;");
		expect(ts).toContain("active: boolean;");
	});

	it("generates interfaces for nested objects", () => {
		const json = '{"user": {"name": "Alice"}}';
		const ts = jsonToTypeScript(json);
		expect(ts).toContain("export interface RootObject");
		expect(ts).toContain("user: RootObjectUser;");
		expect(ts).toContain("export interface RootObjectUser");
		expect(ts).toContain("name: string;");
	});

	it("handles arrays", () => {
		const json = '{"tags": ["a", "b"]}';
		const ts = jsonToTypeScript(json);
		expect(ts).toContain("tags: string[];");
	});

	it("handles arrays of objects", () => {
		const json = '{"users": [{"name": "Alice"}]}';
		const ts = jsonToTypeScript(json);
		expect(ts).toContain("users: RootObjectUsersItem[];");
	});

	it("handles null values", () => {
		const json = '{"value": null}';
		const ts = jsonToTypeScript(json);
		expect(ts).toContain("value: null;");
	});

	it("handles empty arrays", () => {
		const json = '{"items": []}';
		const ts = jsonToTypeScript(json);
		expect(ts).toContain("items: unknown[];");
	});

	it("handles custom root name", () => {
		const json = '{"id": 1}';
		const ts = jsonToTypeScript(json, "User");
		expect(ts).toContain("export interface User");
	});

	it("returns error comment for invalid JSON", () => {
		const ts = jsonToTypeScript("{invalid}");
		expect(ts).toContain("// Invalid JSON");
	});
});

describe("yamlToJson", () => {
	it("converts simple key-value YAML to JSON", () => {
		const yaml = "name: Alice\nage: 30";
		const json = yamlToJson(yaml);
		const parsed = JSON.parse(json);
		expect(parsed.name).toBe("Alice");
		expect(parsed.age).toBe(30);
	});

	it("handles boolean values", () => {
		const yaml = "active: true\ndeleted: false";
		const json = yamlToJson(yaml);
		const parsed = JSON.parse(json);
		expect(parsed.active).toBe(true);
		expect(parsed.deleted).toBe(false);
	});

	it("handles null values", () => {
		const yaml = "value: null";
		const json = yamlToJson(yaml);
		const parsed = JSON.parse(json);
		expect(parsed.value).toBeNull();
	});

	it("handles quoted strings", () => {
		const yaml = 'name: "Alice"';
		const json = yamlToJson(yaml);
		const parsed = JSON.parse(json);
		expect(parsed.name).toBe("Alice");
	});

	it("handles arrays", () => {
		const yaml = "- 1\n- 2\n- 3";
		const json = yamlToJson(yaml);
		const parsed = JSON.parse(json);
		expect(parsed).toEqual([1, 2, 3]);
	});
});
