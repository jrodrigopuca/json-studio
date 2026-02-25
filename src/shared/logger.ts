/**
 * Debug logging utility.
 *
 * In production builds, logs are disabled by default.
 * To enable debugging in production, run in browser console:
 *   localStorage.setItem('__JSON_SPARK_DEBUG__', 'true')
 *
 * To disable:
 *   localStorage.removeItem('__JSON_SPARK_DEBUG__')
 */

const DEBUG_KEY = "__JSON_SPARK_DEBUG__";

function isDebugEnabled(): boolean {
	// Check if we're in development mode (Vite sets this)
	if (import.meta.env.DEV) {
		return true;
	}

	// Check localStorage flag for production debugging
	try {
		return localStorage.getItem(DEBUG_KEY) === "true";
	} catch {
		return false;
	}
}

/**
 * Debug logger - only logs when debugging is enabled.
 * Usage: debug.log('message', data)
 */
export const debug = {
	log(...args: unknown[]): void {
		if (isDebugEnabled()) {
			console.log(...args);
		}
	},

	warn(...args: unknown[]): void {
		if (isDebugEnabled()) {
			console.warn(...args);
		}
	},

	error(...args: unknown[]): void {
		// Errors always show, but with debug context when enabled
		if (isDebugEnabled()) {
			console.error(...args);
		} else {
			// In production, only show error message without full context
			console.error(args[0]);
		}
	},

	/**
	 * Enable debug mode (for use in browser console).
	 */
	enable(): void {
		try {
			localStorage.setItem(DEBUG_KEY, "true");
			console.log("✅ Debug mode enabled. Reload the page to see debug logs.");
		} catch (e) {
			console.error("Failed to enable debug mode:", e);
		}
	},

	/**
	 * Disable debug mode.
	 */
	disable(): void {
		try {
			localStorage.removeItem(DEBUG_KEY);
			console.log("✅ Debug mode disabled.");
		} catch (e) {
			console.error("Failed to disable debug mode:", e);
		}
	},

	/**
	 * Check if debug mode is currently enabled.
	 */
	isEnabled(): boolean {
		return isDebugEnabled();
	},
};

// Expose debug controls globally for easy access in console
if (typeof window !== "undefined") {
	(window as any).__jsonSparkDebug = {
		enable: () => debug.enable(),
		disable: () => debug.disable(),
		status: () =>
			console.log(
				`Debug mode: ${debug.isEnabled() ? "ENABLED ✅" : "DISABLED ❌"}`,
			),
	};
}
