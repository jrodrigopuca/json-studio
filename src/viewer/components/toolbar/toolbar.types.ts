/**
 * Toolbar component types.
 */

import type { ViewMode } from '../../../shared/types.js';

/** Toolbar button action identifiers. */
export type ToolbarAction =
  | 'expand-all'
  | 'collapse-all'
  | 'copy-all'
  | 'toggle-theme'
  | 'toggle-search';

/** Toolbar tab representing a view mode. */
export interface ToolbarTab {
  id: ViewMode;
  label: string;
  shortcut: string;
}
