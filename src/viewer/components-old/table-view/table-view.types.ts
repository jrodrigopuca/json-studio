/**
 * Table View component types.
 */

/** Sort direction for table columns. */
export type SortDirection = "asc" | "desc" | "none";

/** Column configuration for the table. */
export interface TableColumn {
	/** Column key (object property name). */
	key: string;
	/** Current sort direction. */
	sort: SortDirection;
}
