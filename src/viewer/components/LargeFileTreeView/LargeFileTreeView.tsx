/**
 * LargeFileTreeView — virtualized tree for large JSON files.
 *
 * Only renders the nodes visible in the viewport (+ overscan buffer).
 * Avoids the full selectVisibleNodes scan; computes visible nodes
 * from the flat array respecting expanded state and depth.
 */

import {
	useCallback,
	useMemo,
	useRef,
	useState,
	useEffect,
	type CSSProperties,
} from "react";
import { useStore } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import { NODE_HEIGHT } from "@shared/constants";
import type { FlatNode } from "../../core/parser.types";
import styles from "./LargeFileTreeView.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute the list of visible nodes from flat array + expanded set. */
function computeVisibleNodes(
	nodes: FlatNode[],
	expandedNodes: Set<number>,
): FlatNode[] {
	const result: FlatNode[] = [];
	const hiddenParents = new Set<number>();

	for (const node of nodes) {
		if (node.parentId !== -1 && hiddenParents.has(node.parentId)) {
			if (node.isExpandable) hiddenParents.add(node.id);
			continue;
		}
		result.push(node);
		if (node.isExpandable && !expandedNodes.has(node.id)) {
			hiddenParents.add(node.id);
		}
	}

	return result;
}

/** Format byte count to human-readable string. */
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OVERSCAN = 20; // extra rows above/below viewport

// ─── Component ────────────────────────────────────────────────────────────────

export function LargeFileTreeView() {
	const nodes = useStore((s) => s.nodes);
	const expandedNodes = useStore((s) => s.expandedNodes);
	const selectedNodeId = useStore((s) => s.selectedNodeId);
	const fileSize = useStore((s) => s.fileSize);
	const maxDepth = useStore((s) => s.maxDepth);
	const toggleNode = useStore((s) => s.toggleNode);
	const selectNode = useStore((s) => s.selectNode);
	const collapseAll = useStore((s) => s.collapseAll);
	const expandToLevel = useStore((s) => s.expandToLevel);
	const { t } = useI18n();

	const viewportRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(600);

	// Compute visible nodes (collapsed subtrees hidden)
	const visibleNodes = useMemo(
		() => computeVisibleNodes(nodes, expandedNodes),
		[nodes, expandedNodes],
	);

	const totalHeight = visibleNodes.length * NODE_HEIGHT;

	// Viewport resize observer
	useEffect(() => {
		const el = viewportRef.current;
		if (!el) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) setViewportHeight(entry.contentRect.height);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Scroll handler
	const handleScroll = useCallback(() => {
		const el = viewportRef.current;
		if (el) setScrollTop(el.scrollTop);
	}, []);

	// Windowed slice
	const startIndex = Math.max(0, Math.floor(scrollTop / NODE_HEIGHT) - OVERSCAN);
	const endIndex = Math.min(
		visibleNodes.length,
		Math.ceil((scrollTop + viewportHeight) / NODE_HEIGHT) + OVERSCAN,
	);
	const windowedNodes = visibleNodes.slice(startIndex, endIndex);

	// Node click
	const handleNodeClick = useCallback(
		(node: FlatNode) => {
			selectNode(node.id);
			if (node.isExpandable) {
				toggleNode(node.id);
			}
		},
		[selectNode, toggleNode],
	);

	// Level selector
	const levelOptions = useMemo(() => {
		const max = Math.min(maxDepth, 6);
		const levels: number[] = [];
		for (let i = 1; i <= max; i++) levels.push(i);
		return levels;
	}, [maxDepth]);

	const handleLevelChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			if (value === "collapse") {
				collapseAll();
			} else {
				expandToLevel(parseInt(value, 10));
			}
		},
		[collapseAll, expandToLevel],
	);

	return (
		<div className={styles.container}>
			{/* Warning banner */}
			<div className={styles.banner}>
				<span className={styles.bannerIcon}>⚡</span>
				<span className={styles.bannerText}>
					{t("largeFile.banner")}
				</span>
				<span className={styles.bannerStats}>
					{formatBytes(fileSize)} · {nodes.length.toLocaleString()} {t("largeFile.nodes")}
				</span>
			</div>

			{/* Controls */}
			<div className={styles.controls}>
				<button
					className={styles.button}
					onClick={collapseAll}
					title={t("treeViewHeader.tooltip.collapseAll")}
					type="button"
				>
					<span className={styles.buttonIcon}>▶</span>
					{t("treeViewHeader.button.collapse")}
				</button>

				<label>
					<span className={styles.buttonIcon}>
						{t("treeViewHeader.label.level")}
					</span>
					<select
						className={styles.levelSelect}
						onChange={handleLevelChange}
						title={t("treeViewHeader.tooltip.expandToLevel")}
					>
						<option value="collapse">{t("treeViewHeader.button.collapse")}</option>
						{levelOptions.map((lvl) => (
							<option key={lvl} value={lvl}>
								{lvl}
							</option>
						))}
					</select>
				</label>

				<span className={styles.stats}>
					{visibleNodes.length.toLocaleString()} / {nodes.length.toLocaleString()}{" "}
					{t("largeFile.visible")}
				</span>
			</div>

			{/* Virtual scrolling viewport */}
			<div
				className={styles.viewport}
				ref={viewportRef}
				onScroll={handleScroll}
			>
				<div
					className={styles.scrollContent}
					style={{ height: totalHeight }}
				>
					{windowedNodes.map((node, i) => {
						const index = startIndex + i;
						const top = index * NODE_HEIGHT;
						return (
							<VirtualNode
								key={node.id}
								node={node}
								top={top}
								isExpanded={expandedNodes.has(node.id)}
								isSelected={selectedNodeId === node.id}
								onClick={handleNodeClick}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// ─── VirtualNode ──────────────────────────────────────────────────────────────

interface VirtualNodeProps {
	node: FlatNode;
	top: number;
	isExpanded: boolean;
	isSelected: boolean;
	onClick: (node: FlatNode) => void;
}

function VirtualNode({
	node,
	top,
	isExpanded,
	isSelected,
	onClick,
}: VirtualNodeProps) {
	const style: CSSProperties = {
		top,
		paddingLeft: node.depth * 20 + 8,
	};

	const cls = [styles.node, isSelected && styles.selected]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={cls}
			style={style}
			data-node-id={node.id}
			onClick={() => onClick(node)}
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

// ─── Value renderers ──────────────────────────────────────────────────────────

function ExpandableValue({
	node,
	isExpanded,
}: { node: FlatNode; isExpanded: boolean }) {
	const bracket = node.type === "array" ? ["[", "]"] : ["{", "}"];
	const { t } = useI18n();
	const countLabel =
		node.childCount === 1
			? t("treeView.expandable.item")
			: t("treeView.expandable.items", { count: node.childCount });

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

const URL_PATTERN = /^(https?:\/\/|www\.)[^\s]+$/i;

function PrimitiveValue({ node }: { node: FlatNode }) {
	let className = styles.value;
	let content: React.ReactNode = String(node.value);

	switch (node.type) {
		case "string": {
			className = styles.string;
			const str = String(node.value);
			if (URL_PATTERN.test(str)) {
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
			} else {
				// Truncate very long strings for performance
				content = `"${str.length > 200 ? str.slice(0, 200) + "…" : str}"`;
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
