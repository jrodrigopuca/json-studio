/**
 * Vitest setup — configure testing-library/jest-dom matchers
 * and provide browser API mocks for component tests.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatic cleanup after each test
afterEach(() => {
	cleanup();
});

// ─── Browser API stubs ──────────────────────────────────────────────────────

// Minimal localStorage mock (jsdom provides one but just in case)
if (typeof globalThis.localStorage === "undefined") {
	const store: Record<string, string> = {};
	Object.defineProperty(globalThis, "localStorage", {
		value: {
			getItem: (k: string) => store[k] ?? null,
			setItem: (k: string, v: string) => {
				store[k] = v;
			},
			removeItem: (k: string) => {
				delete store[k];
			},
			clear: () => Object.keys(store).forEach((k) => delete store[k]),
		},
	});
}

// crypto.randomUUID (used by bookmarks)
if (!globalThis.crypto?.randomUUID) {
	Object.defineProperty(globalThis, "crypto", {
		value: {
			...globalThis.crypto,
			randomUUID: () =>
				"10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
					(
						Number(c) ^
						(Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))
					).toString(16),
				),
		},
	});
}

// matchMedia stub
if (typeof window !== "undefined" && !window.matchMedia) {
	Object.defineProperty(window, "matchMedia", {
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}),
	});
}
