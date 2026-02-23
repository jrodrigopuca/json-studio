/**
 * Search bar component types.
 */

export interface SearchState {
	query: string;
	matchCount: number;
	currentIndex: number;
	isVisible: boolean;
}
