/**
 * DiffView component - compare two JSON documents side by side.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { useStore } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import { highlightJson } from "../../core/highlighter";
import { prettyPrint } from "../../core/formatter";
import { Icon } from "../Icon";
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
  const { t } = useI18n();

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
      setError(e instanceof Error ? e.message : t("diffView.error.invalidJson"));
    }
  }, [compareText, setDiffJson, t]);

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
        setError(err instanceof Error ? err.message : t("diffView.error.invalidJsonFile"));
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = "";
  }, [setDiffJson, t]);

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
        setError(err instanceof Error ? err.message : t("diffView.error.invalidJsonInClipboard"));
      }
    } catch (err) {
      setError(t("diffView.error.failedToReadClipboard"));
    }
  }, [setDiffJson, t]);

  return (
    <div className={styles.diffView}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>{t("diffView.header.original")}</span>
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
          <span className={styles.headerTitle}>{t("diffView.header.compare")}</span>
          {diffJson && (
            <button className={styles.clearButton} onClick={handleClear}>
              {t("diffView.button.clear")}
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
                  <Icon name="folder" size={14} /> {t("diffView.button.openFile")}
                </button>
                <button className={styles.actionButton} onClick={handlePaste}>
                  <Icon name="clipboard" size={14} /> {t("diffView.button.pasteFromClipboard")}
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
                <CodeInput
                  value={compareText}
                  onChange={(value) => {
                    setCompareText(value);
                    setError(null);
                  }}
                  placeholder={t("diffView.placeholder.pasteJson")}
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
                {t("diffView.button.compare")}
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

// Code input with syntax highlighting and line numbers
interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function CodeInput({ value, onChange, placeholder }: CodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  
  const lines = useMemo(() => {
    if (!value) return [];
    return value.split('\n');
  }, [value]);

  // Sync scroll between textarea and pre
  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className={styles.codeInput}>
      <div className={styles.codeLineNumbers}>
        {lines.length > 0 ? (
          lines.map((_, idx) => (
            <div key={idx} className={styles.codeLineNumber}>{idx + 1}</div>
          ))
        ) : (
          <div className={styles.codeLineNumber}>1</div>
        )}
      </div>
      <div className={styles.codeEditor}>
        <pre 
          ref={preRef}
          className={styles.codeHighlight}
          aria-hidden="true"
        >
          {lines.length > 0 ? (
            lines.map((line, idx) => (
              <div 
                key={idx}
                className={styles.codeHighlightLine}
                dangerouslySetInnerHTML={{ __html: highlightJson(line) || " " }}
              />
            ))
          ) : (
            <div className={styles.codePlaceholder}>{placeholder}</div>
          )}
        </pre>
        <textarea
          ref={textareaRef}
          className={styles.codeTextarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          placeholder=""
        />
      </div>
    </div>
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
