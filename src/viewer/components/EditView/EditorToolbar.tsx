/**
 * EditorToolbar - Mini toolbar for edit mode with formatting controls.
 */

import { useStore } from '../../store';
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

  return (
    <div className={styles.toolbar}>
      {/* Indent control */}
      <button
        className={`${styles.control} ${styles.active}`}
        onClick={toggleEditorIndent}
        title={`Indentación: ${editorIndentSize === "tab" ? "Tab" : `${editorIndentSize} espacios`} (click para cambiar)`}
      >
        <Icon name="chevron-right" size={12} />
        <span className={styles.label}>
          {editorIndentSize === "tab" ? "Tab" : `${editorIndentSize}sp`}
        </span>
      </button>

      {/* Word wrap toggle */}
      <button
        className={`${styles.control} ${editorWordWrap ? styles.active : ''}`}
        onClick={toggleEditorWordWrap}
        title={editorWordWrap ? "Word wrap: activado" : "Word wrap: desactivado"}
      >
        <Icon name="chevron-down" size={12} />
        <span className={styles.label}>Wrap</span>
      </button>

      {/* Font size controls */}
      <div className={styles.fontControls}>
        <button
          className={styles.fontButton}
          onClick={() => setEditorFontSize(editorFontSize - 1)}
          disabled={editorFontSize <= 10}
          title="Reducir tamaño de fuente"
        >
          A−
        </button>
        <span className={styles.fontSize}>{editorFontSize}px</span>
        <button
          className={styles.fontButton}
          onClick={() => setEditorFontSize(editorFontSize + 1)}
          disabled={editorFontSize >= 24}
          title="Aumentar tamaño de fuente"
        >
          A+
        </button>
      </div>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Cursor position */}
      <div className={styles.info}>
        <span className={styles.position}>
          Ln {currentLine}, Col {currentColumn}
        </span>
        <span className={styles.separator}>|</span>
        <span className={styles.lines}>{totalLines} líneas</span>
        <span className={styles.separator}>|</span>
        <span className={styles.encoding}>UTF-8</span>
        <span className={styles.separator}>|</span>
        <span className={styles.language}>JSON</span>
      </div>
    </div>
  );
}
