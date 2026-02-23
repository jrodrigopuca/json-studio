/**
 * RawView component - syntax-highlighted JSON text.
 */

import { useMemo, useEffect, useRef } from "react";
import { useStore } from "../store";
import { highlightJson } from "../core/highlighter";
import styles from "./RawView.module.css";

export function RawView() {
  const rawJson = useStore((s) => s.rawJson);
  const showLineNumbers = useStore((s) => s.showLineNumbers);
  const searchLineMatches = useStore((s) => s.searchLineMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const searchQuery = useStore((s) => s.searchQuery);

  const currentMatchLine = searchLineMatches[searchCurrentIndex];
  const containerRef = useRef<HTMLDivElement>(null);

  // Split into lines for highlighting
  const lines = useMemo(() => {
    return rawJson.split("\n").map((line, idx) => {
      let content = highlightJson(line) || " ";
      
      // Add inline search highlighting
      if (searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase())) {
        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        content = content.replace(regex, '<mark class="search-match">$1</mark>');
      }
      
      return {
        number: idx + 1,
        content,
        isMatch: searchLineMatches.includes(idx + 1),
        isCurrent: currentMatchLine === idx + 1,
      };
    });
  }, [rawJson, searchLineMatches, currentMatchLine, searchQuery]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchLine !== undefined && containerRef.current) {
      const lineElement = containerRef.current.querySelector(
        `[data-line="${currentMatchLine}"]`
      );
      lineElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentMatchLine]);

  return (
    <div className={styles.rawView} ref={containerRef}>
      {showLineNumbers && (
        <div className={styles.gutter}>
          {lines.map((line) => (
            <div 
              key={line.number} 
              className={`${styles.lineNumber} ${line.isMatch ? styles.matchLineNumber : ""} ${line.isCurrent ? styles.currentMatchLineNumber : ""}`}
            >
              {line.number}
            </div>
          ))}
        </div>
      )}

      <pre className={styles.code}>
        {lines.map((line) => (
          <div
            key={line.number}
            className={`${styles.line} ${line.isMatch ? styles.match : ""} ${
              line.isCurrent ? styles.currentMatch : ""
            }`}
            data-line={line.number}
            dangerouslySetInnerHTML={{ __html: line.content }}
          />
        ))}
      </pre>
    </div>
  );
}
