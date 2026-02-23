/**
 * EditView component - editable JSON with syntax highlighting.
 * Mini-VSCode style editor with formatting controls.
 */

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useStore } from "../../store";
import { highlightJson } from "../../core/highlighter";
import { prettyPrint } from "../../core/formatter";
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

// Find all foldable regions (objects/arrays) by starting line
function findFoldableRegions(text: string): Map<number, { endLine: number; type: '{' | '[' }> {
  const regions = new Map<number, { endLine: number; type: '{' | '[' }>();
  const stack: Array<{ line: number; type: '{' | '[' }> = [];
  const lines = text.split('\n');
  
  let pos = 0;
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (!line) continue;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '{' || char === '[') {
        stack.push({ line: lineNum + 1, type: char });
      } else if (char === '}' || char === ']') {
        const open = stack.pop();
        if (open && open.line < lineNum + 1) {
          regions.set(open.line, { endLine: lineNum + 1, type: open.type });
        }
      }
    }
    pos += line.length + 1;
  }
  return regions;
}

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
  
  // Bracket matching state
  const [matchingBrackets, setMatchingBrackets] = useState<[number, number] | null>(null);
  
  // Fold/unfold state
  const [foldedLines, setFoldedLines] = useState<Set<number>>(new Set());

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
    
    // Check for bracket matching
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
  
  // Toggle fold at line
  const toggleFold = useCallback((lineNum: number) => {
    setFoldedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineNum)) {
        next.delete(lineNum);
      } else {
        next.add(lineNum);
      }
      return next;
    });
  }, []);

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
    const foldableRegions = findFoldableRegions(editContent);
    
    // Calculate bracket positions by line
    let bracket1Line: number | null = null;
    let bracket2Line: number | null = null;
    if (matchingBrackets) {
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
      isCurrentLine: boolean;
      isFoldable: boolean;
      foldInfo: { endLine: number; type: '{' | '[' } | null;
      isFolded: boolean;
      isHidden: boolean;
      hasBracketMatch: boolean;
    }> = [];
    
    // Track which lines are hidden due to folding
    const hiddenRanges: Array<[number, number]> = [];
    for (const [startLine, info] of foldableRegions) {
      if (foldedLines.has(startLine)) {
        hiddenRanges.push([startLine + 1, info.endLine]);
      }
    }
    
    const isLineHidden = (lineNum: number) => 
      hiddenRanges.some(([start, end]) => lineNum >= start && lineNum <= end);
    
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx] ?? '';
      const lineNum = idx + 1;
      let html = highlightJson(line) || " ";
      
      // Highlight search matches within the line
      if (searchQuery && line && line.toLowerCase().includes(searchQuery.toLowerCase())) {
        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        html = html.replace(regex, '<mark class="search-match">$1</mark>');
      }
      
      // Check for bracket matches on this line
      const hasBracketMatch = lineNum === bracket1Line || lineNum === bracket2Line;
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
      
      const foldInfo = foldableRegions.get(lineNum) || null;
      const isFolded = foldedLines.has(lineNum);
      
      // Show fold placeholder if folded
      if (isFolded && foldInfo) {
        const placeholder = foldInfo.type === '{' ? '{ ... }' : '[ ... ]';
        // Find the bracket and add placeholder
        html = html.replace(
          new RegExp(`(\\${foldInfo.type})`),
          `<span class="fold-placeholder">${placeholder}</span>`
        );
      }
      
      result.push({
        number: lineNum,
        html,
        isMatch: searchMatchSet.has(lineNum),
        isCurrentMatch: lineNum === currentMatchLine,
        isCurrentLine: lineNum === cursorLine,
        isFoldable: foldInfo !== null,
        foldInfo,
        isFolded,
        isHidden: isLineHidden(lineNum),
        hasBracketMatch,
      });
    }
    
    return result;
  }, [editContent, searchLineMatches, currentMatchLine, searchQuery, cursorLine, matchingBrackets, foldedLines]);

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

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.editor}>
        {showLineNumbers && (
          <div className={styles.gutter}>
            {highlightedLines.filter(line => !line.isHidden).map((line) => (
              <div
                key={line.number}
                className={`${styles.lineNumber} ${line.isMatch ? styles.matchLineNumber : ""} ${line.isCurrentMatch ? styles.currentMatchLineNumber : ""} ${line.isCurrentLine ? styles.currentLineNumber : ""} ${line.hasBracketMatch ? styles.bracketMatchLine : ""}`}
              >
                {line.isFoldable && (
                  <button
                    className={`${styles.foldButton} ${line.isFolded ? styles.folded : ''}`}
                    onClick={() => toggleFold(line.number)}
                    title={line.isFolded ? 'Unfold' : 'Fold'}
                  >
                    {line.isFolded ? '▶' : '▼'}
                  </button>
                )}
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
            {highlightedLines.filter(line => !line.isHidden).map((line) => (
              <div
                key={line.number}
                ref={(el) => {
                  if (el && line.isMatch) {
                    lineRefs.current.set(line.number, el);
                  }
                }}
                className={`${styles.line} ${line.isMatch ? styles.matchLine : ""} ${line.isCurrentMatch ? styles.currentMatchLine : ""} ${line.isCurrentLine ? styles.currentLine : ""} ${line.hasBracketMatch ? styles.bracketMatchLine : ""}`}
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
