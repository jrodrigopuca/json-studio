/**
 * Types for the Edit View component.
 */

export interface EditViewState {
	/** Whether the current content is valid JSON */
	isValid: boolean;
	/** Error message if JSON is invalid */
	errorMessage: string | null;
}
