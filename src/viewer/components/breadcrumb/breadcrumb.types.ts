/**
 * Breadcrumb component types.
 */

/** A single breadcrumb segment. */
export interface BreadcrumbSegment {
	/** Display label (key name, array index, or "root"). */
	label: string;
	/** Node ID to navigate to. */
	nodeId: number;
}
