/**
 * ConvertView component tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ConvertView } from "@viewer/components/ConvertView";
import { ToastProvider } from "@viewer/components/Toast";
import { renderWithStore, resetStore } from "../helpers";

afterEach(resetStore);

function renderConvertView(rawJson = '{"name":"John","age":30}') {
	return renderWithStore(
		<ToastProvider>
			<ConvertView />
		</ToastProvider>,
		{ rawJson },
	);
}

describe("ConvertView", () => {
	it("renders source JSON panel", () => {
		renderConvertView('{"a":1}');

		expect(screen.getByText('{"a":1}')).toBeInTheDocument();
	});

	it("renders format selector buttons", () => {
		renderConvertView();

		expect(screen.getByText("TypeScript")).toBeInTheDocument();
		expect(screen.getByText("XML")).toBeInTheDocument();
		expect(screen.getByText("YAML")).toBeInTheDocument();
		expect(screen.getByText("CSV")).toBeInTheDocument();
	});

	it("shows TypeScript conversion by default", () => {
		renderConvertView('{"name":"John"}');

		// TypeScript output should contain "interface" or "type"
		const codeBlocks = screen.getAllByText((_, el) => {
			return el?.tagName === "PRE" && (el.textContent?.includes("interface") || el.textContent?.includes("name") || false);
		});
		expect(codeBlocks.length).toBeGreaterThan(0);
	});

	it("switches format on button click", () => {
		renderConvertView('{"name":"John"}');

		fireEvent.click(screen.getByText("XML"));

		// XML output should contain angle brackets
		const output = screen.getAllByText((_, el) => {
			return el?.tagName === "PRE" && (el.textContent?.includes("<") || false);
		});
		expect(output.length).toBeGreaterThan(0);
	});

	it("shows error for invalid JSON", () => {
		renderConvertView("not valid json");

		// Should show an error element
		const errorEl = document.querySelector("[class*='error']");
		expect(errorEl).toBeTruthy();
	});

	it("has copy and download buttons", () => {
		renderConvertView('{"a":1}');

		expect(screen.getByTitle(/copy/i)).toBeInTheDocument();
		expect(screen.getByTitle(/download/i)).toBeInTheDocument();
	});

	it("disables copy/download when there's an error", () => {
		renderConvertView("invalid json");

		const copyBtn = screen.getByTitle(/copy/i);
		const downloadBtn = screen.getByTitle(/download/i);

		expect(copyBtn).toBeDisabled();
		expect(downloadBtn).toBeDisabled();
	});
});
