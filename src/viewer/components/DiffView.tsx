/**
 * DiffView component - compare two JSON documents side by side.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { useStore } from "../store";
import { highlightJson } from "../core/highlighter";
import { prettyPrint } from "../core/formatter";
import styles from "./DiffView.module.css";

type DiffType = "added" | "removed" | "changed" | "unchanged";

interface DiffLine {
  lineNumber: number;
  content: string;
  type: DiffType;
  pairLine?: number;
}

interface DiffResult {
  left: DiffLine[];
  right: DiffLine[];
  stats: { added: number; removed: number; changed: number };
}

export function DiffView() {
  const rawJson = useStore((s) => s.rawJson);
  const diffJson = useStore((s) => s.diffJson);
  const setDiffJson = useStore((s) => s.setDiffJson);

  const [compareText, setCompareText] = useState(diffJson || "");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format JSON for display
  const formattedOriginal = useMemo(() => {
    try {
      return prettyPrint(rawJson);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  const formattedCompare = useMemo(() => {
    if (!diffJson) return "";
    try {
      return prettyPrint(diffJson);
    } catch {
      return diffJson;
    }
  }, [diffJson]);

  // Compute line-by-line diff
  const diffResult = useMemo((): DiffResult | null => {
    if (!diffJson) return null;

    try {
      const originalLines = formattedOriginal.split("\n");
      const compareLines = formattedCompare.split("\n");

      // Use LCS-based diff
      const { left, right, stats } = computeLineDiff(originalLines, compareLines);
      return { left, right, stats };
    } catch {
      return null;
    }
  }, [formattedOriginal, formattedCompare, diffJson]);

  const handleCompare = useCallback(() => {
    setError(null);
    try {
      JSON.parse(compareText); // Validate
      setDiffJson(compareText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [compareText, setDiffJson]);

  const handleClear = useCallback(() => {
    setDiffJson(null);
    setCompareText("");
    setError(null);
  }, [setDiffJson]);

  const handleFileOpen = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCompareText(content);
      setError(null);
      
      // Auto-compare if valid
      try {
        JSON.parse(content);
        setDiffJson(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid JSON file");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = "";
  }, [setDiffJson]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCompareText(text);
      setError(null);
      
      // Auto-compare if valid
      try {
        JSON.parse(text);
        setDiffJson(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid JSON in clipboard");
      }
    } catch (err) {
      setError("Failed to read clipboard");
    }
  }, [setDiffJson]);

  return (
    <div className={styles.diffView}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>Original (Current)</span>
        </div>
        <div className={styles.headerCenter}>
          {diffResult && (
            <div className={styles.stats}>
              <span className={styles.statAdded}>+{diffResult.stats.added}</span>
              <span className={styles.statRemoved}>-{diffResult.stats.removed}</span>
              <span className={styles.statChanged}>~{diffResult.stats.changed}</span>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.headerTitle}>Compare</span>
          {diffJson && (
            <button className={styles.clearButton} onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Left panel - Original JSON */}
        <div className={styles.panel}>
          <div className={styles.panelContent}>
            {diffResult ? (
              <DiffPanel lines={diffResult.left} side="left" />
            ) : (
              <pre className={styles.jsonPreview}>
                {formattedOriginal.split("\n").map((line, idx) => (
                  <div key={idx} className={styles.line}>
                    <span className={styles.lineNumber}>{idx + 1}</span>
                    <span 
                      className={styles.lineContent}
                      dangerouslySetInnerHTML={{ __html: highlightJson(line) || " " }}
                    />
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>

        {/* Right panel - Compare JSON or Input */}
        <div className={styles.panel}>
          {diffJson ? (
            <div className={styles.panelContent}>
              <DiffPanel lines={diffResult?.right || []} side="right" />
            </div>
          ) : (
            <div className={styles.inputPanel}>
              <div className={styles.inputActions}>
                <button className={styles.actionButton} onClick={handleFileOpen}>
                  📁 Open File
                </button>
                <button className={styles.actionButton} onClick={handlePaste}>
                  📋 Paste from Clipboard
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
              
              <div className={styles.textareaWrapper}>
                <textarea
                  className={styles.textarea}
                  value={compareText}
                  onChange={(e) => {
                    setCompareText(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste or type JSON to compare..."
                  spellCheck={false}
                />
              </div>
              
              {error && (
                <div className={styles.error}>
                  ⚠️ {error}
                </div>
              )}
              
              <button
                className={styles.compareButton}
                onClick={handleCompare}
                disabled={!compareText.trim()}
              >
                Compare
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DiffPanelProps {
  lines: DiffLine[];
  side: "left" | "right";
}

function DiffPanel({ lines, side }: DiffPanelProps) {
  return (
    <pre className={styles.diffPanel}>
      {lines.map((line, idx) => (
        <div 
          key={idx} 
          className={`${styles.diffLine} ${styles[line.type]} ${styles[side]}`}
        >
          <span className={styles.lineNumber}>
            {line.type !== "unchanged" || line.lineNumber > 0 ? line.lineNumber : ""}
          </span>
          <span className={styles.diffMarker}>
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : line.type === "changed" ? "~" : " "}
          </span>
          <span 
            className={styles.lineContent}
            dangerouslySetInnerHTML={{ __html: highlightJson(line.content) || " " }}
          />
        </div>
      ))}
    </pre>
  );
}

// Compute line-by-line diff using simple comparison
function computeLineDiff(
  originalLines: string[],
  compareLines: string[]
): { left: DiffLine[]; right: DiffLine[]; stats: { added: number; removed: number; changed: number } } {
  const stats = { added: 0, removed: 0, changed: 0 };
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  
  const maxLen = Math.max(originalLines.length, compareLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const origLine = originalLines[i];
    const compLine = compareLines[i];
    
    if (origLine === undefined && compLine !== undefined) {
      // Added line
      left.push({ lineNumber: 0, content: "", type: "added" });
      right.push({ lineNumber: i + 1, content: compLine, type: "added" });
      stats.added++;
    } else if (origLine !== undefined && compLine === undefined) {
      // Removed line
      left.push({ lineNumber: i + 1, content: origLine, type: "removed" });
      right.push({ lineNumber: 0, content: "", type: "removed" });
      stats.removed++;
    } else if (origLine !== undefined && compLine !== undefined) {
      if (origLine === compLine) {
        // Unchanged
        left.push({ lineNumber: i + 1, content: origLine, type: "unchanged" });
        right.push({ lineNumber: i + 1, content: compLine, type: "unchanged" });
      } else {
        // Changed
        left.push({ lineNumber: i + 1, content: origLine, type: "changed" });
        right.push({ lineNumber: i + 1, content: compLine, type: "changed" });
        stats.changed++;
      }
    }
  }
  
  return { left, right, stats };
}
