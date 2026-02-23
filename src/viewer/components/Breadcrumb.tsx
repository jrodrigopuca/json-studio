/**
 * Breadcrumb navigation component for tree view.
 */

import { useMemo } from "react";
import { useStore } from "../store";
import styles from "./Breadcrumb.module.css";

export function Breadcrumb() {
  const nodes = useStore((s) => s.nodes);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const expandNode = useStore((s) => s.expandNode);

  // Build breadcrumb path from selected node
  const path = useMemo(() => {
    if (selectedNodeId === null) {
      return [{ id: 0, label: "root" }];
    }

    const result: { id: number; label: string }[] = [];
    let currentId = selectedNodeId;

    while (currentId >= 0) {
      const node = nodes.find((n) => n.id === currentId);
      if (!node) break;

      result.unshift({
        id: node.id,
        label: node.key ?? (node.id === 0 ? "root" : `[${node.id}]`),
      });

      currentId = node.parentId;
    }

    return result.length > 0 ? result : [{ id: 0, label: "root" }];
  }, [nodes, selectedNodeId]);

  const handleClick = (nodeId: number) => {
    selectNode(nodeId);
    expandNode(nodeId);
  };

  return (
    <nav className={styles.breadcrumb} aria-label="JSON path">
      {path.map((item, idx) => (
        <span key={item.id} className={styles.item}>
          {idx > 0 && <span className={styles.separator}>/</span>}
          <button
            className={styles.button}
            onClick={() => handleClick(item.id)}
            aria-current={idx === path.length - 1 ? "location" : undefined}
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
