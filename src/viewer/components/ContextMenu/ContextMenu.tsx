/**
 * ContextMenu component for tree nodes.
 * Shows copy options and tree manipulation on right-click.
 */

import { useEffect, useRef } from "react";
import type { FlatNode } from "../../core/parser.types";
import { Icon } from "../Icon";
import styles from "./ContextMenu.module.css";

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface ContextMenuProps {
	position: ContextMenuPosition;
	node: FlatNode;
	isExpanded: boolean;
	onCopyKey: () => void;
	onCopyPath: () => void;
	onCopyValue: () => void;
	onCopyFormattedJson: () => void;
	onExpandChildren: () => void;
	onCollapseChildren: () => void;
	onFocusNode: () => void;
	onClose: () => void;
}

export function ContextMenu({
	position,
	node,
	isExpanded,
	onCopyKey,
	onCopyPath,
	onCopyValue,
	onCopyFormattedJson,
	onExpandChildren,
	onCollapseChildren,
	onFocusNode,
	onClose,
}: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Adjust position to stay within viewport
	useEffect(() => {
		if (!menuRef.current) return;

		const menu = menuRef.current;
		const rect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let x = position.x;
		let y = position.y;

		// Adjust if overflowing right
		if (x + rect.width > viewportWidth) {
			x = viewportWidth - rect.width - 8;
		}

		// Adjust if overflowing bottom
		if (y + rect.height > viewportHeight) {
			y = viewportHeight - rect.height - 8;
		}

		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;
	}, [position]);

	// Close on escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const createHandler = (action: () => void) => () => {
		action();
		onClose();
	};

	const hasKey = node.key !== null;
	const isExpandable = node.isExpandable;

	return (
		<>
			{/* Invisible overlay to capture clicks outside */}
			<div className={styles.overlay} onClick={onClose} />

			<div
				ref={menuRef}
				className={styles.menu}
				role="menu"
				style={{ left: position.x, top: position.y }}
			>
				{/* Copy Section */}
				{hasKey && (
					<button
						className={styles.item}
						role="menuitem"
						onClick={createHandler(onCopyKey)}
					>
						<span className={styles.icon}><Icon name="hash" size={14} /></span>
						Copy Key
					</button>
				)}
				<button
					className={styles.item}
					role="menuitem"
					onClick={createHandler(onCopyPath)}
				>
					<span className={styles.icon}><Icon name="document" size={14} /></span>
					Copy Path
				</button>
				<button
					className={styles.item}
					role="menuitem"
					onClick={createHandler(onCopyValue)}
				>
					<span className={styles.icon}><Icon name="copy" size={14} /></span>
					Copy Value
				</button>
				<button
					className={styles.item}
					role="menuitem"
					onClick={createHandler(onCopyFormattedJson)}
				>
					<span className={styles.icon}><Icon name="star" size={14} /></span>
					Copy Formatted JSON
				</button>

				{/* Expand/Collapse Section (only for expandable nodes) */}
				{isExpandable && (
					<>
						<div className={styles.separator} />
						{isExpanded ? (
							<button
								className={styles.item}
								role="menuitem"
								onClick={createHandler(onCollapseChildren)}
							>
								<span className={styles.icon}><Icon name="folder" size={14} /></span>
								Collapse Children
							</button>
						) : (
							<button
								className={styles.item}
								role="menuitem"
								onClick={createHandler(onExpandChildren)}
							>
								<span className={styles.icon}><Icon name="folder" size={14} /></span>
								Expand Children
							</button>
						)}
						<button
							className={styles.item}
							role="menuitem"
							onClick={createHandler(onFocusNode)}
						>
							<span className={styles.icon}><Icon name="search" size={14} /></span>
							Filter to This
						</button>
					</>
				)}
			</div>
		</>
	);
}
