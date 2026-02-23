/**
 * TreeView component - hierarchical JSON visualization.
 */

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useStore, selectVisibleNodes } from "../../store";
import { getNodeValue, getFormattedNodeValue, copyToClipboard } from "../../core/clipboard";
import { ContextMenu, type ContextMenuPosition } from "../ContextMenu";
import { useToast } from "../Toast";
import { TreeViewHeader } from "./TreeViewHeader";
import type { FlatNode } from "../../core/parser.types";
import styles from "./TreeView.module.css";

export function TreeView() {
  const nodes = useStore((s) => s.nodes);
  const expandedNodes = useStore((s) => s.expandedNodes);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const searchMatches = useStore((s) => s.searchMatches);
  const searchCurrentIndex = useStore((s) => s.searchCurrentIndex);
  const toggleNode = useStore((s) => s.toggleNode);
  const selectNode = useStore((s) => s.selectNode);
  const expandChildren = useStore((s) => s.expandChildren);
  const collapseChildren = useStore((s) => s.collapseChildren);
  const setFocusedNode = useStore((s) => s.setFocusedNode);
  const { show: showToast } = useToast();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    nodeId: number;
  } | null>(null);

  // Get visible nodes (respecting collapsed state and focus)
  const visibleNodes = useMemo(() => {
    return selectVisibleNodes({ nodes, expandedNodes, focusedNodeId } as any);
  }, [nodes, expandedNodes, focusedNodeId]);

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

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: number) => {
    e.preventDefault();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      nodeId,
    });
  }, []);

  // Get the node for context menu (for conditional rendering)
  const contextMenuNode = contextMenu
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  const handleCopyKey = useCallback(async () => {
    if (!contextMenu || !contextMenuNode?.key) return;
    await copyToClipboard(contextMenuNode.key);
    showToast({ message: `Copied: ${contextMenuNode.key}`, type: "success" });
  }, [contextMenu, contextMenuNode, showToast]);

  const handleCopyPath = useCallback(async () => {
    if (!contextMenu) return;
    const node = nodes.find((n) => n.id === contextMenu.nodeId);
    if (node) {
      await copyToClipboard(node.path);
      showToast({ message: `Copied: ${node.path}`, type: "success" });
    }
  }, [contextMenu, nodes, showToast]);

  const handleCopyValue = useCallback(async () => {
    if (!contextMenu) return;
    const value = getNodeValue(nodes, contextMenu.nodeId);
    await copyToClipboard(value);
    showToast({ message: "Value copied to clipboard", type: "success" });
  }, [contextMenu, nodes, showToast]);

  const handleCopyFormattedJson = useCallback(async () => {
    if (!contextMenu) return;
    const value = getFormattedNodeValue(nodes, contextMenu.nodeId);
    await copyToClipboard(value);
    showToast({ message: "Formatted JSON copied", type: "success" });
  }, [contextMenu, nodes, showToast]);

  const handleExpandChildren = useCallback(() => {
    if (!contextMenu) return;
    expandChildren(contextMenu.nodeId);
  }, [contextMenu, expandChildren]);

  const handleCollapseChildren = useCallback(() => {
    if (!contextMenu) return;
    collapseChildren(contextMenu.nodeId);
  }, [contextMenu, collapseChildren]);

  const handleFocusNode = useCallback(() => {
    if (!contextMenu) return;
    setFocusedNode(contextMenu.nodeId);
    // Expand the focused node so we can see its content
    expandChildren(contextMenu.nodeId);
  }, [contextMenu, setFocusedNode, expandChildren]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className={styles.container}>
      <TreeViewHeader />
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
            onContextMenu={handleContextMenu}
          />
        ))}

        {/* Context Menu */}
        {contextMenu && contextMenuNode && (
          <ContextMenu
            position={contextMenu.position}
            node={contextMenuNode}
            isExpanded={expandedNodes.has(contextMenu.nodeId)}
            onCopyKey={handleCopyKey}
            onCopyPath={handleCopyPath}
            onCopyValue={handleCopyValue}
            onCopyFormattedJson={handleCopyFormattedJson}
            onExpandChildren={handleExpandChildren}
            onCollapseChildren={handleCollapseChildren}
            onFocusNode={handleFocusNode}
            onClose={handleCloseContextMenu}
          />
        )}
      </div>
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
  onContextMenu: (e: React.MouseEvent, nodeId: number) => void;
}

function TreeNode({
  node,
  isExpanded,
  isSelected,
  isMatch,
  isCurrentMatch,
  onToggle,
  onSelect,
  onContextMenu,
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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      onContextMenu(e, node.id);
    },
    [node.id, onContextMenu]
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
      onContextMenu={handleContextMenu}
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
  const countLabel = `${node.childCount} ${node.childCount === 1 ? "item" : "items"}`;
  
  return (
    <span className={styles.expandable}>
      <span className={styles.bracket}>{bracket[0]}</span>
      {isExpanded ? (
        <span className={styles.countInline}>{countLabel}</span>
      ) : (
        <>
          <span className={styles.preview}>{countLabel}</span>
          <span className={styles.bracket}>{bracket[1]}</span>
        </>
      )}
    </span>
  );
}

// URL and email detection patterns
const URL_PATTERN = /^(https?:\/\/|www\.)[^\s]+$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUrl(value: string): boolean {
  return URL_PATTERN.test(value);
}

function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

function PrimitiveValue({ node }: { node: FlatNode }) {
  let className = styles.value;
  let content: React.ReactNode = String(node.value);

  switch (node.type) {
    case "string": {
      className = styles.string;
      const str = String(node.value);
      
      // Check for clickable URLs or emails
      if (isUrl(str)) {
        const href = str.startsWith("www.") ? `https://${str}` : str;
        content = (
          <>
            "
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              onClick={(e) => e.stopPropagation()}
            >
              {str}
            </a>
            "
          </>
        );
      } else if (isEmail(str)) {
        content = (
          <>
            "
            <a
              href={`mailto:${str}`}
              className={styles.link}
              onClick={(e) => e.stopPropagation()}
            >
              {str}
            </a>
            "
          </>
        );
      } else {
        content = `"${str}"`;
      }
      break;
    }
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
