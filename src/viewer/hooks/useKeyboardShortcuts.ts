/**
 * Hook for global keyboard shortcuts.
 */

import { useEffect } from "react";
import { useStore } from "../store";

export function useKeyboardShortcuts() {
	const setViewMode = useStore((s) => s.setViewMode);
	const viewMode = useStore((s) => s.viewMode);
	const expandAll = useStore((s) => s.expandAll);
	const collapseAll = useStore((s) => s.collapseAll);
	const undo = useStore((s) => s.undo);
	const redo = useStore((s) => s.redo);
	const toggleLineNumbers = useStore((s) => s.toggleLineNumbers);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMod = e.metaKey || e.ctrlKey;

			// Don't intercept when typing in input/textarea
			if (
				document.activeElement?.tagName === "INPUT" ||
				document.activeElement?.tagName === "TEXTAREA"
			) {
				// Allow Ctrl+S for save in edit mode
				if (isMod && e.key === "s") {
					e.preventDefault();
					return;
				}
				return;
			}

			// ⌘1-6: View mode switching
			if (isMod && e.key >= "1" && e.key <= "6") {
				e.preventDefault();
				const modes = [
					"tree",
					"raw",
					"table",
					"diff",
					"edit",
					"saved",
				] as const;
				const idx = parseInt(e.key) - 1;
				if (modes[idx]) {
					setViewMode(modes[idx]);
				}
				return;
			}

			// ⌘E: Expand all (tree view)
			if (isMod && e.key === "e" && viewMode === "tree") {
				e.preventDefault();
				expandAll();
				return;
			}

			// ⌘W: Collapse all (tree view)
			if (isMod && e.key === "w" && viewMode === "tree") {
				e.preventDefault();
				collapseAll();
				return;
			}

			// ⌘Z: Undo
			if (isMod && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				undo();
				return;
			}

			// ⌘⇧Z or ⌘Y: Redo
			if ((isMod && e.key === "z" && e.shiftKey) || (isMod && e.key === "y")) {
				e.preventDefault();
				redo();
				return;
			}

			// ⌘L: Toggle line numbers
			if (isMod && e.key === "l") {
				e.preventDefault();
				toggleLineNumbers();
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		setViewMode,
		viewMode,
		expandAll,
		collapseAll,
		undo,
		redo,
		toggleLineNumbers,
	]);
}
