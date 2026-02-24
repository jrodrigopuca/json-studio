/**
 * RawView component - syntax-highlighted JSON text with virtual scrolling.
 *
 * Only the lines visible in the viewport (plus overscan) are rendered.
 * Each line is absolutely positioned inside a sentinel div whose height
 * equals totalLines * RAW_LINE_HEIGHT.
 */

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "../../store";
import { highlightJson } from "../../core/highlighter";
import { RAW_LINE_HEIGHT } from "@shared/constants";
import styles from "./RawView.module.css";

/** Extra lines rendered above/below viewport. */
const OVERSCAN = 20;

export function RawView() {
  const rawJson = useStore((s) => s.rawJson);
  const showLineNumbers = useStore((s) => s.showLineNumbers);
  const searchLineMatches = useStore((s) => s.searchLineMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const searchQuery = useStore((s) => s.searchQuery);

  const currentMatchLine = searchLineMatches[searchCurrentIndex];
  const viewportRef = useRef<HTMLDivElement>(null);

  // ── Virtual-scroll state ────────────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setViewportHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  // ── Pre-compute raw lines (strings only, no DOM) ────────────────────────
  const rawLines = useMemo(() => rawJson.split("\n"), [rawJson]);
  const totalLines = rawLines.length;
  const totalHeight = totalLines * RAW_LINE_HEIGHT;

  // Build a Set for O(1) match lookup
  const matchSet = useMemo(() => new Set(searchLineMatches), [searchLineMatches]);

  // ── Windowed range ──────────────────────────────────────────────────────
  const startIndex = Math.max(0, Math.floor(scrollTop / RAW_LINE_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalLines,
    Math.ceil((scrollTop + viewportHeight) / RAW_LINE_HEIGHT) + OVERSCAN,
  );

  // Highlight only the windowed lines
  const windowedLines = useMemo(() => {
    const result: Array<{
      number: number;
      content: string;
      isMatch: boolean;
      isCurrent: boolean;
    }> = [];

    const escapedQuery =
      searchQuery
        ? searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        : null;
    const searchRegex = escapedQuery
      ? new RegExp(`(${escapedQuery})`, "gi")
      : null;

    for (let i = startIndex; i < endIndex; i++) {
      const raw = rawLines[i];
      let content = highlightJson(raw ?? "") || " ";

      if (
        searchRegex &&
        searchQuery &&
        (raw ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        content = content.replace(
          searchRegex,
          '<mark class="search-match">$1</mark>',
        );
      }

      const lineNum = i + 1;
      result.push({
        number: lineNum,
        content,
        isMatch: matchSet.has(lineNum),
        isCurrent: currentMatchLine === lineNum,
      });
    }
    return result;
  }, [rawLines, startIndex, endIndex, searchQuery, matchSet, currentMatchLine]);

  // ── Scroll to current search match ──────────────────────────────────────
  useEffect(() => {
    if (currentMatchLine === undefined) return;
    const el = viewportRef.current;
    if (!el) return;

    const targetTop = (currentMatchLine - 1) * RAW_LINE_HEIGHT;
    const targetBottom = targetTop + RAW_LINE_HEIGHT;

    if (targetTop < el.scrollTop || targetBottom > el.scrollTop + viewportHeight) {
      el.scrollTop = targetTop - viewportHeight / 2 + RAW_LINE_HEIGHT / 2;
    }
  }, [currentMatchLine, viewportHeight]);

  // Gutter width based on total line count
  const gutterChars = String(totalLines).length;

  return (
    <div className={styles.rawView} ref={viewportRef} onScroll={handleScroll}>
      <div className={styles.scrollContent} style={{ height: totalHeight }}>
        {windowedLines.map((line) => {
          const top = (line.number - 1) * RAW_LINE_HEIGHT;
          return (
            <div
              key={line.number}
              className={`${styles.lineRow} ${line.isMatch ? styles.match : ""} ${line.isCurrent ? styles.currentMatch : ""}`}
              style={{ top }}
              data-line={line.number}
            >
              {showLineNumbers && (
                <span
                  className={`${styles.lineNumber} ${line.isMatch ? styles.matchLineNumber : ""} ${line.isCurrent ? styles.currentMatchLineNumber : ""}`}
                  style={{ minWidth: `${gutterChars + 1}ch` }}
                >
                  {line.number}
                </span>
              )}
              <span
                className={styles.lineContent}
                dangerouslySetInnerHTML={{ __html: line.content }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
