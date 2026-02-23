/**
 * TreeViewHeader - Controls for expand/collapse and level selection.
 */

import { useMemo } from "react";
import { useStore } from "../../store";
import styles from "./TreeViewHeader.module.css";

export function TreeViewHeader() {
	const nodes = useStore((s) => s.nodes);
	const maxDepth = useStore((s) => s.maxDepth);
	const expandAll = useStore((s) => s.expandAll);
	const collapseAll = useStore((s) => s.collapseAll);
	const expandToLevel = useStore((s) => s.expandToLevel);

	// Calculate node count
	const nodeCount = nodes.length;

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

	return (
		<div className={styles.header}>
			<div className={styles.controls}>
				<button
					className={styles.button}
					onClick={expandAll}
					title="Expand All (⌥E)"
					type="button"
				>
					<span className={styles.icon}>▼</span>
					Expand
				</button>
				<button
					className={styles.button}
					onClick={collapseAll}
					title="Collapse All (⌥C)"
					type="button"
				>
					<span className={styles.icon}>▶</span>
					Collapse
				</button>
				
				{levelOptions.length > 1 && (
					<div className={styles.levelControl}>
						<label className={styles.levelLabel}>Level:</label>
						<select
							className={styles.levelSelect}
							onChange={handleLevelChange}
							title="Expand to specific depth level"
						>
							<option value="">—</option>
							{levelOptions.map((level) => (
								<option key={level} value={level}>
									{level}
								</option>
							))}
							<option value="all">All</option>
						</select>
					</div>
				)}
			</div>

			<div className={styles.stats}>
				<span className={styles.nodeCount}>
					{nodeCount.toLocaleString()} nodes
				</span>
			</div>
		</div>
	);
}
