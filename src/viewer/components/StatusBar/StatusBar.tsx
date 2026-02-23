/**
 * Status bar component showing file info.
 */

import { useStore } from "../../store";
import { useTheme } from "../../hooks/useTheme";
import { useI18n } from "../../hooks/useI18n";
import { formatSize } from "../../core/formatter";
import { Icon } from "../Icon";
import type { Locale } from "@shared/i18n";
import styles from "./StatusBar.module.css";

const LOCALE_CYCLE: Locale[] = ["en", "es", "pt"];
const LOCALE_LABELS: Record<Locale, string> = { en: "EN", es: "ES", pt: "PT" };

export function StatusBar() {
  const fileSize = useStore((s) => s.fileSize);
  const totalKeys = useStore((s) => s.totalKeys);
  const maxDepth = useStore((s) => s.maxDepth);
  const url = useStore((s) => s.url);
  const hasUnsavedEdits = useStore((s) => s.hasUnsavedEdits);
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("json-studio-theme", next);
  };

  const cycleLocale = () => {
    const idx = LOCALE_CYCLE.indexOf(locale);
    const next = LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length] as Locale;
    setLocale(next);
  };

  return (
    <footer className={styles.statusBar}>
      <div className={styles.left}>
        {hasUnsavedEdits && (
          <span className={styles.unsaved} title={t("statusBar.tooltip.unsavedChanges")}>
            ●
          </span>
        )}
        {url && (
          <span className={styles.item} title={url}>
            <Icon name="document" size={12} /> {new URL(url).pathname.split("/").pop() || "data.json"}
          </span>
        )}
      </div>

      <div className={styles.right}>
        <span className={styles.item} title={t("statusBar.tooltip.fileSize")}>
          {formatSize(fileSize)}
        </span>
        <span className={styles.item} title={t("statusBar.tooltip.totalKeys")}>
          {t("statusBar.stats.keys", { count: totalKeys.toLocaleString() })}
        </span>
        <span className={styles.item} title={t("statusBar.tooltip.maxDepth")}>
          {t("statusBar.stats.depth", { depth: maxDepth })}
        </span>
        <button
          className={styles.themeButton}
          onClick={toggleTheme}
          title={t("statusBar.tooltip.switchTheme", { theme: theme === "dark" ? "light" : "dark" })}
        >
          <Icon name={theme === "dark" ? "moon" : "sun"} size={14} />
        </button>
        <button
          className={styles.localeButton}
          onClick={cycleLocale}
          title={t("statusBar.tooltip.switchLocale", { locale: LOCALE_LABELS[locale] })}
        >
          {LOCALE_LABELS[locale]}
        </button>
      </div>
    </footer>
  );
}
