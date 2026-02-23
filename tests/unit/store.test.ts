import { describe, it, expect, vi } from "vitest";
import { createStore } from "../../src/viewer/core/store.js";
import type { AppState } from "../../src/viewer/core/store.types.js";

/** Factory for a minimal valid AppState for testing. */
function makeState(overrides?: Partial<AppState>): AppState {
	return {
		rawJson: "",
		nodes: [],
		parseError: null,
		isValid: false,
		viewMode: "tree",
		theme: "dark",
		contentType: "application/json",
		url: "",
		expandedNodes: new Set(),
		selectedNodeId: null,
		searchQuery: "",
		searchMatches: [],
		searchCurrentIndex: 0,
		searchLineMatches: [],
		fileSize: 0,
		totalKeys: 0,
		maxDepth: 0,
		isParsing: false,
		sortedByKeys: false,
		showLineNumbers: true,
		isEditing: false,
		undoStack: [],
		redoStack: [],
		bookmarks: [],
		diffJson: null,
		hasUnsavedEdits: false,
		...overrides,
	};
}

describe("createStore", () => {
	describe("getState", () => {
		it("returns the initial state", () => {
			const initial = makeState({ viewMode: "raw", theme: "light" });
			const store = createStore(initial);
			const state = store.getState();

			expect(state.viewMode).toBe("raw");
			expect(state.theme).toBe("light");
		});

		it("returns a new object on each call after setState", () => {
			const store = createStore(makeState());
			const s1 = store.getState();
			store.setState({ viewMode: "raw" });
			const s2 = store.getState();

			expect(s1).not.toBe(s2);
		});
	});

	describe("setState", () => {
		it("updates the state with partial values", () => {
			const store = createStore(makeState());
			store.setState({ viewMode: "raw", theme: "light" });

			expect(store.getState().viewMode).toBe("raw");
			expect(store.getState().theme).toBe("light");
		});

		it("preserves unchanged values", () => {
			const store = createStore(
				makeState({ rawJson: "original", viewMode: "tree" }),
			);
			store.setState({ viewMode: "raw" });

			expect(store.getState().rawJson).toBe("original");
		});

		it("does not notify if values are the same", () => {
			const store = createStore(makeState({ viewMode: "tree" }));
			const listener = vi.fn();
			store.subscribe(["viewMode"], listener);

			store.setState({ viewMode: "tree" }); // same value

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("subscribe", () => {
		it("calls listener when a watched key changes", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(["viewMode"], listener);

			store.setState({ viewMode: "raw" });

			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({ viewMode: "raw" }),
				["viewMode"],
			);
		});

		it("does not call listener when unwatched keys change", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(["viewMode"], listener);

			store.setState({ theme: "light" });

			expect(listener).not.toHaveBeenCalled();
		});

		it("calls listener for any change when keys is null", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(null, listener);

			store.setState({ theme: "light" });
			expect(listener).toHaveBeenCalledTimes(1);

			store.setState({ viewMode: "raw" });
			expect(listener).toHaveBeenCalledTimes(2);
		});

		it("supports multiple subscriptions", () => {
			const store = createStore(makeState());
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			store.subscribe(["viewMode"], listener1);
			store.subscribe(["theme"], listener2);

			store.setState({ viewMode: "raw" });
			expect(listener1).toHaveBeenCalledTimes(1);
			expect(listener2).not.toHaveBeenCalled();

			store.setState({ theme: "light" });
			expect(listener1).toHaveBeenCalledTimes(1);
			expect(listener2).toHaveBeenCalledTimes(1);
		});

		it("notifies when any of the watched keys changes", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(["viewMode", "theme"], listener);

			store.setState({ viewMode: "raw" });
			expect(listener).toHaveBeenCalledTimes(1);

			store.setState({ theme: "light" });
			expect(listener).toHaveBeenCalledTimes(2);
		});

		it("provides the changed keys to listener", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(null, listener);

			store.setState({ viewMode: "raw", theme: "light" });

			expect(listener).toHaveBeenCalledWith(
				expect.anything(),
				expect.arrayContaining(["viewMode", "theme"]),
			);
		});
	});

	describe("unsubscribe", () => {
		it("returns an unsubscribe function", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			const unsub = store.subscribe(["viewMode"], listener);

			store.setState({ viewMode: "raw" });
			expect(listener).toHaveBeenCalledTimes(1);

			unsub();

			store.setState({ viewMode: "tree" });
			expect(listener).toHaveBeenCalledTimes(1); // not called again
		});

		it("does not affect other subscriptions", () => {
			const store = createStore(makeState());
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			const unsub1 = store.subscribe(["viewMode"], listener1);
			store.subscribe(["viewMode"], listener2);

			unsub1();

			store.setState({ viewMode: "raw" });
			expect(listener1).not.toHaveBeenCalled();
			expect(listener2).toHaveBeenCalledTimes(1);
		});
	});

	describe("dispose", () => {
		it("removes all subscriptions", () => {
			const store = createStore(makeState());
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			store.subscribe(["viewMode"], listener1);
			store.subscribe(null, listener2);

			store.dispose();

			store.setState({ viewMode: "raw" });
			expect(listener1).not.toHaveBeenCalled();
			expect(listener2).not.toHaveBeenCalled();
		});

		it("allows continued setState after dispose", () => {
			const store = createStore(makeState());
			store.dispose();

			// Should not throw
			store.setState({ viewMode: "raw" });
			expect(store.getState().viewMode).toBe("raw");
		});
	});

	describe("edge cases", () => {
		it("handles rapid sequential updates", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(["viewMode"], listener);

			store.setState({ viewMode: "raw" });
			store.setState({ viewMode: "tree" });
			store.setState({ viewMode: "raw" });

			expect(listener).toHaveBeenCalledTimes(3);
			expect(store.getState().viewMode).toBe("raw");
		});

		it("handles Set values correctly (reference equality)", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(["expandedNodes"], listener);

			const newSet = new Set([1, 2, 3]);
			store.setState({ expandedNodes: newSet });

			// Since it's a new reference, it should fire
			expect(listener).toHaveBeenCalledTimes(1);
			expect(store.getState().expandedNodes).toBe(newSet);
		});

		it("handles empty setState gracefully", () => {
			const store = createStore(makeState());
			const listener = vi.fn();
			store.subscribe(null, listener);

			store.setState({});

			expect(listener).not.toHaveBeenCalled();
		});
	});
});
