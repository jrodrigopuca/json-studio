/**
 * Hook to manage theme (dark/light).
 */

import { useEffect } from "react";
import { useStore } from "../store";

export function useTheme() {
	const theme = useStore((s) => s.theme);
	const setTheme = useStore((s) => s.setTheme);

	// Apply theme to document
	useEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	// Detect system preference on mount
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
			// Only auto-switch if stored preference is "system"
			const stored = localStorage.getItem("json-studio-theme");
			if (!stored || stored === "system") {
				setTheme(e.matches ? "dark" : "light");
			}
		};

		// Initial check
		const stored = localStorage.getItem("json-studio-theme");
		if (stored === "dark" || stored === "light") {
			setTheme(stored);
		} else {
			handleChange(mediaQuery);
		}

		// Listen for changes
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [setTheme]);

	return { theme, setTheme };
}
