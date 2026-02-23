/**
 * StatusBar component tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { StatusBar } from "@viewer/components/StatusBar";
import { renderWithStore, resetStore } from "../helpers";
import { useStore } from "@viewer/store";

afterEach(resetStore);

describe("StatusBar", () => {
	it("renders file size, keys count, and depth", () => {
		renderWithStore(<StatusBar />, {
			fileSize: 1024,
			totalKeys: 42,
			maxDepth: 5,
		});

		// formatSize(1024) → "1.0 KB"
		expect(screen.getByText("1.0 KB")).toBeInTheDocument();
		// keys stat
		expect(screen.getByText(/42/)).toBeInTheDocument();
		// depth stat
		expect(screen.getByText(/5/)).toBeInTheDocument();
	});

	it("shows unsaved indicator when hasUnsavedEdits is true", () => {
		renderWithStore(<StatusBar />, { hasUnsavedEdits: true });

		expect(screen.getByText("●")).toBeInTheDocument();
	});

	it("hides unsaved indicator when hasUnsavedEdits is false", () => {
		renderWithStore(<StatusBar />, { hasUnsavedEdits: false });

		expect(screen.queryByText("●")).not.toBeInTheDocument();
	});

	it("displays filename from URL", () => {
		renderWithStore(<StatusBar />, {
			url: "https://api.example.com/data/users.json",
		});

		expect(screen.getByText("users.json")).toBeInTheDocument();
	});

	it("renders theme toggle button", () => {
		localStorage.setItem("json-studio-theme", "dark");
		renderWithStore(<StatusBar />, { theme: "dark" });

		const themeButton = screen.getByTitle(/switch to light/i);
		expect(themeButton).toBeInTheDocument();
	});

	it("toggles theme on button click", () => {
		localStorage.setItem("json-studio-theme", "dark");
		renderWithStore(<StatusBar />, { theme: "dark" });

		const themeButton = screen.getByTitle(/switch to light/i);
		fireEvent.click(themeButton);

		expect(useStore.getState().theme).toBe("light");
	});

	it("renders locale selector showing current locale", () => {
		renderWithStore(<StatusBar />);

		// Default locale is EN
		expect(screen.getByText("EN")).toBeInTheDocument();
	});

	it("cycles locale on locale button click", () => {
		renderWithStore(<StatusBar />);

		const localeButton = screen.getByText("EN");
		fireEvent.click(localeButton);

		// After cycling EN → ES, the button should now show ES
		expect(screen.getByText("ES")).toBeInTheDocument();
	});

	it("shows zero values gracefully", () => {
		renderWithStore(<StatusBar />, {
			fileSize: 0,
			totalKeys: 0,
			maxDepth: 0,
		});

		expect(screen.getByText("0 B")).toBeInTheDocument();
	});
});
