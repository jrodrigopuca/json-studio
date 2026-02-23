/**
 * React hook for i18n — provides `t()`, locale, and `setLocale`.
 * Components using this hook will re-render when the locale changes.
 */

import { useSyncExternalStore, useCallback } from "react";
import {
	t as translate,
	getLocale,
	setLocale as setGlobalLocale,
	subscribeLocale,
	type Locale,
	type TranslationKey,
} from "@shared/i18n";

function getSnapshot(): Locale {
	return getLocale();
}

export function useI18n() {
	const locale = useSyncExternalStore(subscribeLocale, getSnapshot);

	const t = useCallback(
		(key: TranslationKey, params?: Record<string, string | number>) =>
			translate(key, params),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[locale],
	);

	return { t, locale, setLocale: setGlobalLocale } as const;
}
