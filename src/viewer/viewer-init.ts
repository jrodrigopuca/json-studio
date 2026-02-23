/**
 * JSON Spark — Main viewer application.
 *
 * Entry point that orchestrates all components, manages state,
 * and handles JSON parsing (main thread or Web Worker).
 *
 * @module app
 */

import { createStore, type Store } from "./core/store.js";
import { parseJSON } from "./core/parser.js";
import { sortJsonByKeys, prettyPrint } from "./core/formatter.js";
import type { AppState } from "./core/store.types.js";
import type {
	ResolvedTheme,
	ContentTypeClass,
	ViewMode,
} from "../shared/types.js";
import { WORKER_THRESHOLD } from "../shared/constants.js";

// Components
import { Toolbar } from "./components-old/toolbar/index.js";
import { TreeView } from "./components-old/tree-view/index.js";
import { RawView } from "./components-old/raw-view/index.js";
import { TableView } from "./components-old/table-view/index.js";
import { DiffView } from "./components-old/diff-view/index.js";
import { EditView } from "./components-old/edit-view/index.js";
import { Breadcrumb } from "./components-old/breadcrumb/index.js";
import { SearchBar } from "./components-old/search-bar/index.js";
import { StatusBar } from "./components-old/status-bar/index.js";
import { Banner } from "./components-old/banner/index.js";

// Styles
import "./styles/base.css";
import "./styles/themes.css";
import "./styles/responsive.css";
import "./components-old/toolbar/toolbar.css";
import "./components-old/tree-view/tree-view.css";
import "./components-old/raw-view/raw-view.css";
import "./components-old/table-view/table-view.css";
import "./components-old/diff-view/diff-view.css";
import "./components-old/edit-view/edit-view.css";
import "./components-old/breadcrumb/breadcrumb.css";
import "./components-old/search-bar/search-bar.css";
import "./components-old/status-bar/status-bar.css";
import "./components-old/banner/banner.css";

/** Options for initialising the viewer. */
export interface ViewerOptions {
	/** Container element to render into. */
	container: HTMLElement;
	/** The raw JSON string. */
	rawJson: string;
	/** The detected content-type classification. */
	contentType?: ContentTypeClass;
	/** The source URL. */
	url?: string;
}

/**
 * Initialises and mounts the JSON Spark viewer.
 *
 * @param options - Viewer configuration
 * @returns Cleanup function to unmount
 */
export function initViewer(options: ViewerOptions): () => void {
	const {
		container,
		rawJson: inputJson,
		contentType = "application/json",
		url = "",
	} = options;

	// Detect system theme
	const resolvedTheme = detectSystemTheme();

	// Pretty-print the input JSON so raw view starts formatted
	const rawJson = prettyPrint(inputJson);

	// Create initial state
	const initialState: AppState = {
		rawJson,
		nodes: [],
		parseError: null,
		isValid: false,
		viewMode: "tree",
		theme: resolvedTheme,
		contentType,
		url,
		expandedNodes: new Set<number>(),
		selectedNodeId: null,
		searchQuery: "",
		searchMatches: [],
		searchCurrentIndex: 0,
		searchLineMatches: [],
		fileSize: new Blob([rawJson]).size,
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
	};

	const store = createStore(initialState);

	// Set theme on document
	document.documentElement.setAttribute("data-theme", resolvedTheme);
	store.subscribe(["theme"], (state) => {
		document.documentElement.setAttribute("data-theme", state.theme);
	});

	// Build DOM structure
	container.classList.add("js-app");
	container.innerHTML = "";

	// Create layout containers
	const mainContainer = document.createElement("div");
	mainContainer.className = "js-main-container";
	mainContainer.style.display = "flex";
	mainContainer.style.flexDirection = "column";
	mainContainer.style.height = "100vh";

	// Instantiate components
	const banner = new Banner(store);
	const toolbar = new Toolbar(store);
	const breadcrumb = new Breadcrumb(store);
	const searchBar = new SearchBar(store);
	const treeView = new TreeView(store);
	const rawView = new RawView(store);
	const tableView = new TableView(store);
	const diffView = new DiffView(store);
	const editView = new EditView(store);
	const statusBar = new StatusBar(store);

	// Render components in order
	toolbar.render(mainContainer);
	breadcrumb.render(mainContainer);
	banner.render(mainContainer);
	searchBar.render(mainContainer);

	// View container (tree or raw)
	const viewContainer = document.createElement("div");
	viewContainer.style.flex = "1";
	viewContainer.style.overflow = "hidden";
	viewContainer.style.display = "flex";
	viewContainer.style.flexDirection = "column";
	mainContainer.appendChild(viewContainer);

	treeView.render(viewContainer);
	rawView.render(viewContainer);
	tableView.render(viewContainer);
	diffView.render(viewContainer);
	editView.render(viewContainer);

	statusBar.render(mainContainer);
	container.appendChild(mainContainer);

	// View mode switching
	const updateViewVisibility = (state: AppState): void => {
		const treeEl = viewContainer.querySelector(".js-tree-view") as HTMLElement;
		const rawEl = viewContainer.querySelector(".js-raw-view") as HTMLElement;
		const tableEl = viewContainer.querySelector(
			".js-table-view",
		) as HTMLElement;
		const diffEl = viewContainer.querySelector(".js-diff-view") as HTMLElement;
		const editEl = viewContainer.querySelector(".js-edit-view") as HTMLElement;
		const breadcrumbEl = mainContainer.querySelector(
			".js-breadcrumb",
		) as HTMLElement;
		const searchBarEl = mainContainer.querySelector(
			".js-search-bar",
		) as HTMLElement;

		if (treeEl)
			treeEl.style.display = state.viewMode === "tree" ? "block" : "none";
		if (rawEl)
			rawEl.style.display = state.viewMode === "raw" ? "block" : "none";
		if (tableEl)
			tableEl.style.display = state.viewMode === "table" ? "block" : "none";
		if (diffEl)
			diffEl.style.display = state.viewMode === "diff" ? "flex" : "none";
		if (editEl)
			editEl.style.display = state.viewMode === "edit" ? "flex" : "none";

		// Breadcrumb only visible in Tree view (where node selection makes sense)
		if (breadcrumbEl)
			breadcrumbEl.style.display = state.viewMode === "tree" ? "flex" : "none";

		// SearchBar visible in Tree, Raw, and Edit views
		const searchViews = ["tree", "raw", "edit"];
		if (searchBarEl)
			searchBarEl.style.display = searchViews.includes(state.viewMode)
				? "flex"
				: "none";
	};

	store.subscribe(["viewMode"], (state) => updateViewVisibility(state));

	// Parse JSON
	parseAndSetState(rawJson, store);

	// Sort by keys: re-parse when toggled
	store.subscribe(["sortedByKeys"], (state) => {
		if (state.sortedByKeys) {
			const sorted = sortJsonByKeys(state.rawJson);
			parseAndSetState(sorted, store);
		} else {
			parseAndSetState(rawJson, store);
		}
	});

	// Re-parse when rawJson changes (e.g., from EditView save)
	let lastRawJson = rawJson;
	store.subscribe(["rawJson"], (state) => {
		if (state.rawJson !== lastRawJson) {
			lastRawJson = state.rawJson;
			parseAndSetState(state.rawJson, store);
		}
	});

	// Initial view visibility
	updateViewVisibility(store.getState());

	// Listen for system theme changes
	const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	const onThemeChange = (e: MediaQueryListEvent): void => {
		const currentTheme = store.getState().theme;
		// Only auto-switch if user hasn't manually overridden
		if (currentTheme === detectSystemTheme()) {
			store.setState({ theme: e.matches ? "dark" : "light" });
		}
	};
	themeMediaQuery.addEventListener("change", onThemeChange);

	// Helper to change view with unsaved edits confirmation
	const changeViewMode = (newMode: ViewMode): void => {
		const { viewMode, hasUnsavedEdits } = store.getState();
		if (viewMode === "edit" && hasUnsavedEdits && newMode !== "edit") {
			const response = confirm(
				"You have unsaved changes. Do you want to save before leaving?\n\n" +
					"Click OK to save and switch, or Cancel to discard changes.",
			);
			if (response) {
				// Dispatch save action to EditView
				document.dispatchEvent(
					new CustomEvent("json-spark:edit-action", {
						detail: { action: "save" },
					}),
				);
			}
			store.setState({ hasUnsavedEdits: false });
		}
		store.setState({ viewMode: newMode });
	};

	// Expose changeViewMode globally for toolbar to use
	(
		window as unknown as { __jsonSparkChangeViewMode: typeof changeViewMode }
	).__jsonSparkChangeViewMode = changeViewMode;

	// Global keyboard shortcuts
	const onGlobalKeyDown = (e: KeyboardEvent): void => {
		// Cmd/Ctrl + Number keys to switch views
		if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
			if (e.key === "1") {
				e.preventDefault();
				changeViewMode("tree");
			}
			if (e.key === "2") {
				e.preventDefault();
				changeViewMode("raw");
			}
			if (e.key === "3") {
				e.preventDefault();
				changeViewMode("table");
			}
			if (e.key === "4") {
				e.preventDefault();
				changeViewMode("diff");
			}
			if (e.key === "5") {
				e.preventDefault();
				changeViewMode("edit");
			}
		}

		// Ctrl+Shift+F: Expand all
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
			e.preventDefault();
			const nodes = store.getState().nodes;
			const allExpandable = new Set(
				nodes.filter((n) => n.isExpandable).map((n) => n.id),
			);
			store.setState({ expandedNodes: allExpandable });
		}

		// Ctrl+Shift+C: Collapse all
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
			e.preventDefault();
			store.setState({ expandedNodes: new Set<number>() });
		}
	};
	document.addEventListener("keydown", onGlobalKeyDown);

	// Listen for file imports from toolbar
	const onImport = ((e: CustomEvent<{ rawJson: string; filename: string }>) => {
		const imported = prettyPrint(e.detail.rawJson);
		store.setState({
			rawJson: imported,
			sortedByKeys: false,
			isEditing: false,
			undoStack: [],
			redoStack: [],
			bookmarks: [],
			diffJson: null,
			fileSize: new Blob([imported]).size,
			url: `file://${e.detail.filename}`,
		});
		parseAndSetState(imported, store);
	}) as EventListener;
	document.addEventListener("json-spark:import", onImport);

	// Return cleanup function
	return () => {
		toolbar.dispose();
		breadcrumb.dispose();
		banner.dispose();
		searchBar.dispose();
		treeView.dispose();
		rawView.dispose();
		tableView.dispose();
		diffView.dispose();
		editView.dispose();
		statusBar.dispose();
		store.dispose();
		themeMediaQuery.removeEventListener("change", onThemeChange);
		document.removeEventListener("keydown", onGlobalKeyDown);
		document.removeEventListener("json-spark:import", onImport);
		container.innerHTML = "";
	};
}

/**
 * Parses JSON (main thread or Web Worker) and updates the store.
 */
async function parseAndSetState(rawJson: string, store: Store): Promise<void> {
	const size = new Blob([rawJson]).size;

	if (size > WORKER_THRESHOLD) {
		// Large file: use Web Worker
		store.setState({ isParsing: true });

		try {
			const worker = new Worker(new URL("./core/worker.ts", import.meta.url), {
				type: "module",
			});

			const result = await new Promise<ReturnType<typeof parseJSON>>(
				(resolve) => {
					worker.onmessage = (e) => {
						resolve(e.data);
						worker.terminate();
					};
					worker.postMessage({ type: "PARSE", raw: rawJson });
				},
			);

			applyParseResult(result, store);
		} catch {
			// Fallback to main thread
			const result = parseJSON(rawJson);
			applyParseResult(result, store);
		} finally {
			store.setState({ isParsing: false });
		}
	} else {
		// Small file: parse on main thread
		const result = parseJSON(rawJson);
		applyParseResult(result, store);
	}
}

/**
 * Applies a parse result to the store.
 */
function applyParseResult(
	result: ReturnType<typeof parseJSON>,
	store: Store,
): void {
	if (result.ok) {
		// Auto-expand root node
		const rootExpandedNodes = new Set<number>();
		if (result.nodes.length > 0 && result.nodes[0]!.isExpandable) {
			rootExpandedNodes.add(result.nodes[0]!.id);
		}

		store.setState({
			nodes: result.nodes,
			isValid: true,
			parseError: null,
			totalKeys: result.totalKeys,
			maxDepth: result.maxDepth,
			expandedNodes: rootExpandedNodes,
		});
	} else {
		store.setState({
			nodes: [],
			isValid: false,
			parseError: result.error,
			totalKeys: 0,
			maxDepth: 0,
		});
	}
}

/**
 * Detects the user's system theme preference.
 */
function detectSystemTheme(): ResolvedTheme {
	if (window.matchMedia("(prefers-color-scheme: light)").matches) {
		return "light";
	}
	return "dark";
}
