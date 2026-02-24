/**
 * TreeView component - hierarchical JSON visualization with virtual scrolling.
 *
 * Only the nodes visible in the viewport (plus an overscan buffer) are
 * rendered as real DOM elements.  Each node is absolutely positioned inside
 * a tall sentinel div whose height equals visibleNodes.length * NODE_HEIGHT.
 */

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useStore, selectVisibleNodes } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import { getNodeValue, getFormattedNodeValue, copyToClipboard } from "../../core/clipboard";
import { ContextMenu, type ContextMenuPosition } from "../ContextMenu";
import { useToast } from "../Toast";
import { TreeViewHeader } from "./TreeViewHeader";
import { NODE_HEIGHT } from "@shared/constants";
import type { FlatNode } from "../../core/parser.types";
import styles from "./TreeView.module.css";

/** Extra rows rendered above/below the viewport for smoother scrolling. */
const OVERSCAN = 15;

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
  const { t } = useI18n();

  // ── Virtual-scroll state ────────────────────────────────────────────────
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  // Track viewport size
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

  // ── Context menu state ──────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    nodeId: number;
  } | null>(null);

  // ── Visible nodes (collapsed subtrees hidden, focus applied) ────────────
  const visibleNodes = useMemo(() => {
    return selectVisibleNodes({ nodes, expandedNodes, focusedNodeId } as any);
  }, [nodes, expandedNodes, focusedNodeId]);

  // Build a Set for O(1) search-match lookup
  const searchMatchSet = useMemo(() => new Set(searchMatches), [searchMatches]);

  // Current search match
  const currentMatch = searchMatches[searchCurrentIndex];

  // ── Scroll to current search match ──────────────────────────────────────
  useEffect(() => {
    if (currentMatch === undefined) return;
    const idx = visibleNodes.findIndex((n) => n.id === currentMatch);
    if (idx === -1) return;
    const el = viewportRef.current;
    if (!el) return;

    const targetTop = idx * NODE_HEIGHT;
    const targetBottom = targetTop + NODE_HEIGHT;

    // Only scroll if the match is outside the visible area
    if (targetTop < el.scrollTop || targetBottom > el.scrollTop + viewportHeight) {
      el.scrollTop = targetTop - viewportHeight / 2 + NODE_HEIGHT / 2;
    }
  }, [currentMatch, visibleNodes, viewportHeight]);

  // ── Windowed slice ──────────────────────────────────────────────────────
  const totalHeight = visibleNodes.length * NODE_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / NODE_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    visibleNodes.length,
    Math.ceil((scrollTop + viewportHeight) / NODE_HEIGHT) + OVERSCAN,
  );
  const windowedNodes = visibleNodes.slice(startIndex, endIndex);

  // ── Context menu handlers ───────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: number) => {
    e.preventDefault();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      nodeId,
    });
  }, []);

  const contextMenuNode = contextMenu
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  const handleCopyKey = useCallback(async () => {
    if (!contextMenu || !contextMenuNode?.key) return;
    await copyToClipboard(contextMenuNode.key);
    showToast({ message: t("treeView.toast.copiedKey", { key: contextMenuNode.key }), type: "success" });
  }, [contextMenu, contextMenuNode, showToast, t]);

  const handleCopyPath = useCallback(async () => {
    if (!contextMenu) return;
    const node = nodes.find((n) => n.id === contextMenu.nodeId);
    if (node) {
      await copyToClipboard(node.path);
      showToast({ message: t("treeView.toast.copiedPath", { path: node.path }), type: "success" });
    }
  }, [contextMenu, nodes, showToast, t]);

  const handleCopyValue = useCallback(async () => {
    if (!contextMenu) return;
    const value = getNodeValue(nodes, contextMenu.nodeId);
    await copyToClipboard(value);
    showToast({ message: t("treeView.toast.valueCopied"), type: "success" });
  }, [contextMenu, nodes, showToast, t]);

  const handleCopyFormattedJson = useCallback(async () => {
    if (!contextMenu) return;
    const value = getFormattedNodeValue(nodes, contextMenu.nodeId);
    await copyToClipboard(value);
    showToast({ message: t("treeView.toast.formattedJsonCopied"), type: "success" });
  }, [contextMenu, nodes, showToast, t]);

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
    expandChildren(contextMenu.nodeId);
  }, [contextMenu, setFocusedNode, expandChildren]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className={styles.container}>
      <TreeViewHeader />
      <div
        className={styles.tree}
        ref={viewportRef}
        role="tree"
        onScroll={handleScroll}
      >
        <div className={styles.scrollContent} style={{ height: totalHeight }}>
          {windowedNodes.map((node, i) => {
            const index = startIndex + i;
            return (
              <TreeNode
                key={node.id}
                node={node}
                top={index * NODE_HEIGHT}
                isExpanded={expandedNodes.has(node.id)}
                isSelected={selectedNodeId === node.id}
                isMatch={searchMatchSet.has(node.id)}
                isCurrentMatch={currentMatch === node.id}
                onToggle={toggleNode}
                onSelect={selectNode}
                onContextMenu={handleContextMenu}
              />
            );
          })}
        </div>

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

// ─── TreeNode ─────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: FlatNode;
  top: number;
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
  top,
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
      style={{ top, paddingLeft: node.depth * 20 + 8 }}
      data-node-id={node.id}
      role="treeitem"
      aria-expanded={node.isExpandable ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
    >
      {node.isExpandable && (
        <span className={styles.toggle}>
          {isExpanded ? "▼" : "▶"}
        </span>
      )}

      {node.key !== null && (
        <>
          <span className={styles.key}>"{node.key}"</span>
          <span className={styles.colon}>:</span>
        </>
      )}

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
  const { t } = useI18n();
  const countLabel = node.childCount === 1 ? t("treeView.expandable.item") : t("treeView.expandable.items", { count: node.childCount });
  
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
