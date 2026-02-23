/**
 * EditorToolbar - Mini toolbar for edit mode with formatting controls.
 */

import { useStore } from '../../store';
import { useI18n } from '../../hooks/useI18n';
import { Icon } from '../Icon';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  currentLine: number;
  currentColumn: number;
  totalLines: number;
}

export function EditorToolbar({ currentLine, currentColumn, totalLines }: EditorToolbarProps) {
  const editorIndentSize = useStore((s) => s.editorIndentSize);
  const editorWordWrap = useStore((s) => s.editorWordWrap);
  const editorFontSize = useStore((s) => s.editorFontSize);
  const toggleEditorIndent = useStore((s) => s.toggleEditorIndent);
  const toggleEditorWordWrap = useStore((s) => s.toggleEditorWordWrap);
  const setEditorFontSize = useStore((s) => s.setEditorFontSize);
  const { t } = useI18n();

  return (
    <div className={styles.toolbar}>
      {/* Indent control */}
      <button
        className={`${styles.control} ${styles.active}`}
        onClick={toggleEditorIndent}
        title={t("editorToolbar.tooltip.indent", { size: editorIndentSize === "tab" ? t("editorToolbar.label.tab") : t("editorToolbar.label.spaces", { n: editorIndentSize }) })}
      >
        <Icon name="chevron-right" size={12} />
        <span className={styles.label}>
          {editorIndentSize === "tab" ? t("editorToolbar.label.tab") : t("editorToolbar.label.spaces", { n: editorIndentSize })}
        </span>
      </button>

      {/* Word wrap toggle */}
      <button
        className={`${styles.control} ${editorWordWrap ? styles.active : ''}`}
        onClick={toggleEditorWordWrap}
        title={editorWordWrap ? t("editorToolbar.tooltip.wordWrapOn") : t("editorToolbar.tooltip.wordWrapOff")}
      >
        <Icon name="chevron-down" size={12} />
        <span className={styles.label}>{t("editorToolbar.label.wrap")}</span>
      </button>

      {/* Font size controls */}
      <div className={styles.fontControls}>
        <button
          className={styles.fontButton}
          onClick={() => setEditorFontSize(editorFontSize - 1)}
          disabled={editorFontSize <= 10}
          title={t("editorToolbar.tooltip.decreaseFontSize")}
        >
          A−
        </button>
        <span className={styles.fontSize}>{editorFontSize}px</span>
        <button
          className={styles.fontButton}
          onClick={() => setEditorFontSize(editorFontSize + 1)}
          disabled={editorFontSize >= 24}
          title={t("editorToolbar.tooltip.increaseFontSize")}
        >
          A+
        </button>
      </div>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Cursor position */}
      <div className={styles.info}>
        <span className={styles.position}>
          {t("editorToolbar.info.cursorPosition", { line: currentLine, col: currentColumn })}
        </span>
        <span className={styles.separator}>|</span>
        <span className={styles.lines}>{t("editorToolbar.info.totalLines", { count: totalLines })}</span>
        <span className={styles.separator}>|</span>
        <span className={styles.encoding}>UTF-8</span>
        <span className={styles.separator}>|</span>
        <span className={styles.language}>JSON</span>
      </div>
    </div>
  );
}
