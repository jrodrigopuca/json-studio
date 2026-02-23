/**
 * Banner component — Displays info, warning, or error messages.
 *
 * Used for:
 * - Non-standard content-type warnings
 * - Invalid JSON error messages
 * - JSONP detection notices
 */

import { BaseComponent } from '../../base-component.js';
import { createElement } from '../../../shared/dom.js';
import type { AppState } from '../../core/store.types.js';
import type { BannerLevel } from './banner.types.js';

const LEVEL_ICONS: Record<BannerLevel, string> = {
  info: 'ℹ',
  warning: '⚠',
  error: '✗',
};

export class Banner extends BaseComponent {
  private messageEl: HTMLElement | null = null;
  private iconEl: HTMLElement | null = null;

  render(container: HTMLElement): void {
    this.el = createElement('div', {
      className: 'js-banner',
      attributes: { role: 'alert' },
    });

    this.iconEl = createElement('span', { className: 'js-banner__icon' });
    this.messageEl = createElement('span', { className: 'js-banner__message' });

    const dismissBtn = createElement('button', {
      className: 'js-banner__dismiss',
      textContent: '✕',
      attributes: { 'aria-label': 'Dismiss banner' },
    });
    this.on(dismissBtn, 'click', () => this.hide());

    this.el.appendChild(this.iconEl);
    this.el.appendChild(this.messageEl);
    this.el.appendChild(dismissBtn);
    container.appendChild(this.el);

    this.watch(['contentType', 'isValid', 'parseError'], () => this.update({}));
    this.update(this.store.getState());
  }

  update(_state: Partial<AppState>): void {
    const fullState = this.store.getState();

    // Determine banner content based on state
    if (!fullState.isValid && fullState.parseError) {
      const { line, column, message } = fullState.parseError;
      this.show(
        'error',
        `JSON inválido: ${message} (línea ${line}, columna ${column})`,
      );
      return;
    }

    switch (fullState.contentType) {
      case 'text/json':
        this.show(
          'warning',
          '⚠ Content-Type text/json detectado. El estándar es application/json.',
        );
        break;
      case 'text/plain':
        this.show(
          'warning',
          '⚠ Content-Type text/plain pero el contenido es JSON. Considera usar application/json.',
        );
        break;
      case 'unknown':
        this.show('info', 'Content-Type no detectado, pero el contenido parece JSON.');
        break;
      default:
        this.hide();
    }
  }

  show(level: BannerLevel, message: string): void {
    // Reset level classes
    this.el.classList.remove('js-banner--info', 'js-banner--warning', 'js-banner--error');
    this.el.classList.add('js-banner--visible', `js-banner--${level}`);

    if (this.iconEl) {
      this.iconEl.textContent = LEVEL_ICONS[level];
    }
    if (this.messageEl) {
      this.messageEl.textContent = message;
    }
  }

  hide(): void {
    this.el.classList.remove('js-banner--visible');
  }
}
