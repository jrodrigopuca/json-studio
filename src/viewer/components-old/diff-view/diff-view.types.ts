/**
 * Types for the Diff View component.
 */

/** A single diff entry between two JSON values. */
export interface DiffEntry {
	/** JSONPath to the changed value. */
	path: string;
	/** Type of change. */
	type: "added" | "removed" | "changed";
	/** Old value (for removed/changed). */
	oldValue?: unknown;
	/** New value (for added/changed). */
	newValue?: unknown;
}
