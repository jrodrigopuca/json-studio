/**
 * EditView component - editable JSON with syntax highlighting.
 * Mini-VSCode style editor with formatting controls.
 */

import { useRef, useEffect, useLayoutEffect, useMemo, useCallback, useState } from "react";
import { useStore } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import { highlightJson } from "../../core/highlighter";
import { prettyPrint } from "../../core/formatter";
import { formatSize } from "../../core/formatter";
import { HEAVY_VIEW_THRESHOLD } from "@shared/constants";
import { EditorToolbar } from "./EditorToolbar";
import styles from "./EditView.module.css";

// Bracket pairs for matching
const BRACKETS: Record<string, string> = {
  '{': '}',
  '[': ']',
  '}': '{',
  ']': '[',
};
const OPEN_BRACKETS = new Set(['{', '[']);

// Find matching bracket position
function findMatchingBracket(text: string, pos: number): number | null {
  const char = text[pos];
  if (!char || !BRACKETS[char]) return null;
  
  const isOpen = OPEN_BRACKETS.has(char);
  const target = BRACKETS[char];
  if (!target) return null;
  
  const dir = isOpen ? 1 : -1;
  let depth = 1;
  let i = pos + dir;
  
  while (i >= 0 && i < text.length) {
    const c = text[i];
    if (c === char) depth++;
    else if (c === target) depth--;
    if (depth === 0) return i;
    i += dir;
  }
  return null;
}



export function EditView() {
  const rawJson = useStore((s) => s.rawJson);
  const fileSize = useStore((s) => s.fileSize);
  const parseError = useStore((s) => s.parseError);
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

  // Large file mode — skip expensive features
  const isLargeEditor = fileSize >= HEAVY_VIEW_THRESHOLD;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Cursor position state
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);
  
  // Bracket matching state
  const [matchingBrackets, setMatchingBrackets] = useState<[number, number] | null>(null);
  
  const { t } = useI18n();

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
      return e instanceof Error ? e.message : t("editView.error.invalidJson");
    }
  }, [editContent]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchLine !== undefined) {
      const lineElement = lineRefs.current.get(currentMatchLine);
      lineElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentMatchLine]);

  // Sync scroll between textarea, highlight layer, and gutter
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Re-sync scroll after React re-renders content (prevents desync flash)
  useLayoutEffect(() => {
    handleScroll();
  }, [editContent, handleScroll]);

  // Calculate cursor position and bracket matching
  const updateCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const textBeforeCursor = editContent.substring(0, pos);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const lastLine = lines[lines.length - 1] ?? '';
    const column = lastLine.length + 1;

    setCursorLine(line);
    setCursorColumn(column);
    
    // Check for bracket matching (skip for large files)
    if (isLargeEditor) {
      setMatchingBrackets(null);
      return;
    }
    // Check character at cursor and before cursor
    let bracketPos: number | null = null;
    const charAtPos = editContent[pos];
    const charBeforePos = pos > 0 ? editContent[pos - 1] : undefined;
    
    if (pos < editContent.length && charAtPos && BRACKETS[charAtPos]) {
      bracketPos = pos;
    } else if (charBeforePos && BRACKETS[charBeforePos]) {
      bracketPos = pos - 1;
    }
    
    if (bracketPos !== null) {
      const matchPos = findMatchingBracket(editContent, bracketPos);
      if (matchPos !== null) {
        setMatchingBrackets([bracketPos, matchPos]);
      } else {
        setMatchingBrackets(null);
      }
    } else {
      setMatchingBrackets(null);
    }
  }, [editContent, isLargeEditor]);

  // Note: cursor position tracking is handled by onSelect on the textarea

  // Handle paste with auto-format
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Try to parse and format as JSON
    try {
      JSON.parse(pastedText); // Validate JSON
      const formatted = prettyPrint(pastedText, editorIndentSize);
      
      if (formatted !== pastedText) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const newContent = 
          editContent.substring(0, start) + 
          formatted + 
          editContent.substring(end);
        setEditContent(newContent);
        
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + formatted.length;
        });
      }
    } catch {
      // Not valid JSON, paste as-is
    }
  }, [editContent, editorIndentSize, setEditContent]);
  
  // Handle Tab key for indentation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = editorIndentSize === "tab" ? "\t" : ' '.repeat(editorIndentSize);
      const indentLength = editorIndentSize === "tab" ? 1 : editorIndentSize;
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
        const lineContent = editContent.substring(lineStart, start);
        
        // Check for tab or spaces at start
        let spacesToRemove = 0;
        if (lineContent.startsWith('\t')) {
          spacesToRemove = 1;
        } else {
          const leadingSpaces = lineContent.length - lineContent.trimStart().length;
          spacesToRemove = Math.min(
            editorIndentSize === "tab" ? 1 : editorIndentSize,
            leadingSpaces
          );
        }
        
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
          textarea.selectionStart = textarea.selectionEnd = start + indentLength;
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
    
    // Calculate bracket positions by line (skip for large files)
    let bracket1Line: number | null = null;
    let bracket2Line: number | null = null;
    if (!isLargeEditor && matchingBrackets) {
      const [pos1, pos2] = matchingBrackets;
      const textBefore1 = editContent.substring(0, pos1);
      const textBefore2 = editContent.substring(0, pos2);
      bracket1Line = textBefore1.split('\n').length;
      bracket2Line = textBefore2.split('\n').length;
    }
    
    const lines = editContent.split("\n");
    const result: Array<{
      number: number;
      html: string;
      isMatch: boolean;
      isCurrentMatch: boolean;
      hasBracketMatch: boolean;
    }> = [];
    
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx] ?? '';
      const lineNum = idx + 1;
      // Skip syntax highlighting for large files — use plain text with HTML escaping
      let html: string;
      if (isLargeEditor) {
        html = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;') || ' ';
      } else {
        html = highlightJson(line) || " ";
      }
      
      // Highlight search matches within the line
      if (searchQuery && line && line.toLowerCase().includes(searchQuery.toLowerCase())) {
        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        html = html.replace(regex, '<mark class="search-match">$1</mark>');
      }
      
      // Check for bracket matches on this line (skip for large files)
      const hasBracketMatch = !isLargeEditor && (lineNum === bracket1Line || lineNum === bracket2Line);
      if (hasBracketMatch && matchingBrackets) {
        // Highlight matching brackets
        const [pos1, pos2] = matchingBrackets;
        const char1 = editContent[pos1] ?? '';
        const char2 = editContent[pos2] ?? '';
        if (lineNum === bracket1Line && char1) {
          html = html.replace(
            new RegExp(`(\\${char1})`),
            '<span class="bracket-match">$1</span>'
          );
        }
        if (lineNum === bracket2Line && char2) {
          html = html.replace(
            new RegExp(`(\\${char2})`),
            '<span class="bracket-match">$1</span>'
          );
        }
      }
      
      result.push({
        number: lineNum,
        html,
        isMatch: searchMatchSet.has(lineNum),
        isCurrentMatch: lineNum === currentMatchLine,
        hasBracketMatch,
      });
    }
    
    return result;
  }, [editContent, searchLineMatches, currentMatchLine, searchQuery, matchingBrackets, isLargeEditor]);

  const totalLines = highlightedLines.length;

  const editorStyle = {
    '--editor-font-size': `${editorFontSize}px`,
    '--editor-word-wrap': editorWordWrap ? 'pre-wrap' : 'pre',
  } as React.CSSProperties;

  return (
    <div className={styles.editView} style={editorStyle}>
      <EditorToolbar
        currentLine={cursorLine}
        currentColumn={cursorColumn}
        totalLines={totalLines}
      />

      {parseError && error && (
        <div className={styles.parseErrorBanner}>
          <span className={styles.parseErrorBannerIcon}>⚠️</span>
          <div className={styles.parseErrorBannerText}>
            <strong>{t("app.error.parseErrorTitle")}</strong>
            <span>{parseError.message} — {t("app.error.parseErrorLocation", { line: parseError.line, column: parseError.column })}</span>
          </div>
        </div>
      )}

      {isLargeEditor && (
        <div className={styles.largeFileBanner}>
          <span className={styles.largeFileBannerIcon}>⚡</span>
          <div className={styles.largeFileBannerText}>
            <strong>{t("editView.largeFile.banner", { size: formatSize(fileSize) })}</strong>
            <span className={styles.largeFileDisabledList}>
              {t("editView.largeFile.noHighlight")} · {t("editView.largeFile.noBracketMatch")}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.editor}>
        {showLineNumbers && (
          <div className={styles.gutter} ref={gutterRef}>
            {highlightedLines.map((line) => (
              <div
                key={line.number}
                className={`${styles.lineNumber} ${line.isMatch ? styles.matchLineNumber : ""} ${line.isCurrentMatch ? styles.currentMatchLineNumber : ""} ${line.number === cursorLine ? styles.currentLineNumber : ""} ${line.hasBracketMatch ? styles.bracketMatchLine : ""}`}
              >
                <span className={styles.lineNumberText}>{line.number}</span>
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
                className={`${styles.line} ${line.isMatch ? styles.matchLine : ""} ${line.isCurrentMatch ? styles.currentMatchLine : ""} ${line.number === cursorLine ? styles.currentLine : ""} ${line.hasBracketMatch ? styles.bracketMatchLine : ""}`}
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
            onPaste={handlePaste}
            onSelect={updateCursorPosition}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label={t("editView.ariaLabel.jsonEditor")}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!!error || editContent === rawJson}
        >
          {t("editView.button.save")}
        </button>
        <button
          className={styles.discardButton}
          onClick={() => setEditContent(rawJson)}
          disabled={editContent === rawJson}
        >
          {t("editView.button.discard")}
        </button>
      </div>
    </div>
  );
}
