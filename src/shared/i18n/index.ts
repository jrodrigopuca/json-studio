/**
 * i18n — internationalization system for JSON Studio.
 *
 * Usage:
 *   import { t, setLocale, getLocale } from "@shared/i18n";
 *
 *   t("toolbar.tab.tree")              // → "Tree"
 *   t("app.error.parseErrorLocation", { line: 5, column: 12 })
 *                                       // → "Line 5, Column 12"
 *   setLocale("es");
 *   t("toolbar.tab.tree")              // → "Árbol"
 */

export type { Locale, TranslationKey, Translations } from "./types";
import type { Locale, TranslationKey, Translations } from "./types";
import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";

// ─── Registry ──────────────────────────────────────────────────

const locales: Record<Locale, Translations> = { en, es, pt };

// ─── State ─────────────────────────────────────────────────────

const STORAGE_KEY = "json-studio-locale";

function detectLocale(): Locale {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && stored in locales) return stored as Locale;
	} catch {
		/* SSR / extension context */
	}
	const nav = navigator?.language?.slice(0, 2) ?? "en";
	if (nav in locales) return nav as Locale;
	return "en";
}

let currentLocale: Locale = detectLocale();
let currentTranslations: Translations = locales[currentLocale];

// ─── Subscribers (for React re-renders) ────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeLocale(fn: Listener): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

// ─── Public API ────────────────────────────────────────────────

/** Get the current locale. */
export function getLocale(): Locale {
	return currentLocale;
}

/** Change the active locale and persist it. */
export function setLocale(locale: Locale): void {
	if (locale === currentLocale) return;
	currentLocale = locale;
	currentTranslations = locales[locale];
	try {
		localStorage.setItem(STORAGE_KEY, locale);
	} catch {
		/* ignore */
	}
	listeners.forEach((fn) => fn());
}

/**
 * Translate a key, optionally interpolating `{placeholders}`.
 *
 * @example
 * t("searchBar.count.format", { current: 3, total: 12 })
 * // → "3 of 12"
 */
export function t(
	key: TranslationKey,
	params?: Record<string, string | number>,
): string {
	let text = currentTranslations[key] ?? en[key] ?? key;
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			text = text.replaceAll(`{${k}}`, String(v));
		}
	}
	return text;
}
