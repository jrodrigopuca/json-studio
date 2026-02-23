/**
 * Tree view component types.
 */

/** Context menu action for tree nodes. */
export type TreeContextAction =
	| "copy-value"
	| "copy-path"
	| "copy-key"
	| "expand-children"
	| "collapse-children";

/** Tree node click event data. */
export interface TreeNodeClickEvent {
	nodeId: number;
	action: "toggle" | "select";
}
