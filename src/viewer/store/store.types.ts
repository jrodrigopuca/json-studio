/**
 * Shared store type — intersection of all slices.
 * Each slice imports this so `get()` returns the full store.
 */

import type { JsonSlice } from "./json-slice";
import type { TreeSlice } from "./tree-slice";
import type { SearchSlice } from "./search-slice";
import type { EditorSlice } from "./editor-slice";
import type { SavedSlice } from "./saved-slice";
import type { UiSlice } from "./ui-slice";

export type StoreState = JsonSlice &
	TreeSlice &
	SearchSlice &
	EditorSlice &
	SavedSlice &
	UiSlice;
