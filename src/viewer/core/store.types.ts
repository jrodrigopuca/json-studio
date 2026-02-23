/**
 * Types for the viewer's global state and store.
 */

import type { ViewMode, ResolvedTheme, ContentTypeClass } from '../../shared/types.js';
import type { FlatNode, ParseError } from './parser.types.js';

/** Full application state. */
export interface AppState {
  /** The raw JSON string. */
  rawJson: string;
  /** Flattened tree nodes for virtualised rendering. */
  nodes: FlatNode[];
  /** Parse error if JSON is invalid. */
  parseError: ParseError | null;
  /** Whether the JSON was successfully parsed. */
  isValid: boolean;
  /** Current view mode. */
  viewMode: ViewMode;
  /** Resolved theme. */
  theme: ResolvedTheme;
  /** Content-type classification. */
  contentType: ContentTypeClass;
  /** Source URL. */
  url: string;
  /** Set of expanded node IDs. */
  expandedNodes: Set<number>;
  /** Currently selected node ID. */
  selectedNodeId: number | null;
  /** Search query string. */
  searchQuery: string;
  /** IDs of nodes matching search. */
  searchMatches: number[];
  /** Current match index in search results. */
  searchCurrentIndex: number;
  /** File size in bytes. */
  fileSize: number;
  /** Total number of keys. */
  totalKeys: number;
  /** Max depth of the JSON tree. */
  maxDepth: number;
  /** Whether parsing is in progress (Web Worker). */
  isParsing: boolean;
}

/** Keys of AppState for subscription granularity. */
export type StateKey = keyof AppState;

/** Callback for state change subscriptions. */
export type StateListener = (state: AppState, changed: StateKey[]) => void;
