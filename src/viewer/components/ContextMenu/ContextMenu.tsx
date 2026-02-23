/**
 * ContextMenu component for tree nodes.
 * Shows copy options on right-click.
 */

import { useEffect, useRef } from "react";
import styles from "./ContextMenu.module.css";

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface ContextMenuProps {
	position: ContextMenuPosition;
	onCopyPath: () => void;
	onCopyValue: () => void;
	onClose: () => void;
}

export function ContextMenu({
	position,
	onCopyPath,
	onCopyValue,
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

	const handleCopyPath = () => {
		onCopyPath();
		onClose();
	};

	const handleCopyValue = () => {
		onCopyValue();
		onClose();
	};

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
				<button
					className={styles.item}
					role="menuitem"
					onClick={handleCopyPath}
				>
					<span className={styles.icon}>📍</span>
					Copy Path
				</button>
				<button
					className={styles.item}
					role="menuitem"
					onClick={handleCopyValue}
				>
					<span className={styles.icon}>📋</span>
					Copy Value
				</button>
			</div>
		</>
	);
}
