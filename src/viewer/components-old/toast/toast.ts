/**
 * Toast notification component.
 * Shows temporary messages that auto-dismiss.
 */

import { createElement } from "../../../shared/dom.js";
import "./toast.css";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
	message: string;
	type?: ToastType;
	duration?: number;
}

class ToastManager {
	private container: HTMLElement | null = null;

	/**
	 * Shows a toast notification.
	 */
	show(options: ToastOptions): void {
		const { message, type = "info", duration = 3000 } = options;

		if (!this.container) {
			this.container = createElement("div", {
				className: "js-toast-container",
			});
			document.body.appendChild(this.container);
		}

		const toast = createElement("div", {
			className: `js-toast js-toast--${type}`,
		});

		const icon = this.getIcon(type);
		const iconEl = createElement("span", {
			className: "js-toast__icon",
			textContent: icon,
		});

		const messageEl = createElement("span", {
			className: "js-toast__message",
			textContent: message,
		});

		const closeBtn = createElement("button", {
			className: "js-toast__close",
			textContent: "×",
			attributes: { "aria-label": "Close notification" },
		});

		toast.appendChild(iconEl);
		toast.appendChild(messageEl);
		toast.appendChild(closeBtn);

		this.container.appendChild(toast);

		// Animate in
		requestAnimationFrame(() => {
			toast.classList.add("js-toast--visible");
		});

		// Auto dismiss
		const dismissTimeout = setTimeout(() => this.dismiss(toast), duration);

		// Manual close
		closeBtn.addEventListener("click", () => {
			clearTimeout(dismissTimeout);
			this.dismiss(toast);
		});
	}

	/**
	 * Dismisses a toast with animation.
	 */
	private dismiss(toast: HTMLElement): void {
		toast.classList.remove("js-toast--visible");
		toast.classList.add("js-toast--hiding");

		toast.addEventListener("transitionend", () => {
			toast.remove();
		});
	}

	/**
	 * Gets the icon for a toast type.
	 */
	private getIcon(type: ToastType): string {
		switch (type) {
			case "success":
				return "✓";
			case "error":
				return "✕";
			case "warning":
				return "⚠";
			case "info":
			default:
				return "ℹ";
		}
	}
}

// Singleton instance
export const toast = new ToastManager();
