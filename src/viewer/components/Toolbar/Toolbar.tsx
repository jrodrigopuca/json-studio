/**
 * Toolbar component with view tabs and action buttons.
 */

import { useState } from "react";
import { useStore } from "../../store";
import { useToast } from "../Toast";
import { SaveJsonModal } from "../Modal";
import { Icon } from "../Icon";
import type { ViewMode } from "@shared/types";
import { useI18n } from "../../hooks/useI18n";
import styles from "./Toolbar.module.css";

const VIEW_TABS: { mode: ViewMode; label: string; shortcut: string }[] = [
  { mode: "tree", label: "toolbar.tab.tree", shortcut: "⌥1" },
  { mode: "raw", label: "toolbar.tab.raw", shortcut: "⌥2" },
  { mode: "table", label: "toolbar.tab.table", shortcut: "⌥3" },
  { mode: "diff", label: "toolbar.tab.diff", shortcut: "⌥4" },
  { mode: "edit", label: "toolbar.tab.edit", shortcut: "⌥5" },
  { mode: "saved", label: "toolbar.tab.saved", shortcut: "⌥6" },
  { mode: "convert", label: "toolbar.tab.convert", shortcut: "⌥7" },
];

export function Toolbar() {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const expandAll = useStore((s) => s.expandAll);
  const collapseAll = useStore((s) => s.collapseAll);
  const expandedNodes = useStore((s) => s.expandedNodes);
  const nodes = useStore((s) => s.nodes);
  const toggleSortedByKeys = useStore((s) => s.toggleSortedByKeys);
  const keySortOrder = useStore((s) => s.keySortOrder);
  const toggleLineNumbers = useStore((s) => s.toggleLineNumbers);
  const showLineNumbers = useStore((s) => s.showLineNumbers);
  const prettifyJson = useStore((s) => s.prettifyJson);
  const minifyJson = useStore((s) => s.minifyJson);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const undoStack = useStore((s) => s.undoStack);
  const redoStack = useStore((s) => s.redoStack);
  const toggleSearch = useStore((s) => s.toggleSearch);
  const isSearchOpen = useStore((s) => s.isSearchOpen);
  const setShowShortcutsHelp = useStore((s) => s.setShowShortcutsHelp);
  const { t } = useI18n();

  // Check if all expandable nodes are expanded
  const expandableCount = nodes.filter((n) => n.isExpandable).length;
  const isAllExpanded = expandedNodes.size >= expandableCount;

  return (
    <header className={styles.toolbar}>
      {/* View tabs */}
      <nav className={styles.tabs} role="tablist">
        {VIEW_TABS.map(({ mode, label, shortcut }) => (
          <button
            key={mode}
            role="tab"
            aria-selected={viewMode === mode}
            className={`${styles.tab} ${viewMode === mode ? styles.active : ""}`}
            onClick={() => setViewMode(mode)}
            title={`${t(label as any)} (${shortcut})`}
          >
            {t(label as any)}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className={styles.actions}>
        {/* Tree view actions */}
        {viewMode === "tree" && (
          <>
            <button
              className={styles.button}
              onClick={isAllExpanded ? collapseAll : expandAll}
              title={isAllExpanded ? t("toolbar.tooltip.collapseAll") : t("toolbar.tooltip.expandAll")}
            >
              <Icon name={isAllExpanded ? "chevron-down" : "chevron-right"} size={14} />
            </button>
            <button
              className={`${styles.button} ${keySortOrder ? styles.active : ""}`}
              onClick={toggleSortedByKeys}
              title={keySortOrder === null ? t("toolbar.tooltip.sortKeysAsc") : keySortOrder === 'asc' ? t("toolbar.tooltip.sortKeysDesc") : t("toolbar.tooltip.sortKeysRestore")}
            >
              <Icon name={keySortOrder === 'desc' ? "sort-desc" : "sort-asc"} size={14} />
            </button>
          </>
        )}

        {/* Raw/Edit view actions */}
        {(viewMode === "raw" || viewMode === "edit") && (
          <button
            className={`${styles.button} ${showLineNumbers ? styles.active : ""}`}
            onClick={toggleLineNumbers}
            title={t("toolbar.tooltip.toggleLineNumbers")}
          >
            <Icon name="hash" size={14} />
          </button>
        )}

        {/* Raw view: Prettify/Minify */}
        {viewMode === "raw" && (
          <>
            <button
              className={styles.button}
              onClick={prettifyJson}
              title={t("toolbar.tooltip.prettifyJson")}
            >
              <Icon name="braces" size={14} />
            </button>
            <button
              className={styles.button}
              onClick={minifyJson}
              title={t("toolbar.tooltip.minifyJson")}
            >
              <Icon name="braces-compact" size={14} />
            </button>
          </>
        )}

        {/* Search button - available in tree, raw, edit */}
        {["tree", "raw", "edit"].includes(viewMode) && (
          <button
            className={`${styles.button} ${isSearchOpen ? styles.active : ""}`}
            onClick={toggleSearch}
            title={t("toolbar.tooltip.search")}
          >
            <Icon name="search" size={14} />
          </button>
        )}

        {/* Undo/Redo */}
        <button
          className={styles.button}
          onClick={undo}
          disabled={undoStack.length === 0}
          title={t("toolbar.tooltip.undo")}
        >
          <Icon name="undo" size={14} />
        </button>
        <button
          className={styles.button}
          onClick={redo}
          disabled={redoStack.length === 0}
          title={t("toolbar.tooltip.redo")}
        >
          <Icon name="redo" size={14} />
        </button>

        {/* Copy */}
        <CopyButton />

        {/* Save to favorites */}
        <SaveFavoriteButton />

        {/* Download */}
        <DownloadButton />

        {/* Help */}
        <button
          className={styles.button}
          onClick={() => setShowShortcutsHelp(true)}
          title={t("toolbar.tooltip.keyboardShortcuts")}
        >
          <Icon name="help" size={14} />
        </button>
      </div>
    </header>
  );
}

function CopyButton() {
  const rawJson = useStore((s) => s.rawJson);
  const { show: showToast } = useToast();
  const { t } = useI18n();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      showToast({ message: t("toolbar.toast.jsonCopied"), type: "success" });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      className={styles.button}
      onClick={handleCopy}
      title={t("toolbar.tooltip.copyJson")}
    >
      <Icon name="copy" size={14} />
    </button>
  );
}

function DownloadButton() {
  const rawJson = useStore((s) => s.rawJson);
  const url = useStore((s) => s.url);
  const { t } = useI18n();

  const handleDownload = () => {
    const blob = new Blob([rawJson], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = url ? new URL(url).pathname.split("/").pop() || "data.json" : "data.json";
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <button
      className={styles.button}
      onClick={handleDownload}
      title={t("toolbar.tooltip.downloadJson")}
    >
      <Icon name="download" size={14} />
    </button>
  );
}

function SaveFavoriteButton() {
  const rawJson = useStore((s) => s.rawJson);
  const viewMode = useStore((s) => s.viewMode);
  const savedJsons = useStore((s) => s.savedJsons);
  const saveCurrentJson = useStore((s) => s.saveCurrentJson);
  const { show: showToast } = useToast();
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show in saved view (already has save form)
  if (viewMode === "saved" || !rawJson) {
    return null;
  }

  const currentSize = new Blob([rawJson]).size;

  const handleSave = (name: string) => {
    const success = saveCurrentJson(name);
    if (success) {
      showToast({ message: t("toolbar.toast.savedFavorite", { name }), type: "success" });
      setIsModalOpen(false);
    } else {
      showToast({ message: t("toolbar.toast.saveError"), type: "error" });
    }
  };

  return (
    <>
      <button
        className={styles.button}
        onClick={() => setIsModalOpen(true)}
        title={t("toolbar.tooltip.saveToFavorites")}
      >
        <Icon name="star" size={14} />
      </button>
      <SaveJsonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        currentSize={currentSize}
        savedCount={savedJsons.length}
      />
    </>
  );
}
