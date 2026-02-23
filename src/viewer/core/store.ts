/**
 * Minimal pub/sub state management store.
 * Zero dependencies, ~50 lines of core logic.
 *
 * @example
 * ```ts
 * const store = createStore(initialState);
 * store.subscribe(['viewMode', 'theme'], (state, changed) => {
 *   console.log('View or theme changed:', changed);
 * });
 * store.setState({ viewMode: 'raw' });
 * ```
 */

import type { AppState, StateKey, StateListener } from './store.types.js';

interface Subscription {
  keys: StateKey[] | null; // null = subscribe to all
  listener: StateListener;
}

export interface Store {
  /** Returns current state (readonly snapshot). */
  getState(): Readonly<AppState>;

  /** Merges partial state and notifies relevant subscribers. */
  setState(partial: Partial<AppState>): void;

  /**
   * Subscribe to state changes.
   * @param keys - State keys to watch, or null for all changes.
   * @param listener - Callback when watched keys change.
   * @returns Unsubscribe function.
   */
  subscribe(keys: StateKey[] | null, listener: StateListener): () => void;

  /** Removes all subscriptions. */
  dispose(): void;
}

/**
 * Creates a new store with the given initial state.
 */
export function createStore(initialState: AppState): Store {
  let state: AppState = { ...initialState };
  const subscriptions: Set<Subscription> = new Set();

  function getState(): Readonly<AppState> {
    return state;
  }

  function setState(partial: Partial<AppState>): void {
    const changedKeys: StateKey[] = [];

    for (const key of Object.keys(partial) as StateKey[]) {
      const newValue = partial[key];
      if (state[key] !== newValue) {
        changedKeys.push(key);
      }
    }

    if (changedKeys.length === 0) return;

    state = { ...state, ...partial };

    for (const sub of subscriptions) {
      if (sub.keys === null || sub.keys.some((k) => changedKeys.includes(k))) {
        sub.listener(state, changedKeys);
      }
    }
  }

  function subscribe(
    keys: StateKey[] | null,
    listener: StateListener,
  ): () => void {
    const sub: Subscription = { keys, listener };
    subscriptions.add(sub);
    return () => {
      subscriptions.delete(sub);
    };
  }

  function dispose(): void {
    subscriptions.clear();
  }

  return { getState, setState, subscribe, dispose };
}
