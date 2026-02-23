/**
 * EditView component - editable JSON with syntax highlighting.
 * Mini-VSCode style editor with formatting controls.
 */

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useStore } from "../../store";
import { highlightJson } from "../../core/highlighter";
import { EditorToolbar } from "./EditorToolbar";
import styles from "./EditView.module.css";

export function EditView() {
  const rawJson = useStore((s) => s.rawJson);
  const showLineNumbers = useStore((s) => s.showLineNumbers);
  const editContent = useStore((s) => s.editContent);
  const setEditContent = useStore((s) => s.setEditContent);
  const saveEditContent = useStore((s) => s.saveEditContent);
  const searchLineMatches = useStore((s) => s.searchLineMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const searchQuery = useStore((s) => s.searchQuery);
  
  // Editor settings
  const editorIndentSize = useStore((s) => s.editorIndentSize);
  const editorWordWrap = useStore((s) => s.editorWordWrap);
  const editorFontSize = useStore((s) => s.editorFontSize);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Cursor position state
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);

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

  // Calculate cursor position
  const updateCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const textBeforeCursor = editContent.substring(0, pos);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    setCursorLine(line);
    setCursorColumn(column);
  }, [editContent]);

  // Update cursor position on selection change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => updateCursorPosition();
    
    textarea.addEventListener('click', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);
    
    return () => {
      textarea.removeEventListener('click', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
    };
  }, [updateCursorPosition]);

  // Handle Tab key for indentation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = ' '.repeat(editorIndentSize);
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
        const lineContent = editContent.substring(lineStart, start);
        const spacesToRemove = Math.min(
          editorIndentSize,
          lineContent.length - lineContent.trimStart().length
        );
        
        if (spacesToRemove > 0) {
          const newContent = 
            editContent.substring(0, lineStart) +
            editContent.substring(lineStart + spacesToRemove);
          setEditContent(newContent);
          
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = start - spacesToRemove;
          });
        }
      } else {
        // Tab: Add indentation
        const newContent = 
          editContent.substring(0, start) + 
          indent + 
          editContent.substring(end);
        setEditContent(newContent);
        
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + editorIndentSize;
        });
      }
    }
  }, [editContent, editorIndentSize, setEditContent]);

  // Save changes
  const handleSave = useCallback(() => {
    if (error) return;
    saveEditContent();
  }, [error, saveEditContent]);

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
        isCurrentLine: lineNum === cursorLine,
      };
    });
  }, [editContent, searchLineMatches, currentMatchLine, searchQuery, cursorLine]);

  const totalLines = highlightedLines.length;

  const editorStyle = {
    '--editor-font-size': `${editorFontSize}px`,
    '--editor-word-wrap': editorWordWrap ? 'pre-wrap' : 'pre',
  } as React.CSSProperties;

  return (
    <div className={styles.editView} style={editorStyle}>
      <EditorToolbar
        cursorLine={cursorLine}
        cursorColumn={cursorColumn}
        totalLines={totalLines}
      />

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
                className={`${styles.lineNumber} ${line.isMatch ? styles.matchLineNumber : ""} ${line.isCurrentMatch ? styles.currentMatchLineNumber : ""} ${line.isCurrentLine ? styles.currentLineNumber : ""}`}
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
                className={`${styles.line} ${line.isMatch ? styles.matchLine : ""} ${line.isCurrentMatch ? styles.currentMatchLine : ""} ${line.isCurrentLine ? styles.currentLine : ""}`}
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
            onKeyDown={handleKeyDown}
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
      </div>
    </div>
  );
}
