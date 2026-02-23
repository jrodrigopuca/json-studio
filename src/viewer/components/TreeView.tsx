/**
 * TreeView component - hierarchical JSON visualization.
 */

import { useCallback, useMemo, useRef, useEffect } from "react";
import { useStore, selectVisibleNodes } from "../store";
import type { FlatNode } from "../core/parser.types";
import styles from "./TreeView.module.css";

export function TreeView() {
  const nodes = useStore((s) => s.nodes);
  const expandedNodes = useStore((s) => s.expandedNodes);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const searchMatches = useStore((s) => s.searchMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const toggleNode = useStore((s) => s.toggleNode);
  const selectNode = useStore((s) => s.selectNode);

  // Get visible nodes (respecting collapsed state)
  const visibleNodes = useMemo(() => {
    return selectVisibleNodes({ nodes, expandedNodes } as any);
  }, [nodes, expandedNodes]);

  // Current search match
  const currentMatch = searchMatches[searchCurrentIndex];

  // Scroll to current match
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (currentMatch !== undefined) {
      const element = containerRef.current?.querySelector(
        `[data-node-id="${currentMatch}"]`
      );
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentMatch]);

  return (
    <div className={styles.tree} ref={containerRef} role="tree">
      {visibleNodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          isExpanded={expandedNodes.has(node.id)}
          isSelected={selectedNodeId === node.id}
          isMatch={searchMatches.includes(node.id)}
          isCurrentMatch={currentMatch === node.id}
          onToggle={toggleNode}
          onSelect={selectNode}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: FlatNode;
  isExpanded: boolean;
  isSelected: boolean;
  isMatch: boolean;
  isCurrentMatch: boolean;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
}

function TreeNode({
  node,
  isExpanded,
  isSelected,
  isMatch,
  isCurrentMatch,
  onToggle,
  onSelect,
}: TreeNodeProps) {
  const handleClick = useCallback(() => {
    onSelect(node.id);
    if (node.isExpandable) {
      onToggle(node.id);
    }
  }, [node.id, node.isExpandable, onSelect, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Build class names
  const classNames = [
    styles.node,
    isSelected && styles.selected,
    isMatch && styles.match,
    isCurrentMatch && styles.currentMatch,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      data-node-id={node.id}
      role="treeitem"
      aria-expanded={node.isExpandable ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Expand/collapse toggle */}
      {node.isExpandable && (
        <span className={styles.toggle}>
          {isExpanded ? "▼" : "▶"}
        </span>
      )}

      {/* Key */}
      {node.key !== null && (
        <>
          <span className={styles.key}>"{node.key}"</span>
          <span className={styles.colon}>:</span>
        </>
      )}

      {/* Value */}
      {node.isExpandable ? (
        <ExpandableValue node={node} isExpanded={isExpanded} />
      ) : (
        <PrimitiveValue node={node} />
      )}
    </div>
  );
}

function ExpandableValue({ node, isExpanded }: { node: FlatNode; isExpanded: boolean }) {
  const bracket = node.type === "array" ? ["[", "]"] : ["{", "}"];
  
  return (
    <span className={styles.expandable}>
      <span className={styles.bracket}>{bracket[0]}</span>
      {!isExpanded && (
        <>
          <span className={styles.preview}>
            {node.childCount} {node.childCount === 1 ? "item" : "items"}
          </span>
          <span className={styles.bracket}>{bracket[1]}</span>
        </>
      )}
    </span>
  );
}

function PrimitiveValue({ node }: { node: FlatNode }) {
  let className = styles.value;
  let content = String(node.value);

  switch (node.type) {
    case "string":
      className = styles.string;
      content = `"${node.value}"`;
      break;
    case "number":
      className = styles.number;
      break;
    case "boolean":
      className = styles.boolean;
      break;
    case "null":
      className = styles.null;
      content = "null";
      break;
  }

  return <span className={className}>{content}</span>;
}
