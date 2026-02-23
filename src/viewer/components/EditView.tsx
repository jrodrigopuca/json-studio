/**
 * EditView component - editable JSON with syntax highlighting.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { highlightJson } from "../core/highlighter";
import styles from "./EditView.module.css";

const MAX_SIZE_KB = 500;

export function EditView() {
  const rawJson = useStore((s) => s.rawJson);
  const showLineNumbers = useStore((s) => s.showLineNumbers);
  const editContent = useStore((s) => s.editContent);
  const setEditContent = useStore((s) => s.setEditContent);
  const saveEditContent = useStore((s) => s.saveEditContent);
  const saveCurrentJson = useStore((s) => s.saveCurrentJson);
  const savedJsons = useStore((s) => s.savedJsons);
  const searchLineMatches = useStore((s) => s.searchLineMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const searchQuery = useStore((s) => s.searchQuery);
  const { show: showToast } = useToast();

  const [favoriteName, setFavoriteName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Current match line number
  const currentMatchLine = searchLineMatches[searchCurrentIndex];

  // Sync edit content with rawJson when entering edit mode
  useEffect(() => {
    setEditContent(rawJson);
  }, [rawJson, setEditContent]);

  // Validate JSON - computed
  const error = useMemo(() => {
    try {
      JSON.parse(editContent);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid JSON";
    }
  }, [editContent]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchLine !== undefined) {
      const lineElement = lineRefs.current.get(currentMatchLine);
      lineElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentMatchLine]);

  // Sync scroll between textarea and highlight layer
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    if (error) return;
    saveEditContent();
  }, [error, saveEditContent]);

  // Save as favorite
  const currentSize = new Blob([editContent]).size;
  const isOverSize = currentSize > MAX_SIZE_KB * 1024;
  const canSaveFavorite = editContent && favoriteName.trim() && !isOverSize && savedJsons.length < 10 && !error;

  const handleSaveFavorite = useCallback(() => {
    if (!canSaveFavorite) return;
    const success = saveCurrentJson(favoriteName.trim());
    if (success) {
      showToast({ message: `"${favoriteName}" guardado en favoritos`, type: "success" });
      setFavoriteName("");
    } else {
      showToast({ message: "Error al guardar", type: "error" });
    }
  }, [canSaveFavorite, saveCurrentJson, favoriteName, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Highlight content with line wrapping and search highlighting
  const highlightedLines = useMemo(() => {
    const searchMatchSet = new Set(searchLineMatches);
    return editContent.split("\n").map((line, idx) => {
      const lineNum = idx + 1;
      let html = highlightJson(line) || " ";
      
      // Highlight search matches within the line
      if (searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase())) {
        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        html = html.replace(regex, '<mark class="search-match">$1</mark>');
      }
      
      return {
        number: lineNum,
        html,
        isMatch: searchMatchSet.has(lineNum),
        isCurrentMatch: lineNum === currentMatchLine,
      };
    });
  }, [editContent, searchLineMatches, currentMatchLine, searchQuery]);

  return (
    <div className={styles.editView}>
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.editor}>
        {showLineNumbers && (
          <div className={styles.gutter}>
            {highlightedLines.map((line) => (
              <div
                key={line.number}
                className={`${styles.lineNumber} ${line.isMatch ? styles.matchLineNumber : ""} ${line.isCurrentMatch ? styles.currentMatchLineNumber : ""}`}
              >
                {line.number}
              </div>
            ))}
          </div>
        )}

        <div className={styles.content}>
          {/* Highlight layer */}
          <pre
            ref={highlightRef}
            className={styles.highlight}
            aria-hidden="true"
          >
            {highlightedLines.map((line) => (
              <div
                key={line.number}
                ref={(el) => {
                  if (el && line.isMatch) {
                    lineRefs.current.set(line.number, el);
                  }
                }}
                className={`${styles.line} ${line.isMatch ? styles.matchLine : ""} ${line.isCurrentMatch ? styles.currentMatchLine : ""}`}
                dangerouslySetInnerHTML={{ __html: line.html }}
              />
            ))}
          </pre>

          {/* Textarea layer */}
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="JSON editor"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!!error || editContent === rawJson}
        >
          Save (⌘S)
        </button>
        <button
          className={styles.discardButton}
          onClick={() => setEditContent(rawJson)}
          disabled={editContent === rawJson}
        >
          Discard
        </button>

        <div className={styles.favoriteSection}>
          <input
            type="text"
            className={styles.favoriteInput}
            placeholder="Guardar como favorito..."
            value={favoriteName}
            onChange={(e) => setFavoriteName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSaveFavorite) {
                handleSaveFavorite();
              }
            }}
          />
          <button
            className={styles.favoriteButton}
            onClick={handleSaveFavorite}
            disabled={!canSaveFavorite}
            title={
              isOverSize
                ? `El JSON excede el límite de ${MAX_SIZE_KB}KB`
                : savedJsons.length >= 10
                ? "Límite de 10 guardados alcanzado"
                : "Guardar como favorito"
            }
          >
            ⭐
          </button>
        </div>
      </div>
    </div>
  );
}
