/**
 * JSON Spark — Main viewer application.
 *
 * Entry point that orchestrates all components, manages state,
 * and handles JSON parsing (main thread or Web Worker).
 *
 * @module app
 */

import { createStore, type Store } from './core/store.js';
import { parseJSON } from './core/parser.js';
import type { AppState } from './core/store.types.js';
import type { ResolvedTheme, ContentTypeClass } from '../shared/types.js';
import { WORKER_THRESHOLD } from '../shared/constants.js';

// Components
import { Toolbar } from './components/toolbar/index.js';
import { TreeView } from './components/tree-view/index.js';
import { RawView } from './components/raw-view/index.js';
import { SearchBar } from './components/search-bar/index.js';
import { StatusBar } from './components/status-bar/index.js';
import { Banner } from './components/banner/index.js';

// Styles
import './styles/base.css';
import './styles/themes.css';
import './styles/responsive.css';
import './components/toolbar/toolbar.css';
import './components/tree-view/tree-view.css';
import './components/raw-view/raw-view.css';
import './components/search-bar/search-bar.css';
import './components/status-bar/status-bar.css';
import './components/banner/banner.css';

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
  const { container, rawJson, contentType = 'application/json', url = '' } = options;

  // Detect system theme
  const resolvedTheme = detectSystemTheme();

  // Create initial state
  const initialState: AppState = {
    rawJson,
    nodes: [],
    parseError: null,
    isValid: false,
    viewMode: 'tree',
    theme: resolvedTheme,
    contentType,
    url,
    expandedNodes: new Set<number>(),
    selectedNodeId: null,
    searchQuery: '',
    searchMatches: [],
    searchCurrentIndex: 0,
    fileSize: new Blob([rawJson]).size,
    totalKeys: 0,
    maxDepth: 0,
    isParsing: false,
  };

  const store = createStore(initialState);

  // Set theme on document
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  store.subscribe(['theme'], (state) => {
    document.documentElement.setAttribute('data-theme', state.theme);
  });

  // Build DOM structure
  container.id = 'js-app';
  container.innerHTML = '';

  // Create layout containers
  const mainContainer = document.createElement('div');
  mainContainer.className = 'js-main-container';
  mainContainer.style.display = 'flex';
  mainContainer.style.flexDirection = 'column';
  mainContainer.style.height = '100vh';

  // Instantiate components
  const banner = new Banner(store);
  const toolbar = new Toolbar(store);
  const searchBar = new SearchBar(store);
  const treeView = new TreeView(store);
  const rawView = new RawView(store);
  const statusBar = new StatusBar(store);

  // Render components in order
  toolbar.render(mainContainer);
  banner.render(mainContainer);
  searchBar.render(mainContainer);

  // View container (tree or raw)
  const viewContainer = document.createElement('div');
  viewContainer.style.flex = '1';
  viewContainer.style.overflow = 'hidden';
  viewContainer.style.display = 'flex';
  viewContainer.style.flexDirection = 'column';
  mainContainer.appendChild(viewContainer);

  treeView.render(viewContainer);
  rawView.render(viewContainer);

  statusBar.render(mainContainer);
  container.appendChild(mainContainer);

  // View mode switching
  const updateViewVisibility = (state: AppState): void => {
    const treeEl = viewContainer.querySelector('.js-tree-view') as HTMLElement;
    const rawEl = viewContainer.querySelector('.js-raw-view') as HTMLElement;

    if (treeEl) treeEl.style.display = state.viewMode === 'tree' ? 'block' : 'none';
    if (rawEl) rawEl.style.display = state.viewMode === 'raw' ? 'block' : 'none';
  };

  store.subscribe(['viewMode'], (state) => updateViewVisibility(state));

  // Parse JSON
  parseAndSetState(rawJson, store);

  // Initial view visibility
  updateViewVisibility(store.getState());

  // Listen for system theme changes
  const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onThemeChange = (e: MediaQueryListEvent): void => {
    const currentTheme = store.getState().theme;
    // Only auto-switch if user hasn't manually overridden
    if (currentTheme === detectSystemTheme()) {
      store.setState({ theme: e.matches ? 'dark' : 'light' });
    }
  };
  themeMediaQuery.addEventListener('change', onThemeChange);

  // Global keyboard shortcuts
  const onGlobalKeyDown = (e: KeyboardEvent): void => {
    // Number keys to switch views
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === '1') store.setState({ viewMode: 'tree' });
      if (e.key === '2') store.setState({ viewMode: 'raw' });
    }

    // Ctrl+Shift+F: Expand all
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      const nodes = store.getState().nodes;
      const allExpandable = new Set(nodes.filter((n) => n.isExpandable).map((n) => n.id));
      store.setState({ expandedNodes: allExpandable });
    }

    // Ctrl+Shift+C: Collapse all
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      store.setState({ expandedNodes: new Set<number>() });
    }
  };
  document.addEventListener('keydown', onGlobalKeyDown);

  // Return cleanup function
  return () => {
    toolbar.dispose();
    banner.dispose();
    searchBar.dispose();
    treeView.dispose();
    rawView.dispose();
    statusBar.dispose();
    store.dispose();
    themeMediaQuery.removeEventListener('change', onThemeChange);
    document.removeEventListener('keydown', onGlobalKeyDown);
    container.innerHTML = '';
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
      const worker = new Worker(
        new URL('./core/worker.ts', import.meta.url),
        { type: 'module' },
      );

      const result = await new Promise<ReturnType<typeof parseJSON>>((resolve) => {
        worker.onmessage = (e) => {
          resolve(e.data);
          worker.terminate();
        };
        worker.postMessage({ type: 'PARSE', raw: rawJson });
      });

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
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}
