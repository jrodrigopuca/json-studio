/**
 * Base class for all UI components.
 * Provides lifecycle management, DOM helpers, and automatic cleanup.
 *
 * @example
 * ```ts
 * class MyComponent extends BaseComponent {
 *   render(container: HTMLElement) {
 *     this.el = document.createElement('div');
 *     container.appendChild(this.el);
 *   }
 *   update(state: Partial<AppState>) {
 *     // React to state changes
 *   }
 * }
 * ```
 */

import type { AppState } from "./core/store.types.js";
import type { Store } from "./core/store.js";

export abstract class BaseComponent {
	protected el!: HTMLElement;
	protected store: Store;
	private disposables: Array<() => void> = [];

	constructor(store: Store) {
		this.store = store;
	}

	/** Renders the component into the given container. */
	abstract render(container: HTMLElement): void;

	/** Updates the component with new state. */
	abstract update(state: Partial<AppState>): void;

	/**
	 * Registers an event listener with automatic cleanup on dispose.
	 *
	 * @param el - Target element
	 * @param event - Event name
	 * @param handler - Event handler
	 * @param options - addEventListener options
	 */
	protected on<K extends keyof HTMLElementEventMap>(
		el: HTMLElement | Window | Document,
		event: K,
		handler: (e: HTMLElementEventMap[K]) => void,
		options?: AddEventListenerOptions,
	): void {
		el.addEventListener(event, handler as EventListener, options);
		this.disposables.push(() => {
			el.removeEventListener(event, handler as EventListener, options);
		});
	}

	/**
	 * Subscribes to store changes with automatic cleanup on dispose.
	 *
	 * @param keys - State keys to watch
	 * @param listener - Callback
	 */
	protected watch(
		keys: (keyof AppState)[],
		listener: (state: AppState, changed: (keyof AppState)[]) => void,
	): void {
		const unsub = this.store.subscribe(keys, listener);
		this.disposables.push(unsub);
	}

	/**
	 * Adds any disposable (function) that will run on component dispose.
	 */
	protected addDisposable(fn: () => void): void {
		this.disposables.push(fn);
	}

	/**
	 * Cleans up all event listeners, subscriptions, and DOM.
	 */
	dispose(): void {
		for (const dispose of this.disposables) {
			dispose();
		}
		this.disposables = [];
		this.el?.remove();
	}
}
