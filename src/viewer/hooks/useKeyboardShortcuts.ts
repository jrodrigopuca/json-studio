/**
 * Hook for global keyboard shortcuts.
 *
 * Uses Option/Alt as primary modifier to avoid conflicts with Chrome shortcuts.
 * Chrome uses ⌘ for most things (⌘W, ⌘L, ⌘T, ⌘1-8), but rarely uses ⌥.
 *
 * Note: On macOS, Option+key produces special characters, so we use e.code
 * (physical key) instead of e.key (character produced).
 *
 * Shortcuts:
 *   ⌥1-6: Switch views
 *   ⌥E: Expand all (tree)
 *   ⌥C: Collapse all (tree)
 *   ⌥L: Toggle line numbers
 *   ⌥S: Toggle sort by keys (tree)
 *   ⌘F: Search (we intercept this for better JSON search)
 *   ⌘Z: Undo
 *   ⌘⇧Z: Redo
 *   ?: Show keyboard shortcuts help (when not typing)
 */

import { useEffect } from "react";
import type { ViewMode } from "../../shared/types";
import { useStore } from "../store";

export function useKeyboardShortcuts() {
	const setViewMode = useStore((s) => s.setViewMode);
	const viewMode = useStore((s) => s.viewMode);
	const expandAll = useStore((s) => s.expandAll);
	const collapseAll = useStore((s) => s.collapseAll);
	const undo = useStore((s) => s.undo);
	const redo = useStore((s) => s.redo);
	const toggleLineNumbers = useStore((s) => s.toggleLineNumbers);
	const toggleSortedByKeys = useStore((s) => s.toggleSortedByKeys);
	const toggleSearch = useStore((s) => s.toggleSearch);
	const isSearchOpen = useStore((s) => s.isSearchOpen);
	const showShortcutsHelp = useStore((s) => s.showShortcutsHelp);
	const setShowShortcutsHelp = useStore((s) => s.setShowShortcutsHelp);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMod = e.metaKey || e.ctrlKey;
			const isAlt = e.altKey;
			const isTyping =
				document.activeElement?.tagName === "INPUT" ||
				document.activeElement?.tagName === "TEXTAREA";

			// Use e.code for physical key detection (works with Option on macOS)
			const code = e.code;

			// === ⌘ shortcuts (standard, always work) ===

			// ⌘Z: Undo
			if (isMod && code === "KeyZ" && !e.shiftKey) {
				e.preventDefault();
				undo();
				return;
			}

			// ⌘⇧Z or ⌘Y: Redo
			if (
				(isMod && code === "KeyZ" && e.shiftKey) ||
				(isMod && code === "KeyY")
			) {
				e.preventDefault();
				redo();
				return;
			}

			// ⌘S: Save (prevent default, handled by EditView)
			if (isMod && code === "KeyS") {
				e.preventDefault();
				return;
			}

			// === ⌥ (Option/Alt) shortcuts - use e.code for macOS compatibility ===

			// ⌥1-7: View mode switching
			if (isAlt && code.startsWith("Digit")) {
				const digit = parseInt(code.charAt(5));
				if (digit >= 1 && digit <= 7) {
					e.preventDefault();
					const modes: ViewMode[] = [
						"tree",
						"raw",
						"table",
						"diff",
						"edit",
						"saved",
						"convert",
					];
					setViewMode(modes[digit - 1]!);
				}
				return;
			}

			// ⌥E: Expand all (tree view)
			if (isAlt && code === "KeyE") {
				if (viewMode === "tree") {
					e.preventDefault();
					expandAll();
				}
				return;
			}

			// ⌥C: Collapse all (tree view)
			if (isAlt && code === "KeyC") {
				if (viewMode === "tree") {
					e.preventDefault();
					collapseAll();
				}
				return;
			}

			// ⌥S: Toggle sort by keys (tree view)
			if (isAlt && code === "KeyS") {
				if (viewMode === "tree") {
					e.preventDefault();
					toggleSortedByKeys();
				}
				return;
			}

			// ⌥L: Toggle line numbers (raw/edit view)
			if (isAlt && code === "KeyL") {
				if (viewMode === "raw" || viewMode === "edit") {
					e.preventDefault();
					toggleLineNumbers();
				}
				return;
			}

			// ⌥F: Open search (alternative to ⌘F)
			if (isAlt && code === "KeyF") {
				if (["tree", "raw", "edit"].includes(viewMode)) {
					e.preventDefault();
					if (!isSearchOpen) toggleSearch();
				}
				return;
			}

			// === Single-key shortcuts (only when not typing) ===
			if (isTyping) return;

			// Escape: Close help modal
			if (e.key === "Escape" && showShortcutsHelp) {
				e.preventDefault();
				setShowShortcutsHelp(false);
				return;
			}

			// ?: Show keyboard shortcuts help
			if (e.key === "?" || (e.shiftKey && code === "Slash")) {
				e.preventDefault();
				setShowShortcutsHelp(!showShortcutsHelp);
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
		toggleSortedByKeys,
		toggleSearch,
		isSearchOpen,
		showShortcutsHelp,
		setShowShortcutsHelp,
	]);
}
