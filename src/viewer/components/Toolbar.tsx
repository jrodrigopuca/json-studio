/**
 * Toolbar component with view tabs and action buttons.
 */

import { useState } from "react";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { SaveJsonModal } from "./Modal";
import type { ViewMode } from "@shared/types";
import styles from "./Toolbar.module.css";

const VIEW_TABS: { mode: ViewMode; label: string; shortcut: string }[] = [
  { mode: "tree", label: "Tree", shortcut: "⌘1" },
  { mode: "raw", label: "Raw", shortcut: "⌘2" },
  { mode: "table", label: "Table", shortcut: "⌘3" },
  { mode: "diff", label: "Diff", shortcut: "⌘4" },
  { mode: "edit", label: "Edit", shortcut: "⌘5" },
  { mode: "saved", label: "Saved", shortcut: "⌘6" },
];

export function Toolbar() {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const expandAll = useStore((s) => s.expandAll);
  const collapseAll = useStore((s) => s.collapseAll);
  const expandedNodes = useStore((s) => s.expandedNodes);
  const nodes = useStore((s) => s.nodes);
  const toggleSortedByKeys = useStore((s) => s.toggleSortedByKeys);
  const sortedByKeys = useStore((s) => s.sortedByKeys);
  const toggleLineNumbers = useStore((s) => s.toggleLineNumbers);
  const showLineNumbers = useStore((s) => s.showLineNumbers);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const undoStack = useStore((s) => s.undoStack);
  const redoStack = useStore((s) => s.redoStack);
  const toggleSearch = useStore((s) => s.toggleSearch);
  const isSearchOpen = useStore((s) => s.isSearchOpen);

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
            title={`${label} (${shortcut})`}
          >
            {label}
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
              title={isAllExpanded ? "Collapse all (⌘W)" : "Expand all (⌘E)"}
            >
              {isAllExpanded ? "▼" : "▶"}
            </button>
            <button
              className={`${styles.button} ${sortedByKeys ? styles.active : ""}`}
              onClick={toggleSortedByKeys}
              title="Sort keys alphabetically"
            >
              A↓
            </button>
          </>
        )}

        {/* Raw/Edit view actions */}
        {(viewMode === "raw" || viewMode === "edit") && (
          <button
            className={`${styles.button} ${showLineNumbers ? styles.active : ""}`}
            onClick={toggleLineNumbers}
            title="Toggle line numbers (⌘L)"
          >
            #
          </button>
        )}

        {/* Search button - available in tree, raw, edit */}
        {["tree", "raw", "edit"].includes(viewMode) && (
          <button
            className={`${styles.button} ${isSearchOpen ? styles.active : ""}`}
            onClick={toggleSearch}
            title="Search (⌘F)"
          >
            🔍
          </button>
        )}

        {/* Undo/Redo */}
        <button
          className={styles.button}
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (⌘Z)"
        >
          ↩
        </button>
        <button
          className={styles.button}
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (⌘⇧Z)"
        >
          ↪
        </button>

        {/* Copy */}
        <CopyButton />

        {/* Save to favorites */}
        <SaveFavoriteButton />

        {/* Download */}
        <DownloadButton />
      </div>
    </header>
  );
}

function CopyButton() {
  const rawJson = useStore((s) => s.rawJson);
  const { show: showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      showToast({ message: "JSON copiado", type: "success" });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      className={styles.button}
      onClick={handleCopy}
      title="Copy JSON to clipboard"
    >
      📋
    </button>
  );
}

function DownloadButton() {
  const rawJson = useStore((s) => s.rawJson);
  const url = useStore((s) => s.url);

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
      title="Download JSON"
    >
      ⬇
    </button>
  );
}

function SaveFavoriteButton() {
  const rawJson = useStore((s) => s.rawJson);
  const viewMode = useStore((s) => s.viewMode);
  const savedJsons = useStore((s) => s.savedJsons);
  const saveCurrentJson = useStore((s) => s.saveCurrentJson);
  const { show: showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show in saved view (already has save form)
  if (viewMode === "saved" || !rawJson) {
    return null;
  }

  const currentSize = new Blob([rawJson]).size;

  const handleSave = (name: string) => {
    const success = saveCurrentJson(name);
    if (success) {
      showToast({ message: `"${name}" guardado`, type: "success" });
      setIsModalOpen(false);
    } else {
      showToast({ message: "Error al guardar", type: "error" });
    }
  };

  return (
    <>
      <button
        className={styles.button}
        onClick={() => setIsModalOpen(true)}
        title="Guardar en favoritos"
      >
        ⭐
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
