/**
 * Raw View component — Displays JSON as syntax-highlighted text.
 */

import { BaseComponent } from '../../base-component.js';
import { createElement } from '../../../shared/dom.js';
import { highlightJson } from '../../core/highlighter.js';
import { prettyPrint } from '../../core/formatter.js';
import type { AppState } from '../../core/store.types.js';

export class RawView extends BaseComponent {
  private codeEl: HTMLElement | null = null;

  render(container: HTMLElement): void {
    this.el = createElement('div', {
      className: 'js-raw-view js-main',
      attributes: {
        role: 'region',
        'aria-label': 'Raw JSON view',
        tabindex: '0',
      },
    });

    this.codeEl = createElement('pre', { className: 'js-raw-view__code' });
    this.el.appendChild(this.codeEl);
    container.appendChild(this.el);

    this.watch(['rawJson', 'isValid', 'parseError'], () => this.update({}));
    this.update(this.store.getState());
  }

  update(_state: Partial<AppState>): void {
    if (!this.codeEl) return;

    const fullState = this.store.getState();

    if (fullState.isValid) {
      const formatted = prettyPrint(fullState.rawJson);
      this.codeEl.innerHTML = highlightJson(formatted);
    } else {
      // Show raw content with error line highlighted
      this.codeEl.textContent = fullState.rawJson;
    }
  }
}
