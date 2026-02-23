/**
 * TreeViewHeader - Controls for expand/collapse and level selection.
 */

import { useMemo } from "react";
import { useStore } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import styles from "./TreeViewHeader.module.css";

export function TreeViewHeader() {
	const nodes = useStore((s) => s.nodes);
	const maxDepth = useStore((s) => s.maxDepth);
	const focusedNodeId = useStore((s) => s.focusedNodeId);
	const expandAll = useStore((s) => s.expandAll);
	const collapseAll = useStore((s) => s.collapseAll);
	const expandToLevel = useStore((s) => s.expandToLevel);
	const setFocusedNode = useStore((s) => s.setFocusedNode);
	const { t } = useI18n();

	// Calculate node count
	const nodeCount = nodes.length;

	// Get focused node info
	const focusedNode = focusedNodeId !== null
		? nodes.find((n) => n.id === focusedNodeId)
		: null;

	// Generate level options (1 to min(maxDepth, 5))
	const levelOptions = useMemo(() => {
		const levels = [];
		const max = Math.min(maxDepth, 5);
		for (let i = 1; i <= max; i++) {
			levels.push(i);
		}
		return levels;
	}, [maxDepth]);

	const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value === "all") {
			expandAll();
		} else {
			expandToLevel(parseInt(value, 10));
		}
	};

	const handleClearFilter = () => {
		setFocusedNode(null);
	};

	return (
		<div className={styles.header}>
			<div className={styles.controls}>
				{focusedNode ? (
					<button
						className={styles.clearFilter}
						onClick={handleClearFilter}
						title={t("treeViewHeader.tooltip.clearFilter")}
						type="button"
					>
						<span className={styles.icon}>✕</span>
						<span className={styles.filterPath}>
							{focusedNode.path}
						</span>
					</button>
				) : (
					<>
						<button
							className={styles.button}
							onClick={expandAll}
						title={t("treeViewHeader.tooltip.expandAll")}
						type="button"
					>
						<span className={styles.icon}>▼</span>
						{t("treeViewHeader.button.expand")}
					</button>
						<button
							className={styles.button}
							onClick={collapseAll}
							title={t("treeViewHeader.tooltip.collapseAll")}
							type="button"
						>
							<span className={styles.icon}>▶</span>
							{t("treeViewHeader.button.collapse")}
						</button>
						
						{levelOptions.length > 1 && (
							<div className={styles.levelControl}>
								<label className={styles.levelLabel}>{t("treeViewHeader.label.level")}</label>
								<select
									className={styles.levelSelect}
									onChange={handleLevelChange}
									title={t("treeViewHeader.tooltip.expandToLevel")}
								>
									<option value="">—</option>
									{levelOptions.map((level) => (
										<option key={level} value={level}>
											{level}
										</option>
									))}
									<option value="all">{t("treeViewHeader.option.all")}</option>
								</select>
							</div>
						)}
					</>
				)}
			</div>

			<div className={styles.stats}>
				<span className={styles.nodeCount}>
					{t("treeViewHeader.stats.nodeCount", { count: nodeCount.toLocaleString() })}
				</span>
			</div>
		</div>
	);
}
