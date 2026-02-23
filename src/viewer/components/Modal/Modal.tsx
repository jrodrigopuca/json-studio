/**
 * Modal component for confirmations and dialogs.
 */

import { useEffect, useCallback, useState, type ReactNode } from "react";
import { formatSize } from "../../core/formatter";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}

export function Modal({ isOpen, title, children, onClose, actions }: ModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
        </header>
        <div className={styles.content}>{children}</div>
        {actions && <footer className={styles.actions}>{actions}</footer>}
      </div>
    </div>
  );
}

// Convenience component for unsaved changes confirmation
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Cambios sin guardar"
      onClose={onCancel}
      actions={
        <>
          <button className={styles.buttonSecondary} onClick={onCancel}>
            Cancelar
          </button>
          <button className={styles.buttonSecondary} onClick={onDiscard}>
            Descartar cambios
          </button>
          <button className={styles.buttonPrimary} onClick={onSave}>
            Guardar cambios
          </button>
        </>
      }
    >
      <p>Tienes cambios sin guardar en el editor. ¿Qué deseas hacer?</p>
    </Modal>
  );
}

// Modal for saving current JSON to favorites
interface SaveJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentSize: number;
  savedCount: number;
  maxSize?: number;
  maxCount?: number;
}

export function SaveJsonModal({
  isOpen,
  onClose,
  onSave,
  currentSize,
  savedCount,
  maxSize = 500 * 1024,
  maxCount = 10,
}: SaveJsonModalProps) {
  const [name, setName] = useState("");
  const isOverSize = currentSize > maxSize;
  const isOverCount = savedCount >= maxCount;
  const canSave = name.trim() && !isOverSize && !isOverCount;

  const handleSave = () => {
    if (canSave) {
      onSave(name.trim());
      setName("");
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Guardar JSON"
      onClose={handleClose}
      actions={
        <>
          <button className={styles.buttonSecondary} onClick={handleClose}>
            Cancelar
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={handleSave}
            disabled={!canSave}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className={styles.saveForm}>
        <input
          type="text"
          className={styles.input}
          placeholder="Nombre del guardado..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <p className={styles.saveInfo}>
          Tamaño: {formatSize(currentSize)}
          {isOverSize && (
            <span className={styles.warning}> (máx: {formatSize(maxSize)})</span>
          )}
        </p>
        <p className={styles.saveInfo}>
          {savedCount}/{maxCount} guardados
          {isOverCount && <span className={styles.warning}> (límite alcanzado)</span>}
        </p>
      </div>
    </Modal>
  );
}

// Modal for keyboard shortcuts reference
interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "Navegación",
    items: [
      { keys: ["⌥", "1"], desc: "Vista Tree" },
      { keys: ["⌥", "2"], desc: "Vista Raw" },
      { keys: ["⌥", "3"], desc: "Vista Table" },
      { keys: ["⌥", "4"], desc: "Vista Diff" },
      { keys: ["⌥", "5"], desc: "Vista Edit" },
      { keys: ["⌥", "6"], desc: "Vista Saved" },
    ],
  },
  {
    category: "Búsqueda",
    items: [
      { keys: ["⌘", "F"], desc: "Abrir búsqueda" },
      { keys: ["⌥", "F"], desc: "Abrir búsqueda (alternativa)" },
      { keys: ["Esc"], desc: "Cerrar búsqueda" },
      { keys: ["↑", "↓"], desc: "Resultado anterior/siguiente" },
      { keys: ["Enter"], desc: "Ir al siguiente resultado" },
    ],
  },
  {
    category: "Tree View",
    items: [
      { keys: ["⌥", "E"], desc: "Expandir todos los nodos" },
      { keys: ["⌥", "C"], desc: "Colapsar todos los nodos" },
      { keys: ["⌥", "S"], desc: "Ordenar por keys (ciclo)" },
    ],
  },
  {
    category: "Raw / Edit View",
    items: [
      { keys: ["⌥", "L"], desc: "Toggle números de línea" },
    ],
  },
  {
    category: "Edición",
    items: [
      { keys: ["⌘", "Z"], desc: "Deshacer" },
      { keys: ["⌘", "⇧", "Z"], desc: "Rehacer" },
      { keys: ["⌘", "S"], desc: "Guardar cambios (en Edit)" },
    ],
  },
  {
    category: "General",
    items: [
      { keys: ["?"], desc: "Mostrar/ocultar esta ayuda" },
    ],
  },
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Atajos de teclado"
      onClose={onClose}
      actions={
        <button className={styles.buttonPrimary} onClick={onClose}>
          Cerrar
        </button>
      }
    >
      <div className={styles.shortcutsGrid}>
        {SHORTCUTS.map((section) => (
          <div key={section.category} className={styles.shortcutsSection}>
            <h3 className={styles.shortcutsCategory}>{section.category}</h3>
            <dl className={styles.shortcutsList}>
              {section.items.map((item, idx) => (
                <div key={idx} className={styles.shortcutItem}>
                  <dt className={styles.shortcutKeys}>
                    {item.keys.map((k, i) => (
                      <kbd key={i} className={styles.kbd}>{k}</kbd>
                    ))}
                  </dt>
                  <dd className={styles.shortcutDesc}>{item.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Modal>
  );
}
