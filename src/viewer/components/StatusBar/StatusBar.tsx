/**
 * Status bar component showing file info.
 */

import { useStore } from "../../store";
import { useTheme } from "../../hooks/useTheme";
import { formatSize } from "../../core/formatter";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const fileSize = useStore((s) => s.fileSize);
  const totalKeys = useStore((s) => s.totalKeys);
  const maxDepth = useStore((s) => s.maxDepth);
  const url = useStore((s) => s.url);
  const hasUnsavedEdits = useStore((s) => s.hasUnsavedEdits);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("json-studio-theme", next);
  };

  return (
    <footer className={styles.statusBar}>
      <div className={styles.left}>
        {hasUnsavedEdits && (
          <span className={styles.unsaved} title="Unsaved changes">
            ●
          </span>
        )}
        {url && (
          <span className={styles.item} title={url}>
            📄 {new URL(url).pathname.split("/").pop() || "data.json"}
          </span>
        )}
      </div>

      <div className={styles.right}>
        <span className={styles.item} title="File size">
          {formatSize(fileSize)}
        </span>
        <span className={styles.item} title="Total keys">
          {totalKeys.toLocaleString()} keys
        </span>
        <span className={styles.item} title="Max depth">
          Depth: {maxDepth}
        </span>
        <button
          className={styles.themeButton}
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
    </footer>
  );
}
