/**
 * Search bar component with navigation.
 */

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import styles from "./SearchBar.module.css";

export function SearchBar() {
  const viewMode = useStore((s) => s.viewMode);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const searchMatches = useStore((s) => s.searchMatches);
  const searchLineMatches = useStore((s) => s.searchLineMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const setSearchMatches = useStore((s) => s.setSearchMatches);
  const setSearchLineMatches = useStore((s) => s.setSearchLineMatches);
  const nodes = useStore((s) => s.nodes);
  const rawJson = useStore((s) => s.rawJson);
  const nextMatch = useStore((s) => s.nextMatch);
  const prevMatch = useStore((s) => s.prevMatch);
  const isSearchOpen = useStore((s) => s.isSearchOpen);
  const toggleSearch = useStore((s) => s.toggleSearch);
  const closeSearch = useStore((s) => s.closeSearch);
  const expandToNode = useStore((s) => s.expandToNode);

  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  // Get current matches based on view mode
  const matches = viewMode === "tree" ? searchMatches : searchLineMatches;

  // Keyboard shortcut to open search (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        // Only intercept in supported views
        if (["tree", "raw", "edit"].includes(viewMode)) {
          e.preventDefault();
          if (!isSearchOpen) toggleSearch();
          else inputRef.current?.focus();
        }
      }
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isSearchOpen, toggleSearch, closeSearch]);

  // Focus input when opening
  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isSearchOpen]);

  // Perform search
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchMatches([]);
        setSearchLineMatches([]);
        return;
      }

      const lowerQuery = query.toLowerCase();

      if (viewMode === "tree") {
        // Search nodes
        const results: number[] = [];
        for (const node of nodes) {
          if (node.key?.toLowerCase().includes(lowerQuery)) {
            results.push(node.id);
            continue;
          }
          if (!node.isExpandable && node.value !== null) {
            if (String(node.value).toLowerCase().includes(lowerQuery)) {
              results.push(node.id);
            }
          }
        }
        setSearchMatches(results);
        // Expand to first match
        if (results.length > 0) {
          expandToNode(results[0]!);
        }
      } else {
        // Search lines in raw/edit
        const lines = rawJson.split("\n");
        const results: number[] = [];
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(lowerQuery)) {
            results.push(idx + 1); // 1-indexed
          }
        });
        setSearchLineMatches(results);
      }
    },
    [viewMode, nodes, rawJson, setSearchMatches, setSearchLineMatches, expandToNode]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        prevMatch();
      } else {
        nextMatch();
      }
    }
  };

  // Expand to current match in tree view when navigating
  useEffect(() => {
    if (viewMode === "tree" && searchMatches.length > 0) {
      const currentMatchId = searchMatches[searchCurrentIndex];
      if (currentMatchId !== undefined) {
        expandToNode(currentMatchId);
      }
    }
  }, [viewMode, searchMatches, searchCurrentIndex, expandToNode]);

  // Don't show in unsupported views
  if (!["tree", "raw", "edit"].includes(viewMode)) {
    return null;
  }

  if (!isSearchOpen) {
    return null;
  }

  return (
    <div className={styles.searchBar} role="search">
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder={t("searchBar.placeholder")}
        value={searchQuery}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label={t("searchBar.ariaLabel")}
      />

      <span className={styles.count}>
        {matches.length > 0
          ? t("searchBar.count.format", { current: searchCurrentIndex + 1, total: matches.length })
          : searchQuery
          ? t("searchBar.count.noResults")
          : ""}
      </span>

      <div className={styles.nav}>
        <button
          className={styles.navButton}
          onClick={prevMatch}
          disabled={matches.length === 0}
          title={t("searchBar.tooltip.previous")}
        >
          ↑
        </button>
        <button
          className={styles.navButton}
          onClick={nextMatch}
          disabled={matches.length === 0}
          title={t("searchBar.tooltip.next")}
        >
          ↓
        </button>
        <button
          className={styles.navButton}
          onClick={closeSearch}
          title={t("searchBar.tooltip.close")}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
